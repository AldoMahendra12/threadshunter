# Threads Hunter

Threads Hunter is a Next.js 14 SaaS automation tool that monitors Threads and Instagram posts, drafts personalized outreach copies using Claude 3.5 Sonnet when visitors like a post, delivers them via comment replies or Instagram DMs, and runs an automated A/B learning optimizer to rewrite low-performance templates daily.

---

## Technical Stack

* **Frontend/Backend:** Next.js 14 (App Router) + Tailwind CSS + TypeScript
* **Database & Auth:** Supabase PostgreSQL + Supabase Auth + Meta OAuth
* **Outreach AI:** Anthropic Claude API (model: `claude-3-5-sonnet-20241022`)
* **Billing System:** Stripe Checkout + Subscriptions + Customer Portal + Stripe Webhooks
* **Email Notifications:** Resend
* **Hosting & Scheduler:** Vercel + Vercel Cron Jobs

---

## Internal Automation Architecture

```
META WEBHOOK → /api/webhooks/meta (Next.js API route)
                      ↓
              Verify webhook signature
                      ↓
              Log to webhook_events table
                      ↓
              Identify which monitored_post was liked
                      ↓
              Check: is this liker already processed? (dedup)
                      ↓
              Call /api/internal/process-like (async, no await)
                      ↓
              Return 200 OK to Meta immediately

/api/internal/process-like (background processing)
                      ↓
              Fetch liker profile from Threads API
                      ↓
              Save liker to database
                      ↓
              Call /api/internal/generate-message (Claude API)
                      ↓
              Send Threads comment and/or Instagram DM
                      ↓
              Save message to database
                      ↓
              Update post stats (total_likes, total_messages_sent)

VERCEL CRON → /api/cron/ai-learning (runs every 24 hours)
                      ↓
              Find underperforming message versions (click_rate < 15%, times_sent >= 10)
                      ↓
              Call Claude API to rewrite each one
                      ↓
              Save new version, deactivate old version

VERCEL CRON → /api/cron/reset-monthly-counts (runs 1st of every month)
                      ↓
              Reset messages_sent_this_month to 0 for all users
```

---

## Setup & Installation

### 1. Database Configuration (Supabase)
1. Initialize a new project on [Supabase](https://supabase.com/).
2. Navigate to the **SQL Editor** in your Supabase dashboard.
3. Open and run the initialization script located in `supabase/migrations/20260624000000_init.sql`. This sets up the schema tables, triggers, and Row Level Security (RLS) policies.
4. Copy the project credentials (`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`) into your `.env` file.

### 2. Meta OAuth Setup (Meta for Developers)
1. Go to [Meta for Developers](https://developers.facebook.com/) and register a new App (type: **Business** or **Consumer**).
2. Configure **Facebook Login for Business** or **Threads Login**. Add scopes:
   * `instagram_basic`
   * `instagram_manage_messages`
   * `threads_basic`
   * `threads_content_publish`
3. Configure your redirect URI to point to: `https://<YOUR_APP_URL>/auth/callback`.
4. Copy your app credentials (`META_APP_ID`, `META_APP_SECRET`) and define a secure custom token for `META_WEBHOOK_VERIFY_TOKEN` in your environment.

### 3. Stripe Setup
1. In the Stripe Developer Dashboard, register three subscription products corresponding to the **Starter**, **Pro**, and **Scale** plans.
2. Note the recurring price IDs for each and set them to:
   * `STRIPE_STARTER_PRICE_ID`
   * `STRIPE_PRO_PRICE_ID`
   * `STRIPE_SCALE_PRICE_ID`
3. Set up a Webhook pointing to `https://<YOUR_APP_URL>/api/webhooks/stripe` listening for:
   * `checkout.session.completed`
   * `customer.subscription.updated`
   * `customer.subscription.deleted`
4. Copy the webhook signing secret to `STRIPE_WEBHOOK_SECRET`.

### 4. Scheduler (Vercel Cron Jobs)
When deployed to Vercel, the platform automatically registers the crons defined in the root-level `vercel.json` file. Ensure `CRON_SECRET` is added to your Vercel project environment variables matching Vercel's generated secret or a custom strong bearer token to secure endpoints.

---

## Local Development

1. Install dependencies:
   ```bash
   npm install
   ```
2. Copy `.env.example` to `.env` and fill in your secrets.
3. Start the Next.js development server:
   ```bash
   npm run dev
   ```
4. Expose the server to the internet for webhook testing using tools like `ngrok` or `localtunnel`:
   ```bash
   ngrok http 3000
   ```
