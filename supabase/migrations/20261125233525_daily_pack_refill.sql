-- One server-authoritative refill clock per user and collection.
alter table public.memberships add column next_pack_at timestamptz;
-- Existing accounts start at their first opening; time away is credited on next load.
update public.memberships m set next_pack_at=(
 select min(p.opened_at) + interval '24 hours' from public.packs p
 where p.user_id=m.user_id and p.collection_id=m.collection_id and p.status='opened'
) where (select count(*) from public.packs p where p.user_id=m.user_id and p.collection_id=m.collection_id and p.status='available')<3;

create function private.replenish_packs(cid text) returns void language plpgsql security definer set search_path='' as $$
declare uid uuid:=auth.uid(); deadline timestamptz; current_time_at timestamptz; available_count integer; earned integer;
begin
 if uid is null then raise exception 'Debes iniciar sesión.' using errcode='42501'; end if;
 select next_pack_at into deadline from public.memberships where user_id=uid and collection_id=cid for update;
 if not found then raise exception 'No tienes acceso a esta colección.' using errcode='42501'; end if;
 current_time_at:=clock_timestamp();
 select count(*) into available_count from public.packs where user_id=uid and collection_id=cid and status='available';
 if available_count>=3 then
  update public.memberships set next_pack_at=null where user_id=uid and collection_id=cid;
 elsif deadline is not null and deadline<=current_time_at then
  earned:=least(3-available_count, floor(extract(epoch from (current_time_at-deadline))/86400)+1)::integer;
  insert into public.packs(user_id,collection_id) select uid,cid from generate_series(1,earned);
  update public.memberships set next_pack_at=case when available_count+earned>=3 then null else deadline+earned*interval '24 hours' end
    where user_id=uid and collection_id=cid;
 end if;
end $$;
-- Only the existing authenticated entry points call this internal function.
revoke all on function private.replenish_packs(text) from public,anon,authenticated;

-- Preserve timestamp precision: chronological ties are resolved in Postgres.
create or replace function private.collection_snapshot(cid text) returns jsonb language plpgsql security definer set search_path='' as $$
declare uid uuid := auth.uid(); result jsonb;
begin
 if uid is null or not exists(select 1 from public.memberships where user_id=uid and collection_id=cid) then raise exception 'No tienes acceso a esta colección.' using errcode='42501'; end if;
 perform private.replenish_packs(cid);
 select jsonb_build_object(
 'serverNow',clock_timestamp(),
 'nextPackAt',(select next_pack_at from public.memberships where user_id=uid and collection_id=cid),
 'user',(select jsonb_build_object('id',id,'name',name,'initials',initials,'avatarUrl',avatar_url) from public.profiles where id=uid),
 'collection',(select to_jsonb(c) from public.collections c where id=cid),
 'cards',(select coalesce(jsonb_agg(jsonb_build_object('id',id,'collectionId',collection_id,'number',number,'title',title,'category',category,'imageUrl',image_url,'realisticImageUrl',realistic_image_url,'realisticImagePosition',realistic_image_position,'availableInPacks',available_in_packs) order by number),'[]') from public.cards where collection_id=cid),
 'packs',(select coalesce(jsonb_agg(jsonb_build_object('id',id,'userId',user_id,'collectionId',collection_id,'status',status) order by id),'[]') from public.packs where user_id=uid and collection_id=cid),
 'inventories',jsonb_build_array(jsonb_build_object('userId',uid,'collectionId',cid,'quantities',(select coalesce(jsonb_object_agg(card_id,quantity),'{}') from public.inventory where user_id=uid and collection_id=cid))),
 'users','[]'::jsonb,
 'leaderboard',(
   with scores as (
     select p.id,p.name,p.initials,p.avatar_url,
       (select count(*) from public.inventory i where i.user_id=p.id and i.collection_id=cid) as unique_count,
       -- Only first discoveries advance this timestamp; duplicate-only packs do not.
       (select max(pk.opened_at) from public.packs pk join public.pack_cards pc on pc.pack_id=pk.id
         where pk.user_id=p.id and pk.collection_id=cid and pk.status='opened' and not pc.duplicate) as reached_at
     from public.profiles p join public.memberships m on m.user_id=p.id where m.collection_id=cid
   ), ordered as (
     select *,row_number() over(order by unique_count desc,reached_at asc nulls last,id) as position from scores
   )
   select coalesce(jsonb_agg(jsonb_build_object('id',id,'name',name,'initials',initials,'avatarUrl',avatar_url,
     'unique',unique_count,'position',position) order by position),'[]') from ordered
 )
 ) into result;
 return result;
end $$;

create or replace function private.open_pack(cid text,pid uuid) returns jsonb language plpgsql security definer set search_path='' as $$
declare uid uuid:=auth.uid(); p public.packs; chosen text; prior integer; idx integer; snap jsonb; reveal jsonb;
begin
 if uid is null then raise exception 'Debes iniciar sesión.' using errcode='42501'; end if;
 perform 1 from public.memberships where user_id=uid and collection_id=cid for update;
 if not found then raise exception 'No tienes acceso a esta colección.' using errcode='42501'; end if;
 perform private.replenish_packs(cid);
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
  update public.packs set status='opened',opened_at=clock_timestamp() where id=pid;
  update public.memberships set next_pack_at=coalesce(next_pack_at,clock_timestamp()+interval '24 hours') where user_id=uid and collection_id=cid;
 end if;
 snap:=private.collection_snapshot(cid);
 select jsonb_agg(jsonb_build_object('card',(select c from jsonb_array_elements(snap->'cards') c where c->>'id'=pc.card_id),'duplicate',pc.duplicate) order by pc.position) into reveal from public.pack_cards pc where pc.pack_id=pid;
 return jsonb_build_object('snapshot',snap,'revealed',reveal);
end $$;
