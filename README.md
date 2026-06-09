# PrintMarket — 3D Printing Marketplace MVP

A production-ready marketplace connecting clients who need 3D printing with printer owners who have the equipment.

**Stack:** Next.js 15 (App Router) · TypeScript · Tailwind CSS · Supabase (Auth + DB + Storage) · Vercel

---

## Features

- Public landing page
- Email/password auth via Supabase
- Role-based onboarding (Client / Printer Owner)
- Client: post jobs with file uploads (STL, STEP, 3MF, ZIP, OBJ)
- Printer Owner: profile creation, browse open jobs, submit quotes
- Client: review quotes, accept one
- Real-time messaging between client and accepted printer owner
- Admin dashboard: users, jobs, quotes, messages, platform settings
- Row-Level Security on all tables
- Stripe Connect placeholder (ready for activation in MVP 2)

---

## Local Setup

### 1. Prerequisites

- Node.js 20+
- A free [Supabase](https://supabase.com) account

### 2. Clone & install

```bash
git clone <your-repo>
cd print-marketplace
npm install
```

### 3. Create a Supabase project

1. Go to [supabase.com](https://supabase.com) → New project
2. Note your **Project URL** and **anon public key** from Settings → API

### 4. Run the database migration

1. Open your Supabase project → SQL Editor
2. Paste the contents of `supabase/migrations/001_initial_schema.sql`
3. Click **Run**

### 5. Create the storage bucket

In Supabase Dashboard → Storage → New bucket:
- **Name:** `job-files`
- **Public bucket:** ❌ (keep private)

Then run these policies in SQL Editor:

```sql
-- Allow authenticated users to upload
create policy "job_files_upload"
  on storage.objects for insert
  with check (bucket_id = 'job-files' and auth.role() = 'authenticated');

-- Allow authenticated users to read
create policy "job_files_read"
  on storage.objects for select
  using (bucket_id = 'job-files' and auth.role() = 'authenticated');
```

### 6. Configure environment variables

```bash
cp .env.example .env.local
```

Edit `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 7. Configure Supabase Auth redirect URLs

In Supabase Dashboard → Authentication → URL Configuration:

- **Site URL:** `http://localhost:3000`
- **Redirect URLs:** Add `http://localhost:3000/auth/callback`

### 8. Run the development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

### 9. Create an admin user (optional)

After signing up, run in Supabase SQL Editor:

```sql
update public.profiles
set role = 'admin', onboarding_complete = true
where email = 'your@email.com';
```

---

## Vercel Deployment

### 1. Push to GitHub

```bash
git init
git add .
git commit -m "Initial commit"
gh repo create print-marketplace --public --push
```

### 2. Deploy to Vercel

```bash
npx vercel --prod
```

Or connect via the [Vercel dashboard](https://vercel.com/new) → Import Git Repository.

### 3. Set environment variables in Vercel

In your Vercel project → Settings → Environment Variables, add:

| Key | Value |
|-----|-------|
| `NEXT_PUBLIC_SUPABASE_URL` | Your Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Your Supabase anon key |
| `SUPABASE_SERVICE_ROLE_KEY` | Your service role key |
| `NEXT_PUBLIC_APP_URL` | Your Vercel deployment URL |

### 4. Update Supabase Auth redirect URLs

In Supabase → Authentication → URL Configuration:

- **Site URL:** `https://your-app.vercel.app`
- **Redirect URLs:** Add `https://your-app.vercel.app/auth/callback`

---

## Project Structure

```
print-marketplace/
├── app/
│   ├── (auth)/              # Login & signup pages
│   │   ├── login/
│   │   └── signup/
│   ├── auth/callback/       # Supabase OAuth callback
│   ├── onboarding/          # Role selection
│   ├── (protected)/         # Authenticated routes
│   │   ├── layout.tsx       # Auth guard + sidebar layout
│   │   ├── dashboard/
│   │   │   ├── client/      # Client dashboard
│   │   │   ├── printer/     # Printer owner dashboard
│   │   │   └── admin/       # Admin dashboard
│   │   ├── jobs/            # Jobs feed + new job form
│   │   │   └── [id]/        # Job detail + quote flow
│   │   ├── messages/        # Message threads
│   │   │   └── [jobId]/
│   │   └── profile/setup/   # Printer profile form
│   ├── page.tsx             # Public landing page
│   └── layout.tsx           # Root layout
├── components/
│   ├── ui/                  # Button, Input, Badge, etc.
│   ├── layout/              # Navbar, Sidebar
│   ├── jobs/                # JobCard
│   ├── quotes/              # QuoteForm
│   └── messages/            # MessageThread (realtime)
├── lib/
│   ├── supabase/            # Browser + server clients
│   ├── types/               # Full TypeScript DB types
│   └── utils.ts             # Helpers, constants
├── middleware.ts             # Auth + onboarding guards
├── supabase/migrations/     # SQL schema + RLS policies
└── .env.example
```

---

## Database Schema

| Table | Purpose |
|-------|---------|
| `profiles` | One per user; stores role, display name |
| `printer_profiles` | Equipment, materials, pricing for printer owners |
| `jobs` | Client job postings |
| `job_files` | Uploaded 3D model files per job |
| `quotes` | Printer owner bids on jobs |
| `messages` | Per-job chat (client ↔ accepted printer) |
| `reviews` | Post-completion ratings |
| `platform_settings` | Admin-managed key-value config |

All tables have Row-Level Security. See `supabase/migrations/001_initial_schema.sql` for full policies.

---

## Stripe Connect (MVP 2)

Stripe is prepared but not activated. When ready:

1. Create a Stripe account and enable Connect
2. Set `STRIPE_SECRET_KEY`, `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`, `STRIPE_WEBHOOK_SECRET`
3. Set `stripe_enabled` to `true` in `platform_settings`
4. Implement `app/api/stripe/` routes for Connect onboarding and payment intents

---

## Roadmap (Post-MVP)

- [ ] Stripe Connect payments
- [ ] Review & rating system (table exists, UI pending)
- [ ] Printer public profile pages
- [ ] Job status updates (in_progress → completed)
- [ ] Email notifications (Supabase Edge Functions + Resend)
- [ ] Google OAuth
- [ ] Job search with location radius filter
- [ ] Printer owner portfolio / photo gallery
