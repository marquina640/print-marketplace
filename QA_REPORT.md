# QA Report — Visual Redesign

Branch: `visual-redesign`
Status: Awaiting manual testing

---

## Routes to Manually Test

### High Priority (changed in this redesign)

| Route | What to check |
|-------|--------------|
| `/` | Hero headline size, trust bar (no emojis, no gold bg), how-it-works editorial style, features without cards, CTA section (no gradient), dark maker section, footer color |
| `/how-it-works` | Step cards are neutral warm (not colorful), no emojis, Button components work |
| `/for-makers` | Hero text-gold-500, CTA buttons use Button component, step numbers bg-ink-900, final CTA bg-ink-950 |
| `/faq` | CTA block bg-ink-950, accordion still works, no TypeScript errors on icon prop |
| `/map` | Leaflet map pins show ink-700 purple (not indigo) for job pins, popups link colors correct |

### Medium Priority (component changes)

| Component | What to check |
|-----------|--------------|
| Job card (list views) | Color tokens correct — warm/ink instead of gray/indigo |
| Job feed card (browse page) | rounded-xl renders correctly, design-needed badge is ink not indigo |
| Maker card (browse page) | rounded-xl renders correctly, rating only shows if ratingCount > 0 |
| Select dropdowns | Warm border, gold focus ring, rounded-xl |
| Empty states | Warm icon background, ink heading color |
| Loading spinners | Gold-500 color (not indigo) |
| Skeleton cards | Warm-200/warm-100 shades |

### Low Priority (unchanged areas to verify)

| Route | What to check |
|-------|--------------|
| `/dashboard/client` | Sidebar gold active state still correct |
| `/dashboard/printer` | Sidebar gold active state still correct |
| Notification dropdown | rounded-xl, still positions correctly |
| Role switcher | Gold active pill still works |

---

## TypeScript Check

Run `npx tsc --noEmit` to verify no type errors were introduced.

Known potential issue: `faq-accordion.tsx` — `icon` prop changed from required to optional. Callers in `faq/page.tsx` were updated to not pass it. Verify no other callers pass it.

---

## Browser/Responsive Checks

- [ ] Mobile (375px): trust bar wraps correctly, hero headline fits
- [ ] Tablet (768px): feature grid 2-col, cards correct
- [ ] Desktop (1280px+): hero 2-col layout, full nav visible

---

## Accessibility Checks

- [ ] Hero CTA has sufficient contrast (primary button, ink-800 bg)
- [ ] Trust bar items have sufficient contrast (warm-600 text on warm-50 bg)
- [ ] Dark sections (bg-ink-950) have sufficient contrast for body text (warm-400)
