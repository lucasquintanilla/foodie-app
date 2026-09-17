create extension if not exists pgcrypto;

create schema if not exists private;
revoke all on schema private from public, anon, authenticated;

create type public.order_status as enum (
  'awaiting_payment', 'requested', 'confirmed', 'in_progress', 'completed',
  'cancellation_requested', 'cancelled', 'expired', 'refunded'
);
create type public.payment_status as enum ('pending', 'paid', 'failed', 'refunded');

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text check (char_length(full_name) <= 120),
  phone text check (char_length(phone) <= 40),
  address_line_1 text check (char_length(address_line_1) <= 160),
  address_line_2 text check (char_length(address_line_2) <= 160),
  city text check (char_length(city) <= 80),
  county text check (char_length(county) <= 80),
  eircode text check (char_length(eircode) <= 16),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.services (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  name text not null check (char_length(name) between 2 and 160),
  description text not null check (char_length(description) between 2 and 2000),
  category text not null check (char_length(category) between 2 and 80),
  image_url text not null check (image_url ~ '^https://'),
  base_estimate_cents integer not null check (base_estimate_cents >= 0),
  currency text not null default 'EUR' check (currency = 'EUR'),
  is_active boolean not null default true,
  is_add_on boolean not null default false,
  intake_schema jsonb not null default '[]'::jsonb check (jsonb_typeof(intake_schema) = 'array'),
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.orders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete restrict,
  environment text not null default 'staging' check (environment in ('staging', 'production')),
  status public.order_status not null default 'awaiting_payment',
  payment_status public.payment_status not null default 'pending',
  contact_name text not null check (char_length(contact_name) between 1 and 120),
  contact_email text not null check (char_length(contact_email) between 3 and 320),
  contact_phone text not null check (char_length(contact_phone) between 1 and 40),
  address_line_1 text not null check (char_length(address_line_1) between 1 and 160),
  address_line_2 text check (char_length(address_line_2) <= 160),
  city text not null check (char_length(city) between 1 and 80),
  county text not null check (char_length(county) between 1 and 80),
  eircode text check (char_length(eircode) <= 16),
  preferred_date date not null,
  preferred_time text not null check (char_length(preferred_time) between 1 and 120),
  confirmed_start_at timestamptz,
  notes text check (char_length(notes) <= 3000),
  internal_notes text check (char_length(internal_notes) <= 5000),
  assigned_staff text check (char_length(assigned_staff) <= 160),
  estimated_total_cents integer not null check (estimated_total_cents >= 0),
  confirmed_total_cents integer check (confirmed_total_cents >= 0),
  booking_fee_cents integer not null default 1000 check (booking_fee_cents = 1000),
  terms_version text not null check (char_length(terms_version) <= 80),
  terms_accepted_at timestamptz not null,
  early_performance_requested boolean not null default false,
  early_performance_acknowledged boolean not null default false,
  early_performance_accepted_at timestamptz,
  cancellation_requested_at timestamptz,
  cancellation_reason text check (char_length(cancellation_reason) <= 2000),
  stripe_checkout_session_id text unique,
  stripe_payment_intent_id text unique,
  stripe_refund_id text unique,
  idempotency_key uuid not null unique,
  paid_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (not early_performance_requested or early_performance_acknowledged),
  check (early_performance_acknowledged or early_performance_accepted_at is null)
);

create table public.order_items (
  id bigint generated always as identity primary key,
  order_id uuid not null references public.orders(id) on delete cascade,
  service_id uuid references public.services(id) on delete set null,
  service_name text not null check (char_length(service_name) between 1 and 160),
  category text not null check (char_length(category) between 1 and 80),
  unit_estimate_cents integer not null check (unit_estimate_cents >= 0),
  quantity smallint not null check (quantity between 1 and 20),
  line_estimate_cents integer generated always as (unit_estimate_cents * quantity) stored,
  created_at timestamptz not null default now()
);

create table public.order_answers (
  id bigint generated always as identity primary key,
  order_id uuid not null references public.orders(id) on delete cascade,
  service_id uuid references public.services(id) on delete set null,
  question_id text not null check (char_length(question_id) between 1 and 80),
  question_label text not null check (char_length(question_label) between 1 and 300),
  answer text not null check (char_length(answer) between 1 and 2000),
  created_at timestamptz not null default now(),
  unique (order_id, service_id, question_id)
);

create table public.order_photos (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete restrict,
  storage_path text not null unique,
  mime_type text not null check (mime_type in ('image/jpeg', 'image/png', 'image/webp')),
  size_bytes integer not null check (size_bytes between 1 and 5242880),
  created_at timestamptz not null default now(),
  delete_after timestamptz,
  check (storage_path like user_id::text || '/%')
);

create table public.stripe_events (
  event_id text primary key,
  event_type text not null,
  livemode boolean not null,
  processed_at timestamptz not null default now()
);

create table public.admin_users (
  user_id uuid primary key references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);

create index orders_user_id_created_at_idx on public.orders(user_id, created_at desc);
create index orders_status_created_at_idx on public.orders(status, created_at desc);
create index order_items_order_id_idx on public.order_items(order_id);
create index order_items_service_id_idx on public.order_items(service_id);
create index order_answers_order_id_idx on public.order_answers(order_id);
create index order_answers_service_id_idx on public.order_answers(service_id);
create index order_photos_order_id_idx on public.order_photos(order_id);
create index order_photos_user_id_idx on public.order_photos(user_id);
create index order_photos_delete_after_idx on public.order_photos(delete_after) where delete_after is not null;

create or replace function private.set_updated_at()
returns trigger language plpgsql security invoker set search_path = '' as $$
begin
  new.updated_at = now();
  return new;
end;
$$;
revoke all on function private.set_updated_at() from public, anon, authenticated;

create trigger profiles_set_updated_at before update on public.profiles for each row execute function private.set_updated_at();
create trigger services_set_updated_at before update on public.services for each row execute function private.set_updated_at();
create trigger orders_set_updated_at before update on public.orders for each row execute function private.set_updated_at();

create or replace function private.handle_new_user()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  insert into public.profiles (id, full_name)
  values (new.id, nullif(new.raw_user_meta_data ->> 'full_name', ''))
  on conflict (id) do nothing;

  if lower(coalesce(new.email, '')) = 'lucasjavierquintanilla@gmail.com' then
    insert into public.admin_users (user_id) values (new.id) on conflict do nothing;
  end if;
  return new;
end;
$$;
revoke all on function private.handle_new_user() from public, anon, authenticated;

create trigger on_auth_user_created after insert on auth.users for each row execute function private.handle_new_user();

insert into public.profiles (id, full_name)
select id, nullif(raw_user_meta_data ->> 'full_name', '') from auth.users
on conflict (id) do nothing;
insert into public.admin_users (user_id)
select id from auth.users where lower(email) = 'lucasjavierquintanilla@gmail.com'
on conflict do nothing;

alter table public.profiles enable row level security;
alter table public.services enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;
alter table public.order_answers enable row level security;
alter table public.order_photos enable row level security;
alter table public.stripe_events enable row level security;
alter table public.admin_users enable row level security;

revoke all on all tables in schema public from anon, authenticated;
grant select on public.services to anon, authenticated;
grant select, insert, update on public.profiles to authenticated;
grant select on public.orders, public.order_items, public.order_answers, public.order_photos to authenticated;

create policy "active services are public" on public.services for select to anon, authenticated using (is_active = true);
create policy "customers read own profile" on public.profiles for select to authenticated using ((select auth.uid()) = id);
create policy "customers create own profile" on public.profiles for insert to authenticated with check ((select auth.uid()) = id);
create policy "customers update own profile" on public.profiles for update to authenticated using ((select auth.uid()) = id) with check ((select auth.uid()) = id);
create policy "customers read own orders" on public.orders for select to authenticated using ((select auth.uid()) = user_id);
create policy "customers read own order items" on public.order_items for select to authenticated using (exists (select 1 from public.orders where orders.id = order_items.order_id and orders.user_id = (select auth.uid())));
create policy "customers read own order answers" on public.order_answers for select to authenticated using (exists (select 1 from public.orders where orders.id = order_answers.order_id and orders.user_id = (select auth.uid())));
create policy "customers read own order photos" on public.order_photos for select to authenticated using ((select auth.uid()) = user_id);

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('job-photos', 'job-photos', false, 5242880, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do update set public = false, file_size_limit = excluded.file_size_limit, allowed_mime_types = excluded.allowed_mime_types;

create policy "customers upload own job photos" on storage.objects for insert to authenticated
with check (
  bucket_id = 'job-photos'
  and (storage.foldername(name))[1] = (select auth.uid())::text
  and lower(storage.extension(name)) in ('jpg', 'jpeg', 'png', 'webp')
  and coalesce((metadata ->> 'size')::bigint, 0) between 1 and 5242880
);
create policy "customers read own job photos" on storage.objects for select to authenticated
using (bucket_id = 'job-photos' and (storage.foldername(name))[1] = (select auth.uid())::text);
create policy "customers delete unsubmitted photos" on storage.objects for delete to authenticated
using (bucket_id = 'job-photos' and (storage.foldername(name))[1] = (select auth.uid())::text);

insert into public.services (id, slug, name, base_estimate_cents, image_url, category, description, is_add_on, sort_order)
select id, slug, name, base_estimate_cents, image_url, category, description, is_add_on, sort_order
from jsonb_to_recordset($services$[
  {"id":"ea387b0c-0289-4065-a4e1-93276e425fc4","slug":"house-cleaning-free-windows","name":"House cleaning + free windows","base_estimate_cents":6490,"image_url":"https://storage.googleapis.com/oscar-storage/task_photo/deep_house_clean_.jpeg","category":"Cleaning","description":"Book a home cleaning and get a free window cleaning.","is_add_on":false,"sort_order":1},
  {"id":"a36715ca-c2c3-4496-a404-ca9342ca7e0c","slug":"replace-bathroom-faucet","name":"Replace bathroom faucet (Energy efficiency)","base_estimate_cents":3950,"image_url":"https://storage.googleapis.com/oscar-storage/task_photo/Replace_bath_faucet_Large.jpeg","category":"Energy efficiency","description":"Professional replacement of an energy-efficient bathroom faucet.","is_add_on":false,"sort_order":2},
  {"id":"79f3ecf0-8118-44e0-a600-238fd1cc7416","slug":"window-cleaning","name":"Window cleaning","base_estimate_cents":2490,"image_url":"https://storage.googleapis.com/oscar-storage/task_photo/window_cleaning_.jpeg","category":"Cleaning","description":"Window and frame cleaning.","is_add_on":false,"sort_order":3},
  {"id":"3fb78afc-a097-48bd-8416-5cb9fab3272d","slug":"install-shower-cabin","name":"Install shower cabin","base_estimate_cents":15950,"image_url":"https://storage.googleapis.com/oscar-storage/task_photo/install_shower_cabin_800.jpeg","category":"Installation","description":"Shower cabin installation subject to a confirmed scope.","is_add_on":false,"sort_order":4},
  {"id":"34ffff3e-4485-45ea-871d-5ac1c055eff8","slug":"wash-dry-fold","name":"Wash, dry and fold clothes at home","base_estimate_cents":1050,"image_url":"https://storage.googleapis.com/oscar-storage/task_photo/wash_dry_fold_clothes_at_home.jpeg","category":"Laundry","description":"Clothes washed, dried and folded at home.","is_add_on":false,"sort_order":5},
  {"id":"6fbd5d23-dd08-4e72-a1fd-4f280643c2c1","slug":"repair-shower-cabin","name":"Repair shower cabin (Water leak)","base_estimate_cents":21250,"image_url":"https://storage.googleapis.com/oscar-storage/task_photo/repair_shower_cabin_800.jpeg","category":"Repair","description":"Shower cabin leak assessment and repair.","is_add_on":false,"sort_order":6},
  {"id":"060b2de2-04d0-4380-9499-90cd80309929","slug":"replace-shower","name":"Replace shower (Energy efficiency)","base_estimate_cents":3890,"image_url":"https://storage.googleapis.com/oscar-storage/task_photo/replace_shower_cabin_800.jpeg","category":"Energy efficiency","description":"Replace a shower with an efficient alternative.","is_add_on":false,"sort_order":7},
  {"id":"124ac708-679f-48fb-a7b1-b2bde035a8dd","slug":"replace-shower-column","name":"Replace shower column","base_estimate_cents":4790,"image_url":"https://storage.googleapis.com/oscar-storage/task_photo/replace_shower_column_800.jpeg","category":"Maintenance","description":"Replace a shower column subject to fixture review.","is_add_on":false,"sort_order":8},
  {"id":"8324eea8-225b-4263-82ef-0042f5559de4","slug":"house-cleaning","name":"House cleaning","base_estimate_cents":2990,"image_url":"https://storage.googleapis.com/oscar-storage/task_photo/house_cleaning.jpeg","category":"Cleaning","description":"General home cleaning based on the agreed rooms and items.","is_add_on":false,"sort_order":9},
  {"id":"55acbf74-7eb2-4dc9-9297-9a7f62103e81","slug":"repair-intercom","name":"Repair intercom","base_estimate_cents":5850,"image_url":"https://storage.googleapis.com/oscar-storage/task_photo/repair_intercom_800.jpeg","category":"Repair","description":"Intercom assessment and repair.","is_add_on":false,"sort_order":10},
  {"id":"44aaa459-bf5d-4654-8f59-08b83722382c","slug":"replace-sink-faucet","name":"Replace sink faucet (Energy efficiency)","base_estimate_cents":4350,"image_url":"https://storage.googleapis.com/oscar-storage/task_photo/replace_sink_faucet_energy_efficiency.jpeg","category":"Energy efficiency","description":"Replace a sink faucet with an efficient alternative.","is_add_on":false,"sort_order":11},
  {"id":"d12f97b5-bff7-4c29-a8d2-a7e2189b20b8","slug":"raise-door","name":"Raise door","base_estimate_cents":5490,"image_url":"https://storage.googleapis.com/oscar-storage/task_photo/fix_door_heigth_800.jpeg","category":"Homefix","description":"Adjust a door so it opens and closes smoothly.","is_add_on":false,"sort_order":12},
  {"id":"86bc38be-af8d-44d0-babb-6c83d4bf9f7f","slug":"tile-laying","name":"Tile laying","base_estimate_cents":11990,"image_url":"https://storage.googleapis.com/oscar-storage/task_photo/install_tiles_800.jpeg","category":"Homefix","description":"Tile laying for an agreed area.","is_add_on":false,"sort_order":13},
  {"id":"ab74450b-3151-4db5-9b56-f1d66a03c7e7","slug":"unclog-sink","name":"Unclog sink","base_estimate_cents":8350,"image_url":"https://storage.googleapis.com/oscar-storage/task_photo/unclog_sink.jpeg","category":"Repair","description":"Diagnose and unblock a clogged sink.","is_add_on":false,"sort_order":14},
  {"id":"6cd5dbaf-a1b0-4b0d-9ae6-3c6555f9d414","slug":"deep-house-cleaning","name":"Deep house cleaning","base_estimate_cents":7990,"image_url":"https://storage.googleapis.com/oscar-storage/task_photo/deep_house_clean_.jpeg","category":"Cleaning","description":"A deeper home clean based on the agreed scope.","is_add_on":false,"sort_order":15},
  {"id":"399cb746-8c52-43b5-adb9-59fc32e0de57","slug":"replace-mailbox-lock","name":"Replace mailbox lock","base_estimate_cents":2990,"image_url":"https://storage.googleapis.com/oscar-storage/task_photo/replace_mailbox_lock.jpeg","category":"Repair","description":"Replace a mailbox lock.","is_add_on":false,"sort_order":16},
  {"id":"46fc9dd5-61c1-4e5b-ab19-6be723f2dace","slug":"repair-boiler","name":"Repair boiler","base_estimate_cents":6350,"image_url":"https://storage.googleapis.com/oscar-storage/task_photo/repair_boiler.jpeg","category":"Repair","description":"Initial boiler assessment and repair subject to diagnosis.","is_add_on":false,"sort_order":17},
  {"id":"c9cd04c7-43ad-481b-87e7-d8abf8b81a9d","slug":"interior-drawers-cleaning","name":"Interior drawers cleaning","base_estimate_cents":450,"image_url":"https://storage.googleapis.com/oscar-storage/task_photo/interior_drawers_cleaning.jpeg","category":"Cleaning","description":"Add interior drawer cleaning to another service.","is_add_on":true,"sort_order":18},
  {"id":"55cfc4c3-7edb-449e-b861-8bbcf0ad3416","slug":"mattress-cleaning","name":"Mattress cleaning","base_estimate_cents":4490,"image_url":"https://storage.googleapis.com/oscar-storage/task_photo/mattress_cleaning_.jpeg","category":"Cleaning","description":"Mattress cleaning and sanitisation.","is_add_on":false,"sort_order":19},
  {"id":"781efc6a-a833-42a4-9733-5d6cd4bcd797","slug":"sofa-cleaning","name":"Sofa cleaning","base_estimate_cents":3990,"image_url":"https://storage.googleapis.com/oscar-storage/task_photo/sofa_cleaning_.jpeg","category":"Cleaning","description":"Sofa cleaning and sanitisation.","is_add_on":false,"sort_order":20},
  {"id":"9a91edbd-659b-4fe4-8c7e-878b4ea1e3cb","slug":"rug-cleaning","name":"Rug cleaning","base_estimate_cents":5690,"image_url":"https://storage.googleapis.com/oscar-storage/task_photo/rug_cleaning_.jpeg","category":"Cleaning","description":"Rug cleaning and sanitisation.","is_add_on":false,"sort_order":21},
  {"id":"c8c2907b-7f96-4308-84c6-c73f4f828cd6","slug":"room-cleaning","name":"Room cleaning","base_estimate_cents":1050,"image_url":"https://storage.googleapis.com/oscar-storage/task_photo/clean_room.jpeg","category":"Cleaning","description":"Focused room cleaning.","is_add_on":false,"sort_order":22},
  {"id":"52918b7b-ef0b-4473-b570-0b50f50529fb","slug":"wash-dry-iron","name":"Wash, dry and iron clothes at home","base_estimate_cents":3490,"image_url":"https://storage.googleapis.com/oscar-storage/task_photo/wash_dry_iron_clothes_at_home.jpeg","category":"Laundry","description":"Clothes washed, dried and ironed at home.","is_add_on":false,"sort_order":23},
  {"id":"5f08d944-0e9d-4d2e-b9cb-96cd0b9e374b","slug":"exterior-painting","name":"Exterior painting","base_estimate_cents":21150,"image_url":"https://storage.googleapis.com/oscar-storage/task_photo/exterior_painting.jpeg","category":"Homefix","description":"Exterior painting subject to a confirmed scope and materials.","is_add_on":false,"sort_order":24},
  {"id":"59c9634b-ee17-4ce1-831e-f8b5abaccbd0","slug":"furniture-painting","name":"Furniture painting","base_estimate_cents":15890,"image_url":"https://storage.googleapis.com/oscar-storage/task_photo/furniture_painting.jpeg","category":"Decoration","description":"Furniture painting based on the agreed item and finish.","is_add_on":false,"sort_order":25},
  {"id":"e08df49b-4b23-4cd2-8819-a1d576082b52","slug":"kitchen-cleaning","name":"Kitchen cleaning","base_estimate_cents":1550,"image_url":"https://storage.googleapis.com/oscar-storage/task_photo/clean_kitchen_.jpeg","category":"Cleaning","description":"Focused kitchen cleaning.","is_add_on":false,"sort_order":26},
  {"id":"da27f883-e9c5-42d7-9748-195068634708","slug":"interior-painting","name":"Interior painting","base_estimate_cents":7150,"image_url":"https://storage.googleapis.com/oscar-storage/task_photo/wall_paint_wall.jpeg","category":"Homefix","description":"Interior painting subject to a confirmed scope and materials.","is_add_on":false,"sort_order":27}
]$services$::jsonb)
as x(id uuid, slug text, name text, base_estimate_cents integer, image_url text, category text, description text, is_add_on boolean, sort_order integer)
on conflict (id) do update set slug = excluded.slug, name = excluded.name, base_estimate_cents = excluded.base_estimate_cents, image_url = excluded.image_url, category = excluded.category, description = excluded.description, is_add_on = excluded.is_add_on, sort_order = excluded.sort_order;

update public.services set intake_schema = case
  when lower(name) like '%painting%' then '[{"id":"area","label":"What area needs painting?","type":"text","required":true},{"id":"size","label":"Approximate size","type":"text","required":true},{"id":"condition","label":"Current surface condition","type":"select","required":true,"options":["Good","Minor preparation needed","Damaged or peeling","Not sure"]}]'::jsonb
  when category = 'Cleaning' then '[{"id":"property_type","label":"Property type","type":"select","required":true,"options":["Apartment","House","Office","Other"]},{"id":"rooms","label":"How many rooms or areas need attention?","type":"number","required":true},{"id":"items","label":"Anything specific to include?","type":"textarea","required":false}]'::jsonb
  when category = 'Laundry' then '[{"id":"quantity","label":"Approximate quantity","type":"text","required":true},{"id":"ironing","label":"Is ironing required?","type":"select","required":true,"options":["Yes","No","Only some items"]}]'::jsonb
  else '[{"id":"problem","label":"Describe the problem","type":"textarea","required":true},{"id":"fixture","label":"Fixture, appliance or area","type":"text","required":true},{"id":"materials","label":"Are replacement materials already available?","type":"select","required":true,"options":["Yes","No","Not sure"]}]'::jsonb
end;

comment on table public.services is 'Temporary private-preview catalogue. Replace all Oscar-derived content before public launch.';
comment on table public.admin_users is 'Private staff allowlist. No anon or authenticated Data API grants.';
