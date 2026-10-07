# PrintMarketHub Design System

## Color Tokens

### Warm (surface hierarchy, light theme)
| Token | Hex | Usage |
|-------|-----|-------|
| warm-50 | #FAFAFA | Page background |
| warm-100 | #F4F3F8 | Card/sidebar surface |
| warm-200 | #E8E4F0 | Borders, dividers |
| warm-300 | #D0C8E0 | Stronger border |
| warm-400 | #A89DB8 | Muted icons, placeholder |
| warm-500 | #7A6F96 | Secondary/muted text |
| warm-600 | #5C5275 | Medium text |
| warm-700 | #3D3060 | Primary text |
| warm-800 | #2B1B47 | Dark text, footer background |
| warm-900 | #1A1028 | Darkest text |

### Ink (brand primary, deep purple)
| Token | Hex | Usage |
|-------|-----|-------|
| ink-50 | #F5F2FF | Very light purple surface |
| ink-100 | #EBE5FF | Light surface |
| ink-700 | #483088 | Process badges |
| ink-800 | #3D2878 | Primary button bg |
| ink-900 | #2B1B47 | Primary button hover |
| ink-950 | #1A1028 | Hero/dark sections |

### Gold (accent/CTA)
| Token | Hex | Usage |
|-------|-----|-------|
| gold-300 | #F5D468 | Light accent |
| gold-400 | #EAB82A | Bright accent |
| gold-500 | #D4A017 | Brand ochre (sidebar active, eyebrow, logo) |
| gold-600 | #B88514 | Hover state |
| gold-700 | #8F6510 | Dark accent |

## CSS Custom Properties (globals.css :root)
- `--pmh-bg`, `--pmh-surface`, `--pmh-border`, `--pmh-text`, `--pmh-muted`, `--pmh-ochre`, `--pmh-purple`
- `--radius-sm: 6px`, `--radius-md: 8px`, `--radius-lg: 12px`, `--radius-xl: 16px`

## Typography
- **Font**: Satoshi via Fontshare CDN (weights 300/400/500/700/900)
- **Hero H1**: max `text-5xl` (52px), `font-black`, `leading-tight`, `tracking-tight`
- **Section headings**: `text-4xl font-black` for major, `text-3xl font-black` for secondary
- **Stats**: `text-3xl font-black`
- **Body**: `text-sm text-warm-600 leading-relaxed` or `text-base text-warm-500`
- **Section label**: `text-xs font-bold uppercase tracking-widest text-warm-500` (use `.section-label` class)

## Border Radius
- Cards/containers: `rounded-xl` (12px)
- Pills/badges/status: `rounded-full`
- Buttons: `rounded-xl` (already set in button component)
- NEVER use `rounded-2xl` on new components

## Shadows
- Only on true elevation: dialogs, dropdowns, floating cards
- `shadow-card`: static card default
- `shadow-lift`: on hover/interactive elevation
- Remove `shadow-card` from static marketing sections

## Button Hierarchy
| Variant | When to use |
|---------|-------------|
| `primary` | Strongest CTA (ink-800 background) |
| `gold` | Dashboard button, "Get started" in unauthenticated navbar |
| `outline` | Secondary actions |
| `ghost` | Tertiary/nav items |
| `danger` | Destructive actions |

**Rule**: "Post a request" and main product CTAs use `variant="primary"`. Gold is for sidebar active states and specific nav buttons only.

## Card Rules
Use card styling (`card`, `card-hover`, `feed-card`) ONLY on discrete objects:
- Maker card, job card, quote, machine listing, file, portfolio item, order row

Do NOT use card styling on:
- Marketing paragraphs
- Feature descriptions
- Trust statements
- How-it-works steps

## Utility Classes
- `.card`: `bg-white rounded-xl border border-warm-200 shadow-card`
- `.card-hover`: extends `.card` with hover effects
- `.feed-card`: extends `.card` with overflow-hidden and stronger hover
- `.section-label`: `text-xs font-bold uppercase tracking-widest text-warm-500`
- `.divider`: `border-t border-warm-200`
- `.page-container`: `max-w-7xl mx-auto px-4 sm:px-6 lg:px-8`
- `.accent-bar`: `border-l-4 border-gold-500 pl-4`

## Section Alignment
- Default: LEFT-ALIGNED
- Center only for: small CTAs, empty states, short stat rows

## Emojis
Prohibited in all product UI. Use Lucide icons instead.

## Dark Sections
ONE intentional dark section per marketing page. Use `bg-ink-950` or `bg-warm-900`. All others light.
