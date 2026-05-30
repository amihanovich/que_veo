-- Allows an authenticated user to permanently delete their own account.
-- Deleting the auth.users row cascades to profiles, moments, search_history,
-- title_feedback, etc. (all reference auth.users(id) ON DELETE CASCADE).
create or replace function public.delete_user()
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if auth.uid() is null then
    raise exception 'Not authenticated';
  end if;
  delete from auth.users where id = auth.uid();
end;
$$;

revoke all on function public.delete_user() from public, anon;
grant execute on function public.delete_user() to authenticated;
