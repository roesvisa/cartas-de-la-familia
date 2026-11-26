begin;
insert into auth.users(id,email) values('00000000-0000-4000-8000-000000000021','daily-test@example.invalid');
insert into public.collections values('daily-test','Daily test','','2026');
insert into public.cards(id,collection_id,number,title,category,image_url,available_in_packs) values('daily-one','daily-test',1,'One','Común','',true);
select private.enroll_user('00000000-0000-4000-8000-000000000021','daily-test','Daily test');
select set_config('request.jwt.claim.sub','00000000-0000-4000-8000-000000000021',true);
do $$
declare uid uuid:='00000000-0000-4000-8000-000000000021'; snap jsonb; pid uuid; deadline timestamptz; available_count integer; result jsonb;
begin
 snap:=public.collection_snapshot('daily-test');
 if snap->>'nextPackAt' is not null then raise exception 'Full inventory should not have a timer'; end if;
 select id into pid from public.packs where user_id=uid and collection_id='daily-test' and status='available' limit 1;
 result:=public.open_pack('daily-test',pid);
 deadline:=(result->'snapshot'->>'nextPackAt')::timestamptz;
 if deadline is null or abs(extract(epoch from (deadline-clock_timestamp()))-86400)>5 then raise exception 'First opening must start 24 hours'; end if;
 -- Simulate one hour elapsed. A subsequent opening must keep the nearest deadline.
 deadline:=clock_timestamp()+interval '23 hours';
 update public.memberships set next_pack_at=deadline where user_id=uid and collection_id='daily-test';
 select id into pid from public.packs where user_id=uid and collection_id='daily-test' and status='available' limit 1;
 result:=public.open_pack('daily-test',pid);
 if (result->'snapshot'->>'nextPackAt')::timestamptz<>deadline then raise exception 'Second opening reset cycle'; end if;
 result:=public.open_pack('daily-test',pid);
 if (result->'snapshot'->>'nextPackAt')::timestamptz<>deadline then raise exception 'Retry reset cycle'; end if;
 if (select count(*) from public.packs where user_id=uid and collection_id='daily-test' and status='available')<>1 then raise exception 'Retry spent another pack'; end if;
 deadline:=clock_timestamp()-interval '1 second';
 update public.memberships set next_pack_at=deadline where user_id=uid and collection_id='daily-test';
 snap:=public.collection_snapshot('daily-test');
 if (snap->>'nextPackAt')::timestamptz<>deadline+interval '24 hours' then raise exception 'Next cycle drifted from original deadline'; end if;
 snap:=public.collection_snapshot('daily-test');
 if (select count(*) from public.packs where user_id=uid and collection_id='daily-test' and status='available')<>2 then raise exception 'Repeated load duplicated a refill'; end if;
 for pid in select id from public.packs where user_id=uid and collection_id='daily-test' and status='available' loop
  perform public.open_pack('daily-test',pid);
 end loop;
 deadline:=clock_timestamp()-interval '25 hours';
 update public.memberships set next_pack_at=deadline where user_id=uid and collection_id='daily-test';
 snap:=public.collection_snapshot('daily-test');
 if (select count(*) from public.packs where user_id=uid and collection_id='daily-test' and status='available')<>2 then raise exception 'Offline catchup should credit two packs'; end if;
 if (snap->>'nextPackAt')::timestamptz<>deadline+interval '48 hours' then raise exception 'Catchup deadline incorrect'; end if;
 update public.memberships set next_pack_at=clock_timestamp()-interval '7 days' where user_id=uid and collection_id='daily-test';
 snap:=public.collection_snapshot('daily-test');
 if (select count(*) from public.packs where user_id=uid and collection_id='daily-test' and status='available')<>3 or snap->>'nextPackAt' is not null then raise exception 'Week away must cap at three and stop timer'; end if;
 select id into pid from public.packs where user_id=uid and collection_id='daily-test' and status='available' limit 1;
 result:=public.open_pack('daily-test',pid);
 deadline:=(result->'snapshot'->>'nextPackAt')::timestamptz;
 if deadline is null or abs(extract(epoch from (deadline-clock_timestamp()))-86400)>5 then raise exception 'Opening after cap must start a fresh 24 hours'; end if;
 -- Opening directly after time away reconciles the capacity before consuming.
 update public.memberships set next_pack_at=clock_timestamp()-interval '7 days' where user_id=uid and collection_id='daily-test';
 select id into pid from public.packs where user_id=uid and collection_id='daily-test' and status='available' limit 1;
 result:=public.open_pack('daily-test',pid);
 if (select count(*) from public.packs where user_id=uid and collection_id='daily-test' and status='available')<>2 then raise exception 'Opening failed to reconcile pending refill'; end if;
end $$;
set local role authenticated;
do $$ begin
 perform public.collection_snapshot('daily-test');
 begin update public.memberships set next_pack_at=now(); raise exception 'Client can edit deadline'; exception when insufficient_privilege then null; end;
 begin perform public.collection_snapshot('unrelated-collection'); raise exception 'Unauthorized refill'; exception when insufficient_privilege then null; end;
end $$;
reset role;
select 'PASS: 24h cycle, unchanged deadline, retry, offline catchup, 3-pack cap, fresh cycle, authenticated access and denied writes' as result;
rollback;
