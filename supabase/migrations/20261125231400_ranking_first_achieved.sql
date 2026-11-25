-- Preserve timestamp precision: chronological ties are resolved in Postgres.
create or replace function private.collection_snapshot(cid text) returns jsonb language plpgsql security definer set search_path='' as $$
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
