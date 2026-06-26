-- Migration: Add email tracking to likers & email channel to messages_sent

-- Add email_sent tracking to likers
alter table public.likers
  add column if not exists email_sent boolean default false;

alter table public.likers
  add column if not exists email_sent_at timestamp default null;

alter table public.likers
  add column if not exists was_converted boolean default false;

alter table public.likers
  add column if not exists converted_at timestamp default null;

-- Add channel option for email in messages_sent
alter table public.messages_sent
  drop constraint if exists messages_sent_channel_check;

alter table public.messages_sent
  add constraint messages_sent_channel_check
  check (channel in ('threads_reply', 'instagram_dm', 'email'));
