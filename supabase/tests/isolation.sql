begin;
insert into auth.users(id,email) values('00000000-0000-4000-8000-000000000001','test-a@example.invalid'),('00000000-0000-4000-8000-000000000002','test-b@example.invalid');
select private.enroll_user('00000000-0000-4000-8000-000000000001','familia-2026','Prueba A');
select private.enroll_user('00000000-0000-4000-8000-000000000002','familia-2026','Prueba B');
select private.enroll_user('00000000-0000-4000-8000-000000000001','familia-2026','Prueba A');
select set_config('request.jwt.claim.sub','00000000-0000-4000-8000-000000000001',true);
set local role authenticated;
do $$
declare pid uuid; first_draw jsonb; retry_draw jsonb; snap jsonb;
begin
 if (select count(*) from public.packs)<>3 then raise exception 'RLS packs or enroll idempotency failed'; end if;
 if (select count(*) from public.profiles)<>1 then raise exception 'Profile isolation failed'; end if;
 select id into pid from public.packs limit 1;
 first_draw:=public.open_pack('familia-2026',pid);
 retry_draw:=public.open_pack('familia-2026',pid);
 if (first_draw #- '{snapshot,serverNow}')<>(retry_draw #- '{snapshot,serverNow}') then raise exception 'Pack retry changed result'; end if;
 if jsonb_array_length(first_draw->'revealed')<>3 then raise exception 'Expected three cards'; end if;
 if (select sum(quantity) from public.inventory)<>3 then raise exception 'Inventory persisted incorrectly'; end if;
 if (select count(*) from public.packs where status='available')<>2 then raise exception 'Incorrect remaining packs'; end if;
 snap:=public.collection_snapshot('familia-2026');
 if jsonb_array_length(snap->'inventories')<>1 then raise exception 'Private inventories leaked'; end if;
 if not (snap->'leaderboard' @> '[{"id":"00000000-0000-4000-8000-000000000001"},{"id":"00000000-0000-4000-8000-000000000002"}]'::jsonb) then raise exception 'Shared ranking missing'; end if;
 begin
  update public.inventory set quantity=999;
  raise exception 'Client could change inventory';
 exception when insufficient_privilege then null; end;
 begin
  perform public.collection_snapshot('another-collection');
  raise exception 'Cross collection access allowed';
 exception when insufficient_privilege then null; end;
end $$;
reset role;
select set_config('request.jwt.claim.sub','00000000-0000-4000-8000-000000000002',true);
set local role authenticated;
do $$
begin
 if (select count(*) from public.inventory)<>0 then raise exception 'Other inventory exposed'; end if;
 if (select count(*) from public.pack_cards)<>0 then raise exception 'Other draws exposed'; end if;
 begin
  perform public.open_pack('familia-2026','00000000-0000-4000-8000-000000000099');
  raise exception 'Unauthorized pack opened';
 exception when insufficient_privilege then null; end;
end $$;
reset role;
set local role anon;
do $$ begin
 begin perform public.collection_snapshot('familia-2026'); raise exception 'Anonymous access allowed'; exception when insufficient_privilege then null; end;
end $$;
reset role;
select 'PASS: isolated inventories, aggregate ranking, atomic/idempotent draws, denied writes, anonymous access blocked' as result;
rollback;
