-- Migration: Add Paddle billing columns to profiles
-- We keep the existing stripe_* columns as-is (for backward compat) and
-- add paddle_* aliases so the app can transition cleanly.
-- The new Paddle webhook handler writes into stripe_* columns for now
-- (to avoid requiring a full DB schema migration with data moves).
-- Once Paddle is fully live you can rename these columns.

-- Add a paddle_customer_id column for forward-looking storage
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS paddle_customer_id text,
  ADD COLUMN IF NOT EXISTS paddle_subscription_id text,
  ADD COLUMN IF NOT EXISTS paddle_subscription_status text;

-- Optional: if you want to migrate existing data from stripe_* to paddle_*
-- UPDATE public.profiles
--   SET paddle_customer_id = stripe_customer_id,
--       paddle_subscription_id = stripe_subscription_id,
--       paddle_subscription_status = stripe_subscription_status
--   WHERE stripe_customer_id IS NOT NULL;
