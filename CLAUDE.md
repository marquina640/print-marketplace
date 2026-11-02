# PrintMarketHub — Project Brief for Claude

This file is loaded automatically by Claude Code at the start of every session.
It replaces the need for conversation history on a new device.

---

## What this project is

**PrintMarketHub** (`printmarkethub.com`) is a global marketplace connecting clients who need 3D-printed parts with local maker/printer owners. Clients post job requests with files and a deadline. Makers submit quotes. On quote acceptance the client pays via Stripe. Payment is held and released to the maker after delivery confirmation. 12% platform commission on every transaction.

GitHub repo: `https://github.com/marquina640/print-marketplace`

---

## Rules (never violate)

- **No em dashes (—)** anywhere: in code, copy, emails, comments, or chat replies. Use commas, colons, or parentheses instead.
- **No "escrow" language** anywhere (Stripe ToS risk). Use "held securely", "payment protection".
- **No Switzerland-only references** — platform is global.
- **Always commit and push after every change.** Never ask permission. `git add`, `git commit`, `git push` is the expected end of every task.
- **Commission is 12%** — state it as a fact, never reference a "pricing page".

---

## Tech stack

| Layer | Tool |
|---|---|
| Framework | Next.js 15 App Router, TypeScript |
| Database | Supabase (Postgres + RLS) |
| Auth | Supabase Auth (email/password + Google OAuth) |
| Payments | Stripe Connect Express |
| Email | Resend (from `noreply@printmarkethub.com`) |
| Hosting | Vercel |
| Icons | Lucide React |

---

## User roles

- `client` — posts jobs, pays for quotes
- `printer_owner` (maker) — submits quotes, receives Stripe payouts
- `admin` — full access, can preview as any user/role via cookies

Admin preview cookies: `admin_preview_as` (role string), `admin_preview_user_id` (uuid).

The distinction between `isRealPrinter` (uses `profile?.role`) and `isPrinter` (uses `effectiveRole`, affected by `view_mode` cookie) matters in job detail pages.

---

## Route structure

```
app/(browse)/          Public marketplace: /jobs, /makers, /map, /faq, /how-it-works, /for-makers, /blog, /legal
app/(protected)/       Authenticated: /dashboard/client, /dashboard/printer, /dashboard/admin, /jobs/[id], /profile/*
app/(auth)/            /login, /signup, /forgot-password, /reset-password
app/legal/             Standalone legal pages with sidebar nav
app/api/               Stripe webhooks, Stripe Connect onboard/callback, cron jobs
```

---

## Payment flow

1. Client accepts a quote
2. Stripe Payment Element shown (Stripe Checkout session created)
3. `stripe_session_id` stored on the `jobs` row
4. On delivery confirmation: `transferToMaker()` runs, transfers (price × 0.88) to maker's Stripe Connect account
5. 12% stays on the platform account

For refunds: retrieve the payment intent via `stripe.checkout.sessions.retrieve(stripe_session_id)`, then `stripe.refunds.create({ payment_intent })`.

PayPal is a fallback payout method for makers in countries not supported by Stripe Connect (`paypal_email` on `printer_profiles`).

---

## Supabase / RLS patterns

- Always use `createClient()` (from `@/lib/supabase/server`) for user-facing queries — respects RLS.
- Use `createAdminClient()` (from `@/lib/supabase/admin`) for cron jobs, admin actions, and any query that must bypass RLS.
- RLS is enforced at the database level. App-level logic alone is not enough; if a query returns nothing unexpectedly, check whether an RLS policy covers the case.
- The `auth_is_admin()` Postgres function is used in RLS policies for admin access.

---

## Email (Resend + lib/email.ts)

- `emailTemplate(content)` is an internal wrapper — **not exported**. Do not import it.
- `ctaButton(label, url)` is also internal.
- All exported functions call `sendEmail({ to, subject, html })` directly, passing a plain HTML string built with the internal helpers.
- `APP_URL` = `process.env.NEXT_PUBLIC_APP_URL ?? 'https://printmarkethub.com'`

### Email functions (lib/email.ts)

`emailPaypalMigration`, `emailNewQuote`, `emailQuoteAccepted`, `emailJobPaid`, `emailJobShipped`, `emailDeliveryConfirmed`, `emailNewMessage`, `emailReviewsPublished`, `emailMakerAddMachine`, `emailMakerMissingRequests`, `emailMakerSetupPayouts`, `emailQuoteSubmitted`, `emailMakerNewJobNearby`, `emailProfileIncomplete`, `emailOnboardingReminder`, `emailDeliveryReminder`, `emailAutoReleased`, `emailDeadlinePassed`

---

## Cron jobs (Vercel, daily)

| Time (UTC) | Route | What it does |
|---|---|---|
| 09:00 | `/api/cron/maker-emails` | Onboarding nudges for incomplete maker profiles |
| 10:00 | `/api/cron/auto-release` | Auto-releases payment to maker 14 days after shipping if customer never confirms. Sends reminders at day 7 and day 10. Skips if open dispute. |
| 11:00 | `/api/cron/deadline-check` | Emails customer if job deadline passed with zero quotes, asking to extend or close. One email per job. |

All cron routes check `Authorization: Bearer ${CRON_SECRET}`.

---

## Key database tables

| Table | Purpose |
|---|---|
| `jobs` | Client job requests. Key columns: `status` (open/accepted/paid/shipped/delivered/completed/cancelled), `client_id`, `deadline`, `stripe_session_id`, `needs_design`, `shipping_required`, `deadline_passed_email_sent_at`, `delivery_reminder_1_sent_at`, `delivery_reminder_2_sent_at` |
| `quotes` | Maker quotes on jobs. `printer_id`, `job_id`, `price`, `status` (pending/accepted/declined/withdrawn) |
| `profiles` | All users. `role`, `email`, `display_name`, `avatar_url`, `is_test` |
| `printer_profiles` | Maker-specific data. `certification_level` (0-3), `stripe_account_id`, `stripe_onboarding_complete`, `paypal_email`, `materials`, `colors`, `design_services`, `shipping`, `pickup`, `local_delivery` |
| `machines` | Maker equipment. `brand`, `model`, `process`, `build_volume_x/y/z`, `nozzle_diameters`, `is_enclosed`, `is_active`, `photo_url` |
| `disputes` | Customer disputes on jobs. `status` (open/resolved/closed), `reason`, `client_id`, `job_id` |
| `job_files` | Files attached to a job. `type` (stl/step/image/reference/link/zip/other) |
| `notifications` | In-app notifications. `user_id`, `message`, `link`, `read` |
| `reviews` | Post-delivery reviews. Bilateral (client reviews maker, maker reviews client) |
| `referral_codes` | Referral program. `code`, `owner_id`, `commission_pct`, `commission_months` |
| `job_invitations` | Client invites a specific maker to quote on a job |
| `listings` | Pre-made prints makers sell at a fixed price (no custom job needed) |

---

## Migrations — what has been run vs. pending

All migrations 001 through 033 should be run in the Supabase SQL Editor in order.

**If starting fresh on a new machine, confirm which migrations have been applied** by checking Supabase or asking the user. The ones most likely to be missing if recently added:

- `031_disputes_and_auto_release.sql` — `disputes` table, `delivery_reminder_1/2_sent_at` on jobs
- `032_machine_enclosed.sql` — `is_enclosed` boolean on machines
- `033_job_deadline_passed_email.sql` — `deadline_passed_email_sent_at` on jobs

---

## Printer / machine catalog (lib/utils.ts)

`PRINTER_BRANDS` maps brand name to array of model strings.
`CATEGORY_BRANDS` groups brands by category: `fdm`, `resin`, `laser`.
`BRAND_MODELS_FOR_CATEGORY` provides filtered model lists for brands that span categories (Elegoo, Anycubic, Creality, Prusa, Zortrax, Snapmaker).
`MANUFACTURING_PROCESSES` — available processes: `fdm`, `resin` (available=true); `sls`, `cnc`, `laser`, `sheet_metal`, `other` (available=false or limited).
`CERTIFICATION_LEVELS` — 0 (Community), 1 (Verified), 2 (Professional), 3 (Expert).

---

## Machine form (app/(protected)/profile/machines/machines-form.tsx)

Category picker at the top (FDM / Resin / Laser) filters brands. Only FDM shows nozzle sizes and the enclosed/open-frame toggle. Laser shows a 2-column "Work Area" field instead of a 3-axis build volume. Process is auto-set from category.

---

## Dispute / auto-release system

- Customer can raise a dispute from the job detail page (shipped or overdue paid jobs).
- Admin sees disputes at `/dashboard/admin/disputes`.
- Admin can: release payment to maker, issue Stripe refund to client, or close without action.
- Auto-release cron skips jobs with an open dispute.
- Refund action: `app/actions/refund-dispute.ts` — retrieves Stripe session, issues full refund, marks job cancelled, notifies both parties.

---

## Job feed visibility rules (app/(browse)/jobs/page.tsx)

Jobs are hidden from the feed if:
- `status != 'open'`
- `deadline` is in the past (expired)
- Created more than 7 days ago
- `needs_design = true` and the viewing maker does not offer design services
- Posted by the viewing user (never show your own requests)
- Posted by a test user (`is_test = true` on profiles)

Admin sees all 4 where a maker sees 3 because the admin panel has no deadline/age filter.

---

## Environment variables needed

```
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
STRIPE_SECRET_KEY
STRIPE_WEBHOOK_SECRET
RESEND_API_KEY
NEXT_PUBLIC_APP_URL=https://printmarkethub.com
CRON_SECRET
```

These are **not in git**. Store them in a password manager and set them in Vercel environment variables.

---

## How to resume work on a new computer

1. Clone the repo: `git clone https://github.com/marquina640/print-marketplace`
2. `npm install`
3. Create `.env.local` with the variables above (get values from password manager + Vercel dashboard)
4. Install Claude Code, open this folder
5. Claude reads this file automatically and has full context

Any migrations not yet applied: run them in the Supabase SQL Editor in numerical order.
