begin;
insert into auth.users(id,email) values('00000000-0000-4000-8000-000000000011','rank-first@example.invalid'),('00000000-0000-4000-8000-000000000012','rank-later@example.invalid');
insert into public.collections values('ranking-test','Ranking test','','2026');
insert into public.cards(id,collection_id,number,title,category,image_url) values('rank-one','ranking-test',1,'One','Común',''),('rank-two','ranking-test',2,'Two','Común','');
select private.enroll_user('00000000-0000-4000-8000-000000000011','ranking-test','Zoe');
select private.enroll_user('00000000-0000-4000-8000-000000000012','ranking-test','Ana');
update public.profiles set name='Zoe' where id='00000000-0000-4000-8000-000000000011';
update public.profiles set name='Ana' where id='00000000-0000-4000-8000-000000000012';
insert into public.inventory values('00000000-0000-4000-8000-000000000011','ranking-test','rank-one',2),('00000000-0000-4000-8000-000000000012','ranking-test','rank-one',1);
do $$
declare a uuid; b uuid; duplicate_pack uuid; snap jsonb;
begin
 select id into a from public.packs where user_id='00000000-0000-4000-8000-000000000011' and collection_id='ranking-test' limit 1;
 select id into b from public.packs where user_id='00000000-0000-4000-8000-000000000012' and collection_id='ranking-test' limit 1;
 select id into duplicate_pack from public.packs where user_id='00000000-0000-4000-8000-000000000011' and collection_id='ranking-test' and id<>a limit 1;
 update public.packs set status='opened',opened_at='2026-01-01 12:00:00.000001+00' where id=a;
 update public.packs set status='opened',opened_at='2026-01-01 12:00:00.000002+00' where id=b;
 update public.packs set status='opened',opened_at='2026-01-02 12:00:00+00' where id=duplicate_pack;
 insert into public.pack_cards values(a,1,'rank-one',false),(b,1,'rank-one',false),(duplicate_pack,1,'rank-one',true);
 perform set_config('request.jwt.claim.sub','00000000-0000-4000-8000-000000000011',true);
 snap:=public.collection_snapshot('ranking-test');
 if snap->'leaderboard'->0->>'name'<>'Zoe' then raise exception 'Chronological tie or duplicate-only pack failed'; end if;
 insert into public.inventory values('00000000-0000-4000-8000-000000000012','ranking-test','rank-two',1);
 insert into public.pack_cards values(b,2,'rank-two',false);
 snap:=public.collection_snapshot('ranking-test');
 if snap->'leaderboard'->0->>'name'<>'Ana' then raise exception 'Unique count must take priority'; end if;
end $$;
select 'PASS: first achiever wins, microsecond precision, duplicates ignored, higher unique count wins' as result;
rollback;
