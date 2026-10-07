# Visual Redesign Changelog

Branch: `visual-redesign`
Base commit: `5e271b7b`

---

## Step 1: Design System Foundation

### `app/globals.css`
- Added `--radius-sm`, `--radius-md`, `--radius-lg`, `--radius-xl` CSS custom properties to `:root`
- `.card`: `rounded-2xl` changed to `rounded-xl`
- `.card-hover`: inherits rounded-xl from `.card`
- `.feed-card`: inherits rounded-xl from `.card`
- Added `.section-label` utility class: `text-xs font-bold uppercase tracking-widest text-warm-500`
- Added `.divider` utility class: `border-t border-warm-200`

### `tailwind.config.ts`
- `fontFamily.mono`: Removed `JetBrains Mono` (was never loaded); replaced with system mono stack

---

## Step 2: UI Primitive Inconsistencies Fixed

### `components/ui/select.tsx`
- `border-gray-300` → `border-warm-300`
- `bg-white text-gray-900` → `bg-warm-50 text-ink-900`
- `focus:border-indigo-500 focus:ring-indigo-500/20` → `focus:border-gold-500 focus:ring-gold-500/20`
- `rounded-lg` → `rounded-xl`
- `disabled:bg-gray-50` → `disabled:bg-warm-100`

### `components/ui/empty-state.tsx`
- `bg-gray-100` → `bg-warm-100`
- `text-gray-400` → `text-warm-400`
- `text-gray-900` → `text-ink-900`
- `text-gray-500` → `text-warm-500`

### `components/ui/loading.tsx`
- `text-indigo-600` → `text-gold-500` on Spinner
- Skeleton colors: `bg-gray-200` → `bg-warm-200`, `bg-gray-100` → `bg-warm-100`

### `components/jobs/job-card.tsx`
- `hover:border-indigo-300` → `hover:border-ink-200`
- `text-gray-900` → `text-ink-900`
- `group-hover:text-indigo-600` → `group-hover:text-ink-700`
- `text-gray-500` → `text-warm-500`
- `text-gray-400` → `text-warm-400`
- `text-gray-700` → `text-warm-700`

---

## Step 3: Homepage Redesign (`app/page.tsx`)

### Hero section
- Removed amber grid background overlay (`backgroundImage` style)
- Headline: `text-7xl` → `text-4xl sm:text-5xl`, removed `leading-[0.92]`
- Headline copy changed to: "Need something / 3D printed? / Someone nearby / can make it."
- Primary CTA: `variant="gold"` → `variant="primary"`
- Secondary CTA: "I own a printer" → "How it works" with outline styling
- Tertiary: plain text link "Own a printer? Become a maker"
- Hero mockup: `rounded-2xl` → `rounded-xl` on container

### Trust bar
- Removed: `bg-[#D4A017]` gold background with emojis
- Replaced with: clean `bg-warm-50 border-b border-warm-200` strip
- Items: Lucide icons (Users, Globe, CheckCircle, Award), `text-sm text-warm-600`
- Dynamic maker count integrated into first item

### Platform stats
- `text-4xl` → `text-3xl font-black`

### Find your model section
- `rounded-2xl` → `rounded-xl` on model resource cards
- Hardcoded `text-[#D4A017]` → `text-gold-500` on inline link

### How it works section
- Removed emoji icons from step data
- Steps redesigned as editorial layout: large number (`text-4xl font-black text-warm-200`), heading, body
- Removed card boxes entirely, replaced with plain text columns
- Reduced to 3 steps for customers (was 4), 3 for makers (was 3)
- CTA: `variant="gold"` → `variant="primary"`
- Section header: changed from centered to left-aligned

### Why PrintMarketHub section
- Removed `rounded-2xl border border-warm-200 bg-white` card boxes from feature grid
- Replaced with clean icon + heading + body layout (no borders/background)
- Icons: `size={20} className="text-warm-400 mb-3"`
- `text-xs font-bold uppercase tracking-widest text-gold-600` eyebrow → `section-label` class

### What can we print section
- Removed emoji pill boxes, replaced with 2x2 grid
- Each item: label (warm-400), category name (ink-900 semibold), one-line description (warm-500)
- Section header: changed from centered to left-aligned

### CTA section
- Removed gradient `bg-gradient-to-br from-gold-400 to-gold-500`
- Replaced with `bg-warm-50 border-t border-warm-200`
- Button: `variant="primary"` (was custom dark class)
- Secondary: plain text link "Browse makers"

### NEW: Maker Recruitment Section
- Added dark section `bg-ink-950` between How it works and Why sections
- Heading: "Own a 3D printer? Put your printer to work."
- Body: explains 12% commission model
- CTA: links to `/for-makers`

### Footer
- `bg-[#2B1B47]` → `bg-warm-800`
- `text-[#9d97c4]` → `text-warm-400`
- `text-[#6b6580]` → `text-warm-600`

---

## Step 4: Public Marketing Pages

### `app/(browse)/how-it-works/page.tsx`
- Added `Button` import
- Removed emoji icons from all step data
- Step cards: colorful per-step borders removed, unified to `border-warm-200 bg-warm-50`
- `rounded-2xl` → `rounded-xl` on all step cards
- Hardcoded hex CTAs replaced with `<Button variant="primary">`
- Section headers: removed emojis
- Header pill: changed from gold-themed to neutral warm
- Trust bar: removed emojis, `rounded-2xl` → `rounded-xl`

### `app/(browse)/for-makers/page.tsx`
- Added `Button` import
- Removed emoji icons from `benefits`, `requirements` arrays
- Hero pill: changed from emerald to neutral warm
- `text-[#D4A017]` → `text-gold-500`
- Hardcoded hex CTAs → `<Button variant="primary">` and `<Button variant="outline">`
- `rounded-2xl` → `rounded-xl` on all cards and steps
- `bg-[#1a1535]` step numbers → `bg-ink-900`
- Final CTA block: `bg-[#1a1535]` → `bg-ink-950`, hardcoded hex link colors → warm tokens

### `app/(browse)/faq/page.tsx`
- Added `Button` import
- Removed emojis from `FAQSection` icon props
- CTA block: `bg-[#1a1535]` → `bg-ink-950`, hardcoded hex colors → tokens
- `rounded-2xl` → `rounded-xl`

### `app/(browse)/faq/faq-accordion.tsx`
- Made `icon` prop optional (`icon?: string`)
- Removed emoji from section heading display

---

## Step 5: Navigation Polish

### `components/layout/navbar.tsx`
- Notification dropdown: `rounded-2xl` → `rounded-xl`
- Gold active state in role-switcher: intentionally kept (correct per design brief)
- No other changes — navbar was already using proper tokens

### `components/layout/sidebar.tsx`
- Not changed (gold active state is correct and intentional)

---

## Step 6: Maker/Job Cards

### `components/jobs/job-feed-card.tsx`
- `rounded-2xl` → `rounded-xl` on article container
- `border-indigo-200 bg-indigo-50 text-indigo-700` (design-needed badge) → `border-ink-200 bg-ink-50 text-ink-700`

### `components/makers/maker-card.tsx`
- `rounded-2xl` → `rounded-xl` on article container

---

## Step 7: Leaflet Map Popup

### `components/map/leaflet-map.tsx`
- Job pin: `background:#4f46e5` (indigo) → `background:#3D2878` (ink-700)
- Job popup budget text: `color:#4f46e5` → `color:#3D2878`
- Job popup link: `color:#4f46e5` → `color:#3D2878`
- Printer popup link: `color:#4f46e5` → `color:#3D2878`
- Printer pin ochre (`#ca8a04`) left unchanged (correct)

---

## Files Considered But NOT Changed

- `components/layout/sidebar.tsx` — gold active state is intentional and correct
- `components/ui/button.tsx` — button variants already correct
- `components/ui/badge.tsx` — badge system not in scope
- `components/ui/input.tsx` — not audited as an issue
- `app/(browse)/blog/` — blog pages not in audit scope
- `app/dashboard/**` — dashboard pages out of scope (functionality risk)
- `app/jobs/[id]/` — job detail pages out of scope
- `app/makers/[id]/` — maker profile out of scope
- `app/messages/` — messaging UI out of scope
- `app/legal/` — legal pages not marketing content

---

## Concerns and Notes

1. `components/layout/navbar.tsx` in the mobile menu uses `active ? 'bg-gold-500 text-ink-950'` — this is intentionally kept as the correct design token per the design brief.

2. `components/jobs/job-feed-card.tsx` still uses emoji strings (`JOB_TYPE_ICONS` map with emoji characters). These are used for image fallback display inside gradient boxes (not in text UI). Leaving them as-is per the "if in doubt don't change it" rule since removing them would change the visual fallback behavior.

3. `MATERIAL_GRADIENTS` in `job-feed-card.tsx` uses Tailwind color classes like `from-emerald-400`, `from-orange-400` etc. that are not part of the brand token system. These are intentional for distinguishing materials at a glance and were not changed (functional display decision, not a branding bug).

4. The `bg-blue-600` on the Thingiverse logo container in `app/page.tsx` was kept — this is Thingiverse's brand color used as a product badge, which is appropriate.
