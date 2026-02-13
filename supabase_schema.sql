-- Create Notifications Table
create table public.notifications (
  id uuid default gen_random_uuid() primary key,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  user_id uuid references auth.users(id) on delete cascade not null,
  type text not null, -- e.g., 'property_approved', 'appointment_confirmed'
  title text not null,
  message text not null,
  read boolean default false not null
);

-- Enable Row Level Security (RLS)
alter table public.notifications enable row level security;

-- Create Policies for Notifications
-- Users can view their own notifications
create policy "Users can view their own notifications"
  on public.notifications for select
  using (auth.uid() = user_id);

-- Users can update (mark as read) their own notifications
create policy "Users can update their own notifications"
  on public.notifications for update
  using (auth.uid() = user_id);

-- Admins (or system) need to insert notifications. 
-- Since we are running the admin dashboard from the client-side, 
-- we need a policy that allows insertion if the user is an admin or we can allow anyone to insert 
-- (but restrict viewing). Ideally, this should be restricted to service roles or admin users.
-- For now, allowing authenticated users to insert (so AdminDashboard works) but checking logic in app.
create policy "Enable insert for authenticated users"
  on public.notifications for insert
  with check (auth.role() = 'authenticated');


-- Create Messages Table (if not already exists)
create table public.messages (
  id uuid default gen_random_uuid() primary key,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  user_id uuid references auth.users(id) on delete cascade not null,
  subject text not null,
  message text not null,
  from_email text, -- Optional, if you want to track sender
  read boolean default false -- Optional, if you want to track read status for messages too
);

-- Enable RLS for Messages
alter table public.messages enable row level security;

-- Create Policies for Messages
create policy "Users can view their own messages"
  on public.messages for select
  using (auth.uid() = user_id);

create policy "Enable insert for authenticated users"
  on public.messages for insert
  with check (auth.role() = 'authenticated');

-- Enable Realtime for these tables
alter publication supabase_realtime add table public.notifications;
alter publication supabase_realtime add table public.messages;

-- Create Bookings Table
create table public.bookings ( 
   id uuid not null default gen_random_uuid (), 
   property_id uuid not null, 
   property_title text not null, 
   user_id uuid null, 
   user_email text null, 
   mobile_number text null, 
   appointment_date date not null, 
   appointment_time time without time zone not null, 
   status text null default 'pending'::text, 
   created_at timestamp with time zone null default now(), 
   user_name text null, 
   proposed_dates jsonb null, 
   message text null, 
   property_location text null, 
   property_image text null, 
   cancellation_reason text null, 
   rejection_reason text null, 
   constraint bookings_pkey primary key (id) 
 ) TABLESPACE pg_default;

-- Enable RLS for Bookings
alter table public.bookings enable row level security;

-- Create Policies for Bookings
create policy "Users can view their own bookings"
  on public.bookings for select
  using (auth.uid() = user_id);

create policy "Users can insert their own bookings"
  on public.bookings for insert
  with check (auth.role() = 'authenticated');

create policy "Admins can view all bookings"
  on public.bookings for select
  using (auth.jwt()->>'email' IN (SELECT email FROM public.profiles WHERE role = 'admin'));

-- Enable Realtime for Bookings
alter publication supabase_realtime add table public.bookings;
