# THREADS HUNTER — COMPLETE AGENTIC BUILD PROMPT

Paste this entire prompt into your agentic AI tool (Cursor, Windsurf, Claude Code, etc.)

---

## WHAT YOU ARE BUILDING

Build a SaaS web app called **Threads Hunter**. It is a Like-to-Lead automation tool for Threads (Meta) and Instagram. When someone likes a user's Threads post, the system automatically detects it, uses AI to write a personalized message based on the liker's profile, and sends it via Threads comment and/or Instagram DM. The system tracks which messages convert best and rewrites underperforming ones automatically over time.

All automation logic runs INSIDE the Next.js app — no external automation tools like n8n or Zapier. Use Vercel Cron Jobs for scheduled tasks and Next.js API routes for all webhook and background processing.

---

## TECH STACK — USE EXACTLY THIS

- **Frontend:** Next.js 14 (App Router) + Tailwind CSS
- **Backend:** Next.js API routes (serverless functions)
- **Database:** Supabase (PostgreSQL) — free tier
- **Auth:** Supabase Auth with Meta OAuth
- **AI:** Anthropic Claude API (model: claude-sonnet-4-6)
- **Payments:** Stripe (subscriptions + webhooks)
- **Meta APIs:** Threads API + Instagram Graph API (both free)
- **Scheduled Jobs:** Vercel Cron Jobs (built into Vercel, free)
- **Deployment:** Vercel (free tier)
- **Email:** Resend (free tier — for user notifications only)

---

## DATABASE SCHEMA — BUILD THESE TABLES IN SUPABASE

```sql
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
```

Enable Row Level Security on all tables:
```sql
alter table public.profiles enable row level security;
alter table public.monitored_posts enable row level security;
alter table public.likers enable row level security;
alter table public.messages_sent enable row level security;
alter table public.message_versions enable row level security;
alter table public.leads enable row level security;
alter table public.webhook_events enable row level security;

-- Users can only see their own data
create policy "Users see own data" on public.profiles for all using (auth.uid() = id);
create policy "Users see own posts" on public.monitored_posts for all using (auth.uid() = user_id);
create policy "Users see own likers" on public.likers for all using (auth.uid() = user_id);
create policy "Users see own messages" on public.messages_sent for all using (auth.uid() = user_id);
create policy "Users see own versions" on public.message_versions for all using (auth.uid() = user_id);
create policy "Users see own leads" on public.leads for all using (auth.uid() = user_id);
-- Webhook events are server-side only (no RLS user policy — use service role key only)
```

---

## INTERNAL AUTOMATION ARCHITECTURE

All automation runs inside Next.js. No external tools. Here is the complete flow:

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

## API ROUTES — BUILD ALL OF THESE

### POST /api/webhooks/meta
Receives like events from Meta. Must:
1. Verify the `X-Hub-Signature-256` header using `META_WEBHOOK_VERIFY_TOKEN`
2. Handle the GET request for webhook verification (Meta sends a challenge)
3. Log the raw event to `webhook_events` table immediately
4. Find the matching `monitored_posts` row by `threads_post_id`
5. Check `likers` table for duplicate (same post + liker = skip)
6. Trigger `/api/internal/process-like` asynchronously using `fetch` with `{ signal: AbortSignal.timeout(0) }` so it runs after response
7. Return `200 OK` within 5 seconds or Meta will retry

### POST /api/internal/process-like
Internal route (protected with `INTERNAL_API_SECRET` header). Must:
1. Fetch liker's Threads profile:
```
GET https://graph.threads.net/v1.0/{liker_id}
  ?fields=id,username,biography,followers_count,threads_count
  &access_token={user_meta_access_token}
```
2. Fetch liker's Instagram profile if available:
```
GET https://graph.instagram.com/v21.0/{liker_instagram_id}
  ?fields=id,username,biography,followers_count
  &access_token={user_meta_access_token}
```
3. Save liker to `likers` table
4. Check user's plan message limit — if exceeded, skip and log
5. Call `/api/internal/generate-message`
6. If post channel is `threads_comment` or `both` → send Threads comment
7. If post channel is `instagram_dm` or `both` → send Instagram DM
8. Save to `messages_sent` table
9. Increment `message_version.times_sent`
10. Update `monitored_posts` stats
11. Increment `profiles.messages_sent_this_month`
12. Mark `webhook_events` row as processed

### POST /api/internal/generate-message
Internal route (protected). Calls Claude API with this EXACT system prompt:

```
SYSTEM PROMPT:

You are an expert conversion copywriter specializing in social media outreach. Your job is to write a short, highly personalized message to someone who just liked a social media post.

You will receive a JSON object with:
- post_content: the post they liked
- post_goal: freebie / subscribe / book_call / custom
- custom_goal_text: only if goal is custom
- cta_link: the link to include
- liker_username: their username
- liker_bio: their profile bio
- liker_follower_count: number of followers they have
- channel: threads_comment or instagram_dm
- best_performing_version: the current best message (if any) with its click_rate
- previous_versions: array of past messages and their click rates

RULES:
1. Feel 100% human — never sound like a bot or marketer
2. Reference something SPECIFIC from their bio or the post content
3. If liker_bio is empty, reference only the post content
4. Character limits: threads_comment = max 280 chars, instagram_dm = max 500 chars
5. End with the CTA link on its own line
6. Never use hashtags
7. Never use emojis unless their bio contains emojis
8. For threads_comment: start with @{liker_username}
9. For instagram_dm: start with "Hey {first word of username}!"
10. If best_performing_version exists with click_rate > 20%, model the tone and structure after it but personalize for this specific person
11. If best_performing_version has click_rate < 15%, try a completely different approach
12. Match the tone of the post_content (professional / casual / funny)

GOAL INSTRUCTIONS:
- freebie: Make the free resource feel like it was made specifically for someone like them
- subscribe: Make the newsletter/community feel exclusive and relevant to their interests
- book_call: Frame it as a helpful conversation, never a sales pitch
- custom: Follow custom_goal_text exactly but personalize the delivery

OUTPUT: Return ONLY the message text. No quotes, no explanation, no alternatives.
```

The route should:
1. Pull active `message_versions` for this post+channel from database
2. Find the best performing one (highest click_rate with times_sent >= 5)
3. Include all versions in the Claude prompt as context
4. Call Claude API
5. Save the new message as a `message_versions` entry if no active version exists
6. Return `{ message_text, version_id }`

### POST /api/internal/send-threads-comment
Internal route. Sends a reply comment to a Threads post:
```javascript
// Step 1: Create the reply
const createRes = await fetch(`https://graph.threads.net/v1.0/${threads_user_id}/threads`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    media_type: 'TEXT',
    text: messageText,
    reply_to_id: threads_post_id,
    access_token: meta_access_token
  })
})
const { id: creation_id } = await createRes.json()

// Step 2: Publish the reply
await fetch(`https://graph.threads.net/v1.0/${threads_user_id}/threads_publish`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ creation_id, access_token: meta_access_token })
})
```

### POST /api/internal/send-instagram-dm
Internal route. Sends an Instagram DM:
```javascript
await fetch(`https://graph.instagram.com/v21.0/me/messages`, {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${meta_access_token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    recipient: { id: liker_instagram_id },
    message: { text: messageText }
  })
})
```

### GET /api/webhooks/meta (verification endpoint)
Meta sends a GET request to verify the webhook. Handle it:
```javascript
const mode = searchParams.get('hub.mode')
const token = searchParams.get('hub.verify_token')
const challenge = searchParams.get('hub.challenge')
if (mode === 'subscribe' && token === process.env.META_WEBHOOK_VERIFY_TOKEN) {
  return new Response(challenge, { status: 200 })
}
return new Response('Forbidden', { status: 403 })
```

### GET /api/cron/ai-learning
Vercel Cron Job — runs every 24 hours. Must be in `vercel.json`. Must verify `CRON_SECRET` header.

Logic:
1. Find all `message_versions` where `times_sent >= 10` AND `click_rate < 15` AND `is_active = true`
2. Group by `post_id` + `channel`
3. For each underperforming version, call Claude API with this EXACT system prompt:

```
SYSTEM PROMPT FOR REWRITING:

You are a conversion rate optimization expert for social media outreach messages.

A message is underperforming and needs to be rewritten.

You will receive:
- original_message: the message that was sent
- click_rate: what percentage of people clicked the link (this is LOW — that's why we're rewriting)
- times_sent: how many times this message was sent
- post_content: the original post people liked
- post_goal: the goal of the message
- cta_link: the call to action link
- channel: threads_comment or instagram_dm
- other_versions: all other message versions for this post with their click rates

WHAT TO CHANGE:
- If click_rate < 5%: The opening hook is wrong. Try a completely different first line.
- If click_rate 5-10%: The CTA is weak. Try a more specific, lower-commitment ask.
- If click_rate 10-15%: The personalization is off. Be more specific and relevant.
- Always study other_versions — if one has higher click_rate, understand WHY and do more of that.
- Try shorter if original is long. Try longer if original is very short.
- Try question-based opening if original was statement-based, or vice versa.

RULES:
- Keep the same cta_link
- Keep the same channel character limits (threads_comment = 280 chars, instagram_dm = 500 chars)
- For threads_comment keep the @username format at start
- For instagram_dm keep the Hey {name}! format at start
- Output ONLY the new message text. Nothing else.
```

4. Save new version with `version_number + 1` and `rewrite_reason = 'auto_ai_rewrite_low_ctr'`
5. Set old version `is_active = false`
6. Log results

### GET /api/cron/reset-monthly-counts
Vercel Cron Job — runs on the 1st of every month at 00:00 UTC.
Resets `messages_sent_this_month = 0` for all profiles.

### POST /api/webhooks/stripe
Handles Stripe webhook events. Must verify Stripe signature.
Handle these events:
- `checkout.session.completed` → update `profiles.plan`, `stripe_customer_id`, `stripe_subscription_id`
- `customer.subscription.updated` → update `profiles.plan`, `stripe_subscription_status`
- `customer.subscription.deleted` → set `profiles.plan = 'free'`, clear subscription fields

### POST /api/stripe/create-checkout
Creates a Stripe Checkout session for the selected plan.
Return the checkout URL and redirect the user.

### POST /api/stripe/create-portal
Creates a Stripe Customer Portal session so users can manage/cancel their subscription.

---

## VERCEL CRON CONFIGURATION

Add this to `vercel.json` in the project root:
```json
{
  "crons": [
    {
      "path": "/api/cron/ai-learning",
      "schedule": "0 2 * * *"
    },
    {
      "path": "/api/cron/reset-monthly-counts",
      "schedule": "0 0 1 * *"
    }
  ]
}
```

Protect cron routes by checking:
```javascript
if (request.headers.get('Authorization') !== `Bearer ${process.env.CRON_SECRET}`) {
  return new Response('Unauthorized', { status: 401 })
}
```

---

## STRIPE SUBSCRIPTION PLANS

Create these products and prices in Stripe dashboard, then save the price IDs in env vars:

```
FREE (no Stripe needed — default plan)
- 1 monitored post
- 50 messages/month
- Threads comment only
- No AI learning

STARTER — $29/month (STRIPE_STARTER_PRICE_ID)
- 5 monitored posts
- 500 messages/month
- Threads comment + Instagram DM
- AI learning loop

PRO — $59/month (STRIPE_PRO_PRICE_ID)
- 20 monitored posts
- 2000 messages/month
- All channels
- AI learning + A/B testing
- CSV export

SCALE — $99/month (STRIPE_SCALE_PRICE_ID)
- Unlimited posts
- Unlimited messages
- All channels
- White label lead capture
- 3 team seats
```

Enforce plan limits in `/api/internal/process-like` before sending any message.

---

## LEAD CAPTURE PAGE

Build at `/capture` as a public page (no auth required). Query params: `?ref={liker_id}&post={post_id}`

The page should:
1. Validate the `ref` and `post` params exist in the database
2. Show the post owner's name/branding (pull from their profile)
3. Show a simple form: email field + optional WhatsApp field + submit button
4. On submit: save to `leads` table, mark originating message as `was_converted = true`, increment `message_versions.times_converted`
5. Redirect to `monitored_posts.cta_link` after 1 second
6. Track conversion back to the correct `message_version_id`

---

## DASHBOARD UI — BUILD ALL PAGES

### /dashboard (overview)
Top row metric cards:
- Total likes detected
- Total messages sent
- Average click rate %
- Total leads captured

Posts list below with columns:
- Post preview (first 80 chars)
- Goal badge (color coded)
- Likes / Messages / Leads counts
- Click rate % with color (green > 20%, yellow 10-20%, red < 10%)
- Active toggle (pause/resume monitoring)
- View details button

### /dashboard/posts/new
Form to add a new post:
- Paste Threads post URL (auto-extract post ID)
- Select goal (freebie / subscribe / book call / custom)
- If custom: text field for goal description
- Enter CTA link
- Select channel: Threads comment / Instagram DM / Both
- Save button

### /dashboard/posts/[id]
Post detail page with 3 tabs:

**Tab 1 — Likers**
Table of everyone who liked the post:
- Username (link to their Threads profile)
- Bio snippet
- Channel message was sent on
- Message sent at timestamp
- Clicked: yes/no badge
- Converted: yes/no badge

**Tab 2 — Message Versions**
All AI-generated message versions:
- Version number
- Full message text
- Times sent / Times clicked / Click rate
- Active badge (only one active at a time)
- Rewrite reason (if auto-rewritten)
- Manual edit button (user can override the active message)

**Tab 3 — Leads**
All leads captured from this post:
- Email / WhatsApp
- Captured at timestamp

### /dashboard/leads
All leads across all posts:
- Email / WhatsApp
- Source post preview
- Captured at
- Export all as CSV button

### /dashboard/settings
- Connected Meta account info (username, connected at)
- Disconnect / reconnect Meta account button
- Manage subscription button (→ Stripe Customer Portal)
- Current plan badge + usage (messages sent this month / limit)

### /pricing
Public page showing all 4 plans side by side.
Highlight the PRO plan as "Most Popular".
CTA buttons go to `/api/stripe/create-checkout?plan={plan}`.
If user is logged in and already on a paid plan, show "Manage Subscription" instead.

---

## UI DESIGN

- Dark theme: background `#0F1117`, cards `#1A1D27`, borders `#2D3148`
- Accent color: purple `#7C3AED`
- Success: green `#22C55E`, Warning: yellow `#EAB308`, Error: red `#EF4444`
- Font: Inter (load from Google Fonts)
- All data tables have loading skeletons
- Toast notifications for every user action
- Empty states with helpful instructions and a primary CTA button
- Mobile responsive — dashboard collapses to single column on mobile

---

## ENVIRONMENT VARIABLES

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# Anthropic
ANTHROPIC_API_KEY=

# Meta (Threads + Instagram)
META_APP_ID=
META_APP_SECRET=
META_WEBHOOK_VERIFY_TOKEN=

# Stripe
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
STRIPE_STARTER_PRICE_ID=
STRIPE_PRO_PRICE_ID=
STRIPE_SCALE_PRICE_ID=
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=

# Internal security
INTERNAL_API_SECRET=
CRON_SECRET=

# Resend (email notifications)
RESEND_API_KEY=

# App
NEXT_PUBLIC_APP_URL=https://yourdomain.com
```

---

## BUILD ORDER — FOLLOW THIS EXACT SEQUENCE

1. Scaffold Next.js 14 project with Tailwind CSS + folder structure
2. Run Supabase SQL migrations and enable RLS
3. Build Meta OAuth login + `/dashboard` redirect after login
4. Build `/dashboard/posts/new` — add post form
5. Build `GET /api/webhooks/meta` — Meta webhook verification
6. Build `POST /api/webhooks/meta` — receive like events + log to DB
7. Build `POST /api/internal/process-like` — fetch liker profile + orchestrate
8. Build `POST /api/internal/generate-message` — Claude API integration
9. Build `POST /api/internal/send-threads-comment` — Threads API sender
10. Build `POST /api/internal/send-instagram-dm` — Instagram API sender
11. Build `/capture` lead capture page
12. Build `/dashboard` overview with metric cards + posts list
13. Build `/dashboard/posts/[id]` detail page with 3 tabs
14. Build `/dashboard/leads` with CSV export
15. Build `GET /api/cron/ai-learning` + `vercel.json` cron config
16. Build `GET /api/cron/reset-monthly-counts`
17. Build Stripe integration (`/api/webhooks/stripe`, `/api/stripe/create-checkout`, `/api/stripe/create-portal`)
18. Build `/pricing` page
19. Build `/dashboard/settings` page
20. Deploy to Vercel + register Meta webhook URL in Meta App Dashboard

---

## IMPORTANT NOTES

- Use `supabaseAdmin` (service role key) for all server-side DB operations inside API routes
- Use `supabase` (anon key) only for client-side auth session checks
- Always verify `INTERNAL_API_SECRET` header on all `/api/internal/*` routes
- Handle Meta API rate limits: add exponential backoff with max 3 retries
- Deduplicate likes using the UNIQUE constraint on `(post_id, liker_threads_id)` — catch the unique violation and skip silently
- The `process-like` route must return 200 immediately and process async — Meta will cancel webhooks that timeout
- Threads API base URL: `https://graph.threads.net/v1.0/`
- Instagram Graph API base URL: `https://graph.instagram.com/v21.0/`
- All Claude API calls: model `claude-sonnet-4-6`, max_tokens `1000`
- Never expose `SUPABASE_SERVICE_ROLE_KEY` or `STRIPE_SECRET_KEY` to the client side

---

## EXPECTED OUTPUT FROM AGENT

1. Complete Next.js 14 project — all pages and API routes working
2. `supabase/migrations/` folder with all SQL files
3. `vercel.json` with cron config
4. `README.md` with full setup guide (Meta App setup, Stripe setup, Supabase setup, deployment)
5. `.env.example` with all variables listed and documented
6. No external services except Supabase, Stripe, Anthropic, Meta APIs, Resend, Vercel

Start by creating the project structure and confirming the full file tree before writing any code. Ask before making any architecture decision not covered in this document.
