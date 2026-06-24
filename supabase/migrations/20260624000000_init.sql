-- Users (extended from Supabase auth.users)
create table public.profiles (
  id uuid references auth.users on delete cascade primary key,
  full_name text,
  threads_user_id text,
  instagram_user_id text,
  meta_access_token text,
  meta_token_expires_at timestamp,
  plan text default 'free' check (plan in ('free', 'starter', 'pro', 'scale')),
  stripe_customer_id text,
  stripe_subscription_id text,
  stripe_subscription_status text,
  messages_sent_this_month integer default 0,
  month_reset_at timestamp default date_trunc('month', now()),
  created_at timestamp default now()
);

-- Posts being monitored
create table public.monitored_posts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete cascade,
  threads_post_id text not null,
  post_content text,
  goal text check (goal in ('freebie', 'subscribe', 'book_call', 'custom')),
  custom_goal_text text,
  cta_link text,
  channel text check (channel in ('threads_comment', 'instagram_dm', 'both')) default 'both',
  is_active boolean default true,
  total_likes integer default 0,
  total_messages_sent integer default 0,
  total_leads integer default 0,
  created_at timestamp default now()
);

-- Every person who liked a monitored post
create table public.likers (
  id uuid primary key default gen_random_uuid(),
  post_id uuid references public.monitored_posts(id) on delete cascade,
  user_id uuid references public.profiles(id) on delete cascade,
  liker_threads_id text not null,
  liker_instagram_id text,
  liker_username text,
  liker_bio text,
  liker_follower_count integer,
  liker_post_count integer,
  message_sent boolean default false,
  message_sent_at timestamp,
  liked_at timestamp default now(),
  unique(post_id, liker_threads_id)
);

-- Every message sent
create table public.messages_sent (
  id uuid primary key default gen_random_uuid(),
  liker_id uuid references public.likers(id) on delete cascade,
  post_id uuid references public.monitored_posts(id) on delete cascade,
  user_id uuid references public.profiles(id) on delete cascade,
  channel text check (channel in ('threads_comment', 'instagram_dm')),
  message_text text,
  message_version_id uuid,
  sent_at timestamp default now(),
  was_clicked boolean default false,
  was_converted boolean default false,
  clicked_at timestamp,
  converted_at timestamp
);

-- AI message versions per post (A/B learning)
create table public.message_versions (
  id uuid primary key default gen_random_uuid(),
  post_id uuid references public.monitored_posts(id) on delete cascade,
  user_id uuid references public.profiles(id) on delete cascade,
  channel text check (channel in ('threads_comment', 'instagram_dm')),
  message_template text,
  version_number integer default 1,
  times_sent integer default 0,
  times_clicked integer default 0,
  times_converted integer default 0,
  click_rate numeric generated always as (
    case when times_sent = 0 then 0
    else round((times_clicked::numeric / times_sent) * 100, 1) end
  ) stored,
  is_active boolean default true,
  rewrite_reason text,
  created_at timestamp default now()
);

-- Leads captured via opt-in link
create table public.leads (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete cascade,
  liker_id uuid references public.likers(id),
  source_post_id uuid references public.monitored_posts(id),
  email text,
  whatsapp text,
  captured_at timestamp default now()
);

-- Webhook event log (for debugging and deduplication)
create table public.webhook_events (
  id uuid primary key default gen_random_uuid(),
  event_type text,
  threads_post_id text,
  liker_threads_id text,
  raw_payload jsonb,
  processed boolean default false,
  processed_at timestamp,
  error text,
  received_at timestamp default now()
);

-- Enable Row Level Security
alter table public.profiles enable row level security;
alter table public.monitored_posts enable row level security;
alter table public.likers enable row level security;
alter table public.messages_sent enable row level security;
alter table public.message_versions enable row level security;
alter table public.leads enable row level security;
alter table public.webhook_events enable row level security;

-- Policies
create policy "Users see own data" on public.profiles for all using (auth.uid() = id);
create policy "Users see own posts" on public.monitored_posts for all using (auth.uid() = user_id);
create policy "Users see own likers" on public.likers for all using (auth.uid() = user_id);
create policy "Users see own messages" on public.messages_sent for all using (auth.uid() = user_id);
create policy "Users see own versions" on public.message_versions for all using (auth.uid() = user_id);
create policy "Users see own leads" on public.leads for all using (auth.uid() = user_id);

-- Trigger to automatically insert a profile row when a new user signs up
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, full_name, plan, messages_sent_this_month, created_at)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name', ''),
    'free',
    0,
    now()
  );
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
