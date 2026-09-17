-- Run in a disposable Supabase branch or local instance after creating two test users.
-- Replace the UUID placeholders, then execute each block in a transaction.
begin;
set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"00000000-0000-4000-8000-000000000001","role":"authenticated"}', true);
select id, user_id from public.orders;
select p.id, p.order_id from public.order_photos p;
update public.orders set status = 'completed' where user_id <> auth.uid();
insert into public.admin_users (user_id) values (auth.uid());
rollback;
-- Repeat as user 2 and confirm no user 1 booking/photo is visible.
