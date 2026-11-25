-- Only an Auth-admin invitation grants membership. User metadata is display-only.
create function private.enroll_invited_user() returns trigger language plpgsql security definer set search_path='' as $$
begin
 if new.invited_at is not null then
  perform private.enroll_user(new.id,'familia-2026',coalesce(nullif(new.raw_user_meta_data->>'name',''),split_part(new.email,'@',1),'Familiar'));
 end if;
 return new;
end $$;
revoke all on function private.enroll_invited_user() from public,anon,authenticated;
create trigger enroll_invited_user after insert or update of invited_at on auth.users for each row execute function private.enroll_invited_user();
