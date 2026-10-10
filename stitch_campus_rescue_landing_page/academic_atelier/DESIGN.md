---
name: Academic Atelier
colors:
  surface: '#fcf9f0'
  surface-dim: '#dddad1'
  surface-bright: '#fcf9f0'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f6f3ea'
  surface-container: '#f1eee5'
  surface-container-high: '#ebe8df'
  surface-container-highest: '#e5e2da'
  on-surface: '#1c1c17'
  on-surface-variant: '#434751'
  inverse-surface: '#31312b'
  inverse-on-surface: '#f4f1e8'
  outline: '#737782'
  outline-variant: '#c3c6d3'
  surface-tint: '#2f5da8'
  primary: '#0a458f'
  on-primary: '#ffffff'
  primary-container: '#2f5da8'
  on-primary-container: '#c8d9ff'
  inverse-primary: '#acc7ff'
  secondary: '#535e7b'
  on-secondary: '#ffffff'
  secondary-container: '#d1dcfe'
  on-secondary-container: '#56607d'
  tertiary: '#5b4300'
  on-tertiary: '#ffffff'
  tertiary-container: '#785900'
  on-tertiary-container: '#ffd271'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#d7e2ff'
  primary-fixed-dim: '#acc7ff'
  on-primary-fixed: '#001a40'
  on-primary-fixed-variant: '#0a458f'
  secondary-fixed: '#d9e2ff'
  secondary-fixed-dim: '#bbc6e7'
  on-secondary-fixed: '#0f1b34'
  on-secondary-fixed-variant: '#3b4662'
  tertiary-fixed: '#ffdf9e'
  tertiary-fixed-dim: '#f0c04f'
  on-tertiary-fixed: '#261a00'
  on-tertiary-fixed-variant: '#5b4300'
  background: '#fcf9f0'
  on-background: '#1c1c17'
  surface-variant: '#e5e2da'
typography:
  headline-xl:
    fontFamily: Newsreader
    fontSize: 44px
    fontWeight: '700'
    lineHeight: 52px
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Newsreader
    fontSize: 32px
    fontWeight: '600'
    lineHeight: 40px
    letterSpacing: -0.015em
  headline-md:
    fontFamily: Newsreader
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
    letterSpacing: -0.01em
  headline-sm:
    fontFamily: Newsreader
    fontSize: 20px
    fontWeight: '600'
    lineHeight: 28px
  body-lg:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  body-md:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 20px
  body-sm:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '400'
    lineHeight: 16px
  label-code:
    fontFamily: JetBrains Mono
    fontSize: 13px
    fontWeight: '500'
    lineHeight: 18px
  stamp-badge:
    fontFamily: JetBrains Mono
    fontSize: 11px
    fontWeight: '700'
    lineHeight: 12px
    letterSpacing: 0.12em
rounded:
  sm: 0.125rem
  DEFAULT: 0.25rem
  md: 0.375rem
  lg: 0.5rem
  xl: 0.75rem
  full: 9999px
spacing:
  gutter: 1.5rem
  margin: 2rem
  space-xs: 0.25rem
  space-sm: 0.5rem
  space-md: 1rem
  space-lg: 1.5rem
  space-xl: 2.5rem
---

## Brand & Style
This design system embodies the physical, analog authority of an academic registrar’s workbench fused with the computational precision of modern formal methods. It balances tactile warmth with rigorous clarity—translating mathematical constraint satisfaction and machine intelligence into physical office artifacts: heavy archival paper, physical rubber ink stamps, typewriter printout slips, graphite annotations, and blueprint schematics.

The target audience includes campus scheduling directors, department chairs, and academic operations staff who manage complex, high-stakes logistics under time constraints. The visual tone must elicit confidence, deliberateness, tactile satisfaction, and zero synthetic ambiguity. Every constraint resolution should feel like an inspected, approved, and inked decision.

## Colors
The palette is grounded in the material properties of archival stationery, fountain-pen iron gall inks, and administrative correction markers.

- **Primary Blueprint (`#2F5DA8`):** The operational lead color. Used for actionable controls, primary links, highlighted routes, and programmatic focus states.
- **Deep Navy Ink (`#1F2A44`):** The structural ink base. Serves as high-contrast primary text, crisp 1.5px–2px strokes, bounding borders, and solid footer foundations.
- **Highlighter Gold (`#E9B949`):** Accent marker tint. Applied to diffed states, modified time slots, and Gemma reasoning explanations.
- **Faded Graphite Neutral (`#6B6A63`):** Subdued lead-pencil neutral for secondary text, metadata labels, auxiliary stamps, and muted structural guidelines.

### Contextual Functional Colors
- **Canvas Base (`#F6F1E7`):** Warm cream desk paper. Backed by a structural 20px graph-paper matrix drawn with `#E6DDCB`.
- **Card Surface (`#FFFCF5`):** Pure stock off-white ledger card.
- **Sticky Memo Base (`#FFE79A`):** Canary-yellow sticky memo note for floating notices and constraint parameter chips.
- **Stamp Red (`#C8553D`):** Deep carmine ink for conflicting states, hard constraint violations, and "INFEASIBLE" markers.
- **Sage Green (`#5E8C61`):** Subdued botanical ledger green for validated states, satisfied constraints, and "VERIFIED" rubber stamps.

## Typography
Typography is split purposefully across three distinct voices:

1. **Newsreader (Editorial Serif):** Used for structural page titles, schedule section names, and high-level analytical digests. Brings humanistic gravity and historical weight to logistical repair.
2. **Inter (Systematic Sans):** Powers all standard UI workflows, form labels, data grids, narrative descriptions, and instructional copy. Ensures rapid, neutral readability.
3. **JetBrains Mono (Mechanical Monospace):** Represents algorithmic execution, raw constraint outputs (Z3 solver stats, SAT/UNSAT flags, timestamps), room inventory codes, and official rubber-stamp designations.

## Layout & Spacing
The layout simulates physical paper documents laid deliberately across a drafting desk.

- **Canvas Container:** Anchored around a 1440px viewport with a centered `max-width: 1200px` drafting canvas. Outer margins scale to `2rem`.
- **Background Texture:** A subtle grid (`20px x 20px`) patterned with 1px lines using `#E6DDCB` over `#F6F1E7` background canvas.
- **Grid Structure:** Strict 12-column fluid grid system within the max canvas, utilizing `1.5rem` (`24px`) gutters.
- **Vertical Rhythm:** Micro component spacing is strictly locked to an 8px base rhythm (`space-xs` = 4px, `space-sm` = 8px, `space-md` = 16px, `space-lg` = 24px, `space-xl` = 40px). Dividers use either a solid `1px` `#1F2A44` rule or a dashed `2px` perforation (`border-style: dashed; border-color: #6B6A63;`) representing physical tear sheets.

## Elevation & Depth
Elevation abandons soft, diffused digital blurs in favor of directional, tactile offset hard shadows and layered stationery stacking:

- **Level 0 (Desk Mat):** Background warm paper `#F6F1E7` with technical gridlines. Flat, non-elevated.
- **Level 1 (Paper Cards & Ledger Sheets):** Background `#FFFCF5`, 1.5px border in `#1F2A44`, with a directional offset shadow of `4px 4px 0px rgba(31, 42, 68, 0.12)`.
- **Level 2 (Tactile Controls & Sticky Memos):** Background `#FFE79A` or `#FFFCF5`, 2px solid `#1F2A44`, hard-edged drop shadow of `3px 3px 0px #1F2A44`.
- **Pressed State:** Shadow shifts to `0px 0px 0px`, with a `transform: translate(2px, 2px)` applied to simulate pressing down into the paper stock.
- **Level 3 (Modals & Overlays):** Deep navy backdrop scrim with 30% opacity, surface card with `6px 6px 0px #1F2A44` and 2px border.

## Shapes
Geometry is disciplined, paper-cut, and structural.

- **Corner Radius:** Core container cards, buttons, and panels adopt a restrained `6px` radius (`roundedness: 1`), simulating industrial-cut heavy cardstock.
- **Typewriter Slips & Monospace Slips:** Flat `2px` or `0px` sharp corners on data badges to evoke punch cards and cut teletype strips.
- **Rubber Stamps:** Framed in a double-stroke border (`2px` solid outer with a `1px` inner hairline), intentionally rotated by `rotate(-2.5deg)` or `rotate(1.5deg)`.

## Components

### Buttons
- **Primary:** Deep blueprint blue (`#2F5DA8`) fill, `#FFFCF5` text, 2px solid `#1F2A44` border. Hard offset shadow: `3px 3px 0px #1F2A44`. Active state: `translate(2px, 2px)` with shadow cleared.
- **Secondary (Paper Sheet):** `#FFFCF5` fill, `#1F2A44` text, 1.5px solid `#1F2A44` border. Shadow: `2px 2px 0px rgba(31, 42, 68, 0.2)`.
- **Destructive:** Stamp red (`#C8553D`) fill with white lettering and 2px `#1F2A44` border.

### Rubber-Stamp Badges
- Text transformed to uppercase monospace (`JetBrains Mono`, `stamp-badge`).
- Inked border: 2px solid border, matching ink text color.
- States:
  - `VERIFIED`: Sage green `#5E8C61`, tilted `rotate(-2deg)`.
  - `PROTECTED`: Blueprint blue `#2F5DA8`, tilted `rotate(1.5deg)`.
  - `RELOCATED`: Highlighter gold `#E9B949` background, `#1F2A44` text, tilted `rotate(-1.5deg)`.
  - `INFEASIBLE`: Carmine stamp red `#C8553D`, tilted `rotate(3deg)`.

### Cards & Ledger Blocks
- Background `#FFFCF5`, 1.5px `#1F2A44` outline, `6px` radius, `4px 4px 0px rgba(31, 42, 68, 0.12)` shadow.
- Header bands are delineated by a 1px solid horizontal `#1F2A44` ink line or a 2px dashed perforation.

### Sticky Note Chips & Callouts
- `#FFE79A` canvas fill, faint graphite drop shadow (`2px 2px 0px rgba(107, 106, 99, 0.25)`), `2px` corner radius.
- Optional top washi-tape detail: translucent band (`rgba(230, 221, 203, 0.7)`) pinned over the top margin edge.

### Form Inputs & Checkboxes
- **Text Inputs:** `#FFFCF5` base, 1.5px `#1F2A44` border. Focus state features a 2px blueprint ring with no soft halo. Placeholder in `#6B6A63`.
- **Checkboxes & Radios:** Hand-drawn ledger feel; 2px `#1F2A44` square border. Checked state displays a solid ink block or an inked "X" stamp.

### Schedule Repair Table
- Alternating subtle ledger rows (`#FFFCF5` and `#FBF7EE`).
- Modified or auto-repaired cells feature an organic Highlighter Gold (`#E9B949`) bottom underline or marker-tint highlight.
- Monospace computational notes (Z3 clause status) appear inside light typewriter pills (`#F1ECE1`).