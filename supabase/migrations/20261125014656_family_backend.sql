-- Applied with Supabase migrations. No real users or credentials are seeded.
create schema if not exists private;
revoke all on schema private from public, anon;
grant usage on schema private to authenticated;
create table public.collections(id text primary key, name text not null, description text not null, year text not null);
create table public.cards(
 id text primary key, collection_id text not null references public.collections,
 number integer not null check(number > 0), title text not null, category text not null,
 image_url text not null, realistic_image_url text, realistic_image_position text,
 available_in_packs boolean not null default false,
 unique(collection_id, number), unique(collection_id,id)
);
create table public.profiles(id uuid primary key references auth.users on delete cascade, name text not null, initials text not null, avatar_url text);
create table public.memberships(user_id uuid references public.profiles on delete cascade, collection_id text references public.collections, primary key(user_id,collection_id));
create table public.packs(id uuid primary key default gen_random_uuid(), user_id uuid not null, collection_id text not null, status text not null default 'available' check(status in ('available','opened')), opened_at timestamptz, foreign key(user_id,collection_id) references public.memberships on delete cascade);
create table public.inventory(user_id uuid not null, collection_id text not null, card_id text not null, quantity integer not null check(quantity>0), primary key(user_id,collection_id,card_id), foreign key(user_id,collection_id) references public.memberships on delete cascade, foreign key(collection_id,card_id) references public.cards(collection_id,id));
create table public.pack_cards(pack_id uuid references public.packs on delete cascade, position integer check(position between 1 and 3), card_id text references public.cards, duplicate boolean not null, primary key(pack_id,position));
create index packs_owner on public.packs(user_id,collection_id);
create index inventory_card on public.inventory(collection_id,card_id);
create index membership_collection on public.memberships(collection_id);
create index pack_cards_card on public.pack_cards(card_id);

alter table public.collections enable row level security;
alter table public.cards enable row level security;
alter table public.profiles enable row level security;
alter table public.memberships enable row level security;
alter table public.packs enable row level security;
alter table public.inventory enable row level security;
alter table public.pack_cards enable row level security;
revoke all on public.collections,public.cards,public.profiles,public.memberships,public.packs,public.inventory,public.pack_cards from anon,authenticated;
grant select on public.collections,public.cards,public.profiles,public.memberships,public.packs,public.inventory,public.pack_cards to authenticated;
create policy own_memberships on public.memberships for select to authenticated using(user_id=(select auth.uid()));
create policy member_collections on public.collections for select to authenticated using(exists(select 1 from public.memberships m where m.collection_id=collections.id and m.user_id=(select auth.uid())));
create policy member_cards on public.cards for select to authenticated using(exists(select 1 from public.memberships m where m.collection_id=cards.collection_id and m.user_id=(select auth.uid())));
create policy own_profile on public.profiles for select to authenticated using(id=(select auth.uid()));
create policy own_packs on public.packs for select to authenticated using(user_id=(select auth.uid()));
create policy own_inventory on public.inventory for select to authenticated using(user_id=(select auth.uid()));
create policy own_draws on public.pack_cards for select to authenticated using(exists(select 1 from public.packs p where p.id=pack_cards.pack_id and p.user_id=(select auth.uid())));

-- Only aggregate scores leave other users' private inventories.
create function private.collection_snapshot(cid text) returns jsonb language plpgsql security definer set search_path='' as $$
declare uid uuid := auth.uid(); result jsonb;
begin
 if uid is null or not exists(select 1 from public.memberships where user_id=uid and collection_id=cid) then raise exception 'No tienes acceso a esta colección.' using errcode='42501'; end if;
 select jsonb_build_object(
 'user',(select jsonb_build_object('id',id,'name',name,'initials',initials,'avatarUrl',avatar_url) from public.profiles where id=uid),
 'collection',(select to_jsonb(c) from public.collections c where id=cid),
 'cards',(select coalesce(jsonb_agg(jsonb_build_object('id',id,'collectionId',collection_id,'number',number,'title',title,'category',category,'imageUrl',image_url,'realisticImageUrl',realistic_image_url,'realisticImagePosition',realistic_image_position,'availableInPacks',available_in_packs) order by number),'[]') from public.cards where collection_id=cid),
 'packs',(select coalesce(jsonb_agg(jsonb_build_object('id',id,'userId',user_id,'collectionId',collection_id,'status',status) order by id),'[]') from public.packs where user_id=uid and collection_id=cid),
 'inventories',jsonb_build_array(jsonb_build_object('userId',uid,'collectionId',cid,'quantities',(select coalesce(jsonb_object_agg(card_id,quantity),'{}') from public.inventory where user_id=uid and collection_id=cid))),
 'users','[]'::jsonb,
 'leaderboard',(select coalesce(jsonb_agg(jsonb_build_object('id',p.id,'name',p.name,'initials',p.initials,'avatarUrl',p.avatar_url,'unique',(select count(*) from public.inventory i where i.user_id=p.id and i.collection_id=cid))),'[]') from public.profiles p join public.memberships m on m.user_id=p.id where m.collection_id=cid)
 ) into result;
 return result;
end $$;
revoke all on function private.collection_snapshot(text) from public,anon;
grant execute on function private.collection_snapshot(text) to authenticated;
create function public.collection_snapshot(cid text) returns jsonb language sql security invoker set search_path='' as $$ select private.collection_snapshot(cid) $$;
revoke all on function public.collection_snapshot(text) from public,anon;
grant execute on function public.collection_snapshot(text) to authenticated;

-- A retry of the same pack returns the original draw; row locks serialize concurrent opens.
create function private.open_pack(cid text,pid uuid) returns jsonb language plpgsql security definer set search_path='' as $$
declare uid uuid:=auth.uid(); p public.packs; chosen text; prior integer; idx integer; snap jsonb; reveal jsonb;
begin
 if uid is null then raise exception 'Debes iniciar sesión.' using errcode='42501'; end if;
 perform 1 from public.memberships where user_id=uid and collection_id=cid for update;
 if not found then raise exception 'No tienes acceso a esta colección.' using errcode='42501'; end if;
 select * into p from public.packs where id=pid and user_id=uid and collection_id=cid for update;
 if not found then raise exception 'Sobre no disponible.' using errcode='42501'; end if;
 if p.status='available' then
  for idx in 1..3 loop
   select id into chosen from public.cards where collection_id=cid and available_in_packs order by random() limit 1;
   if chosen is null then raise exception 'La colección todavía no tiene cartas disponibles.'; end if;
   select quantity into prior from public.inventory where user_id=uid and collection_id=cid and card_id=chosen;
   insert into public.pack_cards values(pid,idx,chosen,coalesce(prior,0)>0);
   insert into public.inventory values(uid,cid,chosen,1) on conflict(user_id,collection_id,card_id) do update set quantity=public.inventory.quantity+1;
  end loop;
  update public.packs set status='opened',opened_at=now() where id=pid;
 end if;
 snap:=private.collection_snapshot(cid);
 select jsonb_agg(jsonb_build_object('card',(select c from jsonb_array_elements(snap->'cards') c where c->>'id'=pc.card_id),'duplicate',pc.duplicate) order by pc.position) into reveal from public.pack_cards pc where pc.pack_id=pid;
 return jsonb_build_object('snapshot',snap,'revealed',reveal);
end $$;
revoke all on function private.open_pack(text,uuid) from public,anon;
grant execute on function private.open_pack(text,uuid) to authenticated;
create function public.open_pack(cid text,pid uuid) returns jsonb language sql security invoker set search_path='' as $$ select private.open_pack(cid,pid) $$;
revoke all on function public.open_pack(text,uuid) from public,anon;
grant execute on function public.open_pack(text,uuid) to authenticated;

-- Dashboard/SQL Editor only: creates membership and exactly three initial packs once.
create function private.enroll_user(uid uuid,cid text,display_name text) returns void language plpgsql security invoker set search_path='' as $$
begin
 insert into public.profiles(id,name,initials) values(uid,display_name,upper(left(display_name,2))) on conflict(id) do nothing;
 insert into public.memberships values(uid,cid) on conflict do nothing;
 if found then insert into public.packs(user_id,collection_id) select uid,cid from generate_series(1,3); end if;
end $$;
revoke all on function private.enroll_user(uuid,text,text) from public,anon,authenticated;

insert into public.collections values ('familia-2026','Cartas de la Familia','Tu colección familiar','2026');
insert into public.cards values ('moment-1','familia-2026','1','Lucía Sandoval','Común','./cards/optimized/lucia.jpg','./figma/6b38c.png','left','true');
insert into public.cards values ('moment-2','familia-2026','2','Rodrigo','Común','./cards/optimized/rodrigo.jpg','./cards/optimized/rodrigo.jpg','left','true');
insert into public.cards values ('moment-3','familia-2026','3','El alfarero','Común','./cards/optimized/alfarero.jpg',null,'left','true');
insert into public.cards values ('moment-4','familia-2026','4','Carta por descubrir 4','Común','',null,'left','false');
insert into public.cards values ('moment-5','familia-2026','5','Carta por descubrir 5','Común','',null,'left','false');
insert into public.cards values ('moment-6','familia-2026','6','Carta por descubrir 6','Común','',null,'left','false');
insert into public.cards values ('moment-7','familia-2026','7','Carta por descubrir 7','Común','',null,'left','false');
insert into public.cards values ('moment-8','familia-2026','8','Carta por descubrir 8','Común','',null,'left','false');
insert into public.cards values ('moment-9','familia-2026','9','Carta por descubrir 9','Común','',null,'left','false');
insert into public.cards values ('moment-10','familia-2026','10','Carta por descubrir 10','Común','',null,'left','false');
insert into public.cards values ('moment-11','familia-2026','11','Carta por descubrir 11','Común','',null,'left','false');
insert into public.cards values ('moment-12','familia-2026','12','Carta por descubrir 12','Común','',null,'left','false');
insert into public.cards values ('moment-13','familia-2026','13','Carta por descubrir 13','Común','',null,'left','false');
insert into public.cards values ('moment-14','familia-2026','14','Carta por descubrir 14','Común','',null,'left','false');
insert into public.cards values ('moment-15','familia-2026','15','Carta por descubrir 15','Común','',null,'left','false');
insert into public.cards values ('moment-16','familia-2026','16','Carta por descubrir 16','Común','',null,'left','false');
insert into public.cards values ('moment-17','familia-2026','17','Carta por descubrir 17','Común','',null,'left','false');
insert into public.cards values ('moment-18','familia-2026','18','Carta por descubrir 18','Común','',null,'left','false');
insert into public.cards values ('moment-19','familia-2026','19','Carta por descubrir 19','Rara','',null,'left','false');
insert into public.cards values ('moment-20','familia-2026','20','Carta por descubrir 20','Rara','',null,'left','false');
insert into public.cards values ('moment-21','familia-2026','21','Carta por descubrir 21','Rara','',null,'left','false');
insert into public.cards values ('moment-22','familia-2026','22','Carta por descubrir 22','Rara','',null,'left','false');
insert into public.cards values ('moment-23','familia-2026','23','Carta por descubrir 23','Rara','',null,'left','false');
insert into public.cards values ('moment-24','familia-2026','24','Carta por descubrir 24','Rara','',null,'left','false');
insert into public.cards values ('moment-25','familia-2026','25','Carta por descubrir 25','Rara','',null,'left','false');
insert into public.cards values ('moment-26','familia-2026','26','Carta por descubrir 26','Rara','',null,'left','false');
insert into public.cards values ('moment-27','familia-2026','27','Carta por descubrir 27','Especial','',null,'left','false');
insert into public.cards values ('moment-28','familia-2026','28','Carta por descubrir 28','Especial','',null,'left','false');
insert into public.cards values ('moment-29','familia-2026','29','Carta por descubrir 29','Especial','',null,'left','false');
insert into public.cards values ('moment-30','familia-2026','30','Carta por descubrir 30','Especial','',null,'left','false');
