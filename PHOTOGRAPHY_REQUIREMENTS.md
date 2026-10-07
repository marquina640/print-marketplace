# Photography Requirements

This document lists every photography placeholder that needs a real image.

---

## IMG-01: Hero Photograph

**Location**: `app/page.tsx`, hero section, right column
**Subject**: A functional printed object on a workbench, or a printer running in a clean workshop
**Orientation**: Landscape 4:3
**Aspect Ratio**: 4:3 displayed in the hero right column on desktop
**Framing**: Medium shot, warm workshop light, finished part visible
**Lighting**: Warm artificial or natural light, studio-quality but not sterile
**What NOT to include**: Brand logos on printer, people's faces, clutter in background

---

## IMG-02: Design Process (Sketch to CAD to Print)

**Location**: `app/page.tsx`, design-help section, left column
**Subject**: A progression from sketch/drawing to a CAD screen to a finished printed result
**Orientation**: Landscape 4:3
**Aspect Ratio**: 4:3, side by side with dark background text
**Framing**: Flat lay of notebook sketch, screen showing CAD model, and printed part
**Lighting**: Clean natural or diffused studio light
**What NOT to include**: Identifiable personal items, food, phones

---

## IMG-03: Finished Printed Part (How It Works Step 03)

**Location**: `app/page.tsx`, how-it-works section, step 03 right side
**Subject**: A cleanly photographed finished 3D printed part on a neutral surface
**Orientation**: Landscape 4:3
**Aspect Ratio**: 4:3
**Framing**: 3/4 angle, part clearly in focus, clean background
**Lighting**: Bright diffused natural light, no harsh shadows
**What NOT to include**: Copyrighted characters, NSFW items

---

## IMG-04: Functional Parts

**Location**: `app/page.tsx`, "What can be made" section, tile 1
**Subject**: Bracket, clip, or jig in actual use — mounted to something, holding something
**Orientation**: Square or 4:3
**Aspect Ratio**: Tile, displayed at h-40
**Framing**: Close-up showing the part doing its job
**Lighting**: Clean ambient, no harsh shadows
**What NOT to include**: Copyrighted products, brand logos

---

## IMG-05: Prototypes and Engineering

**Location**: `app/page.tsx`, "What can be made" section, tile 2
**Subject**: A mechanical prototype on a desk — concept model, mechanical assembly in progress
**Orientation**: Square or 4:3
**Aspect Ratio**: Tile, displayed at h-40
**Framing**: 3/4 overhead angle, clean desk surface
**Lighting**: Natural or studio light, showing form clearly
**What NOT to include**: Messy environments, copyrighted IP

---

## IMG-06: Models and Creative Projects

**Location**: `app/page.tsx`, "What can be made" section, tile 3
**Subject**: Miniature figurine, scale model, or sculptural object — something visually interesting
**Orientation**: Square or 4:3
**Aspect Ratio**: Tile, displayed at h-40
**Framing**: Close-up with shallow depth of field showing detail
**Lighting**: Soft side light to reveal form
**What NOT to include**: Copyrighted characters (no Pokémon/Disney), NSFW items

---

## IMG-07: Small Production Run

**Location**: `app/page.tsx`, "What can be made" section, tile 4
**Subject**: A batch of identical 3D printed parts laid out neatly — several identical pieces
**Orientation**: Square or 4:3
**Aspect Ratio**: Tile, displayed at h-40
**Framing**: Overhead flat lay showing the batch uniformity
**Lighting**: Even overhead light, clean surface
**What NOT to include**: Identifiable brand names on parts

---

## IMG-08: Maker Workshop / Printer Setup

**Location**: `app/page.tsx`, maker recruitment section, left column
**Subject**: A 3D printer running in a maker's workshop, or a maker working at their setup
**Orientation**: Square (aspect-square)
**Aspect Ratio**: 1:1, displayed alongside dark background text
**Framing**: Medium shot, warm workshop atmosphere, printer running or maker at desk
**Lighting**: Warm incandescent or LED, not harsh studio
**What NOT to include**: Visible screens with identifiable software, messy desks, people's faces

---

## Maker Card Fallback (no IMG number)

**Location**: `components/makers/maker-card.tsx`, cover image fallback gradient
**Note**: Currently using a gradient by certification level. A real fallback image should be a clean macro of printed layer texture.
**Subject**: Extreme close-up of FDM layer lines, abstract and textural
**Orientation**: Landscape 16:9, displayed at h-44
**Framing**: Raking light from the side to show layer texture
**Lighting**: Side light to emphasize texture
**What NOT to include**: Nothing identifiable — purely abstract texture
