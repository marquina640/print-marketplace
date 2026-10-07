# Photography Requirements

This document lists every photography placeholder that needs a real image.

---

## IMG-01: Homepage Hero (right column)

**Location**: `app/page.tsx`, hero section, right column (currently shows a UI mockup wireframe)
**Subject**: A real 3D printer in action, ideally with a completed functional part nearby
**Orientation**: Landscape (16:9)
**Aspect Ratio**: ~540x360px displayed at max-w-sm on desktop
**Framing**: Medium shot, slightly low angle to show the printer bed and nozzle
**Lighting**: Warm artificial light, studio-quality but not sterile
**What NOT to include**: Brand logos on printer, people's faces, clutter in background

---

## IMG-02: Maker Recruitment Section Background

**Location**: `app/page.tsx`, dark `bg-ink-950` maker recruitment section
**Subject**: A maker examining a freshly printed part, hands-on feel
**Orientation**: Landscape (16:9) or portrait for use as an offset image element
**Aspect Ratio**: 16:9 if used as a side-by-side image, or decorative right-side element
**Framing**: Close-up of hands holding a printed part, warm workshop light
**Lighting**: Warm incandescent or LED, not harsh studio
**What NOT to include**: Visible screens with identifiable software, messy desks

---

## IMG-03: How It Works Step Illustration

**Location**: `app/(browse)/how-it-works/page.tsx`, header area or above the steps grid
**Subject**: Simple, clean overhead shot of a 3D model file on screen next to the printed part
**Orientation**: Landscape
**Aspect Ratio**: 3:1 wide banner or 16:9
**Framing**: Flat lay — STL file on screen, printed part beside it on clean desk
**Lighting**: Clean natural or diffused studio light
**What NOT to include**: Identifiable personal items, food, phones

---

## IMG-04: "What Can We Make" Section

**Location**: `app/page.tsx`, "What can we print" section
**Subject**: A collection of varied 3D printed items: a functional bracket, a figurine, a vase, a prototype part
**Orientation**: Landscape
**Aspect Ratio**: 16:9 or 3:2, displayed full-width or 50% column
**Framing**: Flat lay or slight 3/4 angle, items arranged cleanly on white/light surface
**Lighting**: Bright diffused natural light, no harsh shadows
**What NOT to include**: Copyrighted characters (no Pokémon/Disney), NSFW items

---

## IMG-05: Maker Card Portfolio Fallback

**Location**: `components/makers/maker-card.tsx`, cover image fallback when no cover_image
**Subject**: A clean gradient is used currently, but a real fallback image should be a clean macro of printed layers/texture
**Orientation**: Landscape
**Aspect Ratio**: 16:9 crop, displayed at ~h-44
**Framing**: Extreme close-up of FDM layer lines, abstract and textural
**Lighting**: Raking light to show texture (from side)
**What NOT to include**: Nothing identifiable — purely abstract texture
