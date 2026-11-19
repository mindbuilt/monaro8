---
name: MONARO8
description: An independent venture builder surveyed onto the real Cooma terrain. Basalt night relief, limestone survey sheets, 1px hairlines.
colors:
  basalt: "#111312"
  basalt-raised: "#181b19"
  limestone: "#F4F2ED"
  stone: "#EAE6DF"
  ink: "#181A19"
  ink-muted: "#525754"
  ink-light: "#F4F2ED"
  ink-light-muted: "#9BA19D"
  alpine-gold: "#C5A880"
  gold-ink: "#7A6238"
  index-contour-ink: "#9a7f52"
  eucalypt: "#4A5448"
  lichen: "#8F978E"
  survey-red: "#9b3b2a"
  rule-dark: "rgba(24, 26, 25, 0.14)"
  rule-dark-strong: "rgba(24, 26, 25, 0.32)"
  rule-light: "rgba(244, 242, 237, 0.14)"
  rule-light-strong: "rgba(244, 242, 237, 0.3)"
typography:
  display:
    fontFamily: "Inter, -apple-system, BlinkMacSystemFont, sans-serif"
    fontSize: "clamp(2.6rem, 5.6vw, 5.75rem)"
    fontWeight: 600
    lineHeight: 0.98
    letterSpacing: "-0.04em"
  display-sheet:
    fontFamily: "Inter, -apple-system, BlinkMacSystemFont, sans-serif"
    fontSize: "clamp(2.75rem, 6vw, 5.5rem)"
    fontWeight: 600
    lineHeight: 0.95
    letterSpacing: "-0.045em"
  headline:
    fontFamily: "Inter, -apple-system, BlinkMacSystemFont, sans-serif"
    fontSize: "clamp(2rem, 3.6vw, 3.25rem)"
    fontWeight: 600
    lineHeight: 1.04
    letterSpacing: "-0.03em"
  title:
    fontFamily: "Inter, -apple-system, BlinkMacSystemFont, sans-serif"
    fontSize: "1.625rem"
    fontWeight: 600
    lineHeight: 1.1
    letterSpacing: "-0.02em"
  lede:
    fontFamily: "Inter, -apple-system, BlinkMacSystemFont, sans-serif"
    fontSize: "1.1875rem"
    fontWeight: 400
    lineHeight: 1.6
  body:
    fontFamily: "Inter, -apple-system, BlinkMacSystemFont, sans-serif"
    fontSize: "1.0625rem"
    fontWeight: 400
    lineHeight: 1.6
  label:
    fontFamily: "Inter, -apple-system, BlinkMacSystemFont, sans-serif"
    fontSize: "0.75rem"
    fontWeight: 500
    lineHeight: 1.5
    letterSpacing: "0.06em"
  data:
    fontFamily: "JetBrains Mono, IBM Plex Mono, ui-monospace, monospace"
    fontSize: "0.75rem"
    fontWeight: 400
    lineHeight: 1.5
    letterSpacing: "0.04em"
    fontFeature: "tnum"
  wordmark:
    fontFamily: "Inter, -apple-system, BlinkMacSystemFont, sans-serif"
    fontSize: "1.0625rem"
    fontWeight: 700
    letterSpacing: "0.06em"
rounded:
  none: "0px"
spacing:
  s1: "8px"
  s2: "16px"
  s3: "24px"
  s4: "40px"
  s5: "64px"
  s6: "clamp(88px, 11vw, 160px)"
  gutter: "clamp(20px, 4vw, 56px)"
  header: "56px"
components:
  button-gold:
    backgroundColor: "{colors.alpine-gold}"
    textColor: "{colors.basalt}"
    rounded: "{rounded.none}"
    padding: "16px 22px"
  button-gold-hover:
    backgroundColor: "{colors.ink-light}"
    textColor: "{colors.basalt}"
  button-ink:
    backgroundColor: "{colors.ink}"
    textColor: "{colors.ink-light}"
    rounded: "{rounded.none}"
    padding: "16px 22px"
  button-ink-hover:
    backgroundColor: "{colors.eucalypt}"
    textColor: "{colors.ink-light}"
  input-field:
    backgroundColor: "#ffffff"
    textColor: "{colors.ink}"
    typography: "{typography.body}"
    rounded: "{rounded.none}"
    padding: "13px 14px"
  nav-link:
    backgroundColor: "{colors.basalt}"
    textColor: "{colors.ink-light-muted}"
    height: "{spacing.header}"
    padding: "0 24px"
  nav-link-hover:
    backgroundColor: "{colors.basalt-raised}"
    textColor: "{colors.ink-light}"
  route-option:
    backgroundColor: "{colors.limestone}"
    textColor: "{colors.ink}"
    rounded: "{rounded.none}"
    padding: "16px 16px 18px"
  route-option-checked:
    backgroundColor: "{colors.ink}"
    textColor: "{colors.ink-light}"
  waypoint-frame:
    backgroundColor: "rgba(17,19,18,.9)"
    textColor: "{colors.ink-light}"
    rounded: "{rounded.none}"
    padding: "16px"
  title-block:
    backgroundColor: "rgba(17,19,18,.82)"
    textColor: "{colors.ink-light-muted}"
    typography: "{typography.data}"
    width: "300px"
    padding: "9px 12px"
---

# Design System: MONARO8

## Overview

**Creative North Star: "The Survey Sheet"**

Every surface is a page of a survey of Cooma. The real Monaro terrain (a 31.6 × 19.7 km SRTM DEM) is the ground the site sits on: on desktop it renders as a live WebGL contour relief in basalt night, and everywhere else as the same real contours drawn as a static SVG. Over that ground the site lays two kinds of paper: dark "windows" that let the terrain show through, and limestone or stone "sheets" that carry reading and proof. Everything is ruled, labelled and positioned the way a printed topographic sheet is: title block, scale bar, north arrow, graticule ticks, waypoint marks, a legend.

The editorial half is Swiss: one sans family set big and tight for display, a 12-column grid, generous section padding, and hairlines instead of boxes. The cartographic half is brutalist in its honesty: square corners, no shadows, no ornament that is not survey chrome, and every number shown is a real coordinate, elevation, date or count. Density is low in prose and high in data strips, which read like map margins.

The world refuses the studio-portfolio default (centred headline, card row, logo wall) and the brand's named anti-references: purple gradients, glowing orbs, meeting stock photography, SaaS clichés.

**Key Characteristics:**
- Real Cooma topography as the signature, never a generic texture.
- Basalt windows over terrain alternate with limestone and stone sheets.
- 1px survey hairlines do all the structural work; zero radius, zero shadow.
- Inter for words, JetBrains Mono strictly for data.
- Alpine gold is the single warm signal: index contours, waypoints, primary action, focus.

## Colors

A low-chroma mineral palette (basalt, limestone, lichen, eucalypt) with one warm metal, alpine gold, used as the survey's index colour.

### Primary
- **Alpine Gold** (`alpine-gold`): the 100 m index contours, waypoint survey marks, the primary button, the active nav underline, focus outlines, selection highlight, the "8" in the wordmark and "live" stage squares. On dark ground only; it fails as text on limestone.
- **Gold Ink** (`gold-ink`): alpine gold darkened for text on limestone (method numerals, live-stage values, waypoint labels on the light survey map, input caret). Holds AA on limestone.
- **Index Contour Ink** (`index-contour-ink`): the 100 m index contours and their legend key on the light survey map, a lighter gold-brown than gold ink so contours read as linework, not text.

### Secondary
- **Eucalypt** (`eucalypt`): the 20 m minor contours on light sheets, the low end of the terrain's elevation tint, the ink button's hover, the success status border, method example lines.
- **Lichen** (`lichen`): the 20 m minor contours on dark ground, the high end of the elevation tint, "datum/cursor" source labels, footer labels, non-live stage squares, scrollbar thumb.

### Neutral
- **Basalt** (`basalt`): page ground, header strip, footer, dark windows when terrain is absent, the terrain shader's base colour.
- **Raised Basalt** (`basalt-raised`): nav hover fill and image wells on dark ground; the only tonal step above basalt.
- **Limestone** (`limestone`): the primary reading sheet (Studio Ledger, venture sheets, thesis, contact).
- **Stone** (`stone`): the alternate sheet (founder and place), ledger row hover, route-option hover.
- **Ink** (`ink`) and **Muted Ink** (`ink-muted`): text on sheets; muted carries secondary prose, table heads, dt labels.
- **Light Ink** (`ink-light`) and **Muted Light Ink** (`ink-light-muted`): text on basalt.
- **Survey Hairlines** (`rule-dark`, `rule-dark-strong`, `rule-light`, `rule-light-strong`): every divider, table rule, grid cell edge and frame. Strong for frame edges and table heads, base for internal rows.
- **Survey Red** (`survey-red`): form errors only (invalid field border and ring, error text, failed-send border).

### Named Rules
**The Index Contour Rule.** Gold is the index colour. It marks what the survey wants you to find (index contours, waypoints, the one primary action, focus) and nothing else. One gold button per view.

**The Two Grounds Rule.** A surface is either a basalt window (terrain or contours behind, light ink) or a limestone/stone sheet (dark ink, no terrain). Never place limestone text panels floating over the terrain.

## Typography

**Display Font:** Inter, optical sizes 14–32 (with -apple-system, BlinkMacSystemFont, sans-serif)
**Body Font:** Inter
**Label/Mono Font:** JetBrains Mono (with IBM Plex Mono, ui-monospace) for data only

**Character:** One grotesque doing all the talking, set semibold and very tight at display sizes so headlines sit like map titles; a monospace that only ever appears where a surveyor would write a figure.

### Hierarchy
- **Display** (600, clamp(2.6rem, 5.6vw, 5.75rem), 0.98, -0.04em): the home proposition over the terrain, capped at 15ch. Inner page heroes use a near-identical step (clamp(2.5rem, 5.2vw, 5rem), line-height 1); the closing window uses clamp(2.4rem, 5vw, 4.75rem).
- **Display Sheet** (600, clamp(2.75rem, 6vw, 5.5rem), 0.95, -0.045em): venture names heading each venture sheet.
- **Headline** (600, clamp(2rem, 3.6vw, 3.25rem), 1.04, -0.03em): section h2s on sheets and windows. Thesis reading h2s step down to clamp(1.75rem, 2.8vw, 2.5rem).
- **Title** (600, 1.625rem, 1.1, -0.02em): venture names in waypoint frames; method steps use 1.25rem.
- **Lede** (400, 1.1875rem, 1.6): hero and page-hero standfirst, 46–52ch, in muted light ink. Thesis lead paragraphs use 1.3125rem at 1.5.
- **Body** (400, 1.0625rem, 1.6): prose, max 54–64ch, `text-wrap: pretty`; headings `text-wrap: balance`.
- **Label** (Inter 500, 0.75rem, 0.06em, uppercase): non-data names: dt terms, venture category, stage, footer column heads, the title-block tag line.
- **Data** (JetBrains Mono 400, 0.75rem, 0.04em, uppercase, tabular figures): coordinates, elevations, dates, counts, waypoint ids, ledger dates, scale and graticule figures, captions with capture dates.

### Named Rules
**The Surveyor's Pen Rule.** Mono is for figures a surveyor would write: coordinates, elevations, dates, counts, waypoint ids, ledger data. Words that name things use the Inter label style, never mono.

**The Tight Title Rule.** Display and headline sizes always carry negative tracking (-0.02em to -0.045em) and line-height at or below 1.1. Body never does.

## Layout

A centred container (max 1440px) with fluid gutters (clamp(20px, 4vw, 56px)) and a 12-column grid with 24px gaps carries every section. Compositions are asymmetric: heads take columns 1–6 with their standfirst at 8–12; ventures and thesis put a sticky intro or h2 in columns 1–4 and the content from column 5 or 6 to the edge; the founder section splits copy 1–5 and survey map 7–12. Sections breathe on the fluid `s6` step (88–160px) vertically; inside them the rhythm is the 8/16/24/40/64 scale.

The fixed 56px header strip sits over everything. The home hero fills 100svh with the proposition bottom-left and the map title block bottom-right. Breakpoints are content-driven: 1100px (ventures intro unsticks, grid spans full), 1000/900px (split layouts stack to one column; hero title block drops below), 760px (nav collapses to a Menu toggle, coordinate badge hides), 640px (waypoint grid and form fields go single-column; the ledger becomes stacked rows).

**The Terrain Gate Rule.** WebGL terrain runs only at min-width 900px with `prefers-reduced-motion: no-preference` and WebGL2. Every other visitor gets the static DEM contour SVG on a basalt ground, never a degraded animation.

## Elevation & Depth

Flat. There are no drop shadows anywhere. Depth is literal: the terrain itself is the only three-dimensional thing, lit by a single hillshade and tinted eucalypt-to-lichen by elevation. Above it, surfaces separate by ground (basalt window vs limestone sheet), by one tonal step (basalt to raised basalt), and by translucent basalt panels (title block at 82%, waypoint frames at 90%, waypoint labels at 78%) that let the relief read through. Legibility scrims are basalt-only linear gradients placed behind hero, page-hero and closing copy over terrain; they are the only gradients outside the terrain shader.

### Named Rules
**The Paper Not Plastic Rule.** Nothing lifts. State changes shift fill, ink, or hairline strength, never add shadow. The two `box-shadow` uses in the build are strokes, not elevation: the 2px inset gold underline on the current nav item and the 1px focus ring that doubles an input border.

## Shapes

Square everything (0px radius), including inputs, which reset the browser's default. Structure comes from 1px hairlines: grids are built by giving the container a top and left rule and each cell a right and bottom rule, so cells share edges like a sheet's grid. The one sanctioned circle is the survey mark: a 12–14px ring with a 2px centre dot, used for terrain waypoints, map marks and the radio mark in route options. Stage indicators are 6px solid squares. Icons are a single authored SVG arrow set (16px viewBox, 1.6 stroke, square caps, currentColor): down arrow for in-page, diagonal arrow for outbound.

## Components

### Buttons
Blunt survey tabs: solid fill, square, one line.
- **Shape:** square corners (0px), 1px transparent border.
- **Gold (primary):** alpine gold fill, basalt ink, Inter 600 1rem, 16px 22px padding, 14px gap to a trailing arrow icon. Used once per view on dark ground.
- **Ink:** ink fill, light ink text; the primary on limestone sheets (send enquiry).
- **Hover / Focus:** gold goes to light ink, ink goes to eucalypt over 0.25s on the expo-out ease; the arrow nudges 4px along its direction. Focus is the global 2px alpine-gold outline at 3px offset. Disabled drops to 55% opacity with a progress cursor.
- **Quiet link:** the secondary action beside a button: Inter 500, underlined with a strong hairline that turns gold on hover.

### Waypoint Frames
The venture card, framed as a map inset. A 2×2 grid of hairline cells on dark ground (one column under 640px). Each frame stacks a data strip (gold waypoint id, category label, stage with a 6px square), a 16:10 screenshot desaturated to 15% colour and slightly darkened, a body with the venture title and a one-line friction, an underlined domain link with the outbound arrow, and a foot strip with coordinates and elevation. Hover or focus restores full colour, scales the image 2.5%, deepens the fill, turns the link underline gold, and on desktop flies the terrain camera to the waypoint and lifts its elevation band.

### Map Title Block
A 300px framed data stack, bottom-right of the home hero: name and north arrow, a label tag line, datum, elevation, sheet size, contour interval, a live scale bar, and a lichen source line. Rows divide on base hairlines inside a strong-hairline frame.

### Survey Rule
A 1px hairline with nine ticks (every fourth tall) that draws across the top of each section on entry: the base strokes in over 1.6s, then ticks appear at 70ms intervals. Reduced motion shows it fully drawn.

### Inputs / Fields
- **Style:** white field, strong dark hairline, square, 13px 14px padding, Inter 1.0625rem, gold-ink caret, labels Inter 500 0.9375rem above.
- **Focus:** border goes to ink and a 1px ink ring doubles it; no glow.
- **Error:** survey red border and ring, survey red message below in plain language.
- **Route options:** a three-cell hairline grid of radio choices; hover fills stone, checked inverts to ink with a gold survey mark.

### Navigation
A fixed basalt map-header strip with a light hairline below. Left: the MONARO8 wordmark (Inter 700, 0.06em, gold "8") and a mono coordinate badge that reads DATUM at rest and CURSOR with live lat/lon/elevation when the pointer is over terrain. Right: Ventures, Thesis, Contact as full-height cells divided by vertical hairlines, Inter 500 0.9375rem in muted light ink; hover fills raised basalt, the current page gets a 2px gold underline. Under 760px a bordered Menu toggle drops a full-width stacked list.

### Studio Ledger
A dated table on limestone: mono date and venture columns, plain-language shipped text, strong hairline under the head, base hairlines between rows, stone hover. Stacks into two-line rows under 640px.

### Terrain Relief (signature)
Full-viewport WebGL behind dark windows: basalt base, lichen 20 m minor contours, alpine-gold 100 m index contours, eucalypt-to-lichen elevation tint under a single hillshade. Ambient camera drift plus soft cursor parallax; scroll flies plains to foothills; a hovered venture brightens contours near its waypoint and lifts the one contour band at its elevation. Fades in over 1.6s. The static fallback and inner page heroes use the same DEM as SVG: lichen minor and gold index contours at fixed opacities on dark, eucalypt and index-contour-ink on the light survey map, drawn on with stroke-dashoffset when it enters view.

## Do's and Don'ts

### Do:
- **Do** derive every contour, coordinate and elevation from the real Cooma DEM and real positions; label the source.
- **Do** build structure from 1px hairlines (`rule-*`), with strong rules for frames and table heads and base rules for internal rows.
- **Do** set figures in JetBrains Mono (0.75rem, 0.04em, uppercase, tabular) and name things in the Inter label style (500, 0.75rem, 0.06em, uppercase).
- **Do** keep alpine gold to index contours, waypoints, the single primary action and focus; use gold ink for gold text on limestone.
- **Do** use the authored square-cap SVG arrow set for every icon.
- **Do** give mobile and reduced-motion visitors the static DEM contours, fully drawn.
- **Do** use the expo-out ease (cubic-bezier(0.16, 1, 0.3, 1)) for reveals and state changes.

### Don't:
- **Don't** round corners on any rectangle; circles are reserved for survey marks.
- **Don't** add drop shadows or glows; separate surfaces by ground, tone and hairline.
- **Don't** use gradients except the terrain shading and basalt legibility scrims behind copy over terrain.
- **Don't** set prose, names or categories in mono; mono is for data.
- **Don't** put alpine gold text on limestone or stone.
- **Don't** use purple gradients, glowing orbs, meeting stock photos, logo walls or a centred-headline-plus-card-row studio layout.
- **Don't** invent figures: no customer counts, revenue, user numbers or testimonials in data strips.
