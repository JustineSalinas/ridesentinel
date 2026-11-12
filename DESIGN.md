---
name: RideSentinel
description: Curbside verification and blind-rating web app for informal motorcycle rides in Iloilo City.
colors:
  ink: "#0f172a"
  ink-deep: "#0b1120"
  slate: "#475569"
  page: "#f1f5f9"
  mist: "#e2e8f0"
  paper: "#ffffff"
  brand: "#2563eb"
  brand-dark: "#1d4ed8"
  verified: "#16a34a"
  pending: "#d97706"
  danger: "#dc2626"
typography:
  display:
    fontFamily: "Bricolage Grotesque, system-ui, sans-serif"
    fontSize: "clamp(2.5rem, 4.5vw, 3.875rem)"
    fontWeight: 800
    lineHeight: 1.01
    letterSpacing: "-0.03em"
  marketing:
    fontFamily: "Onest, system-ui, sans-serif"
    fontSize: "0.96875rem"
    fontWeight: 400
    lineHeight: 1.6
  app-body:
    fontFamily: "Inter, system-ui, sans-serif"
    fontSize: "0.9375rem"
    fontWeight: 400
    lineHeight: 1.5
  mono:
    fontFamily: "JetBrains Mono, ui-monospace, monospace"
    fontSize: "0.75rem"
    fontWeight: 600
rounded:
  md: "8px"
  lg: "12px"
  xl: "16px"
  full: "9999px"
spacing:
  sm: "8px"
  md: "16px"
  lg: "24px"
  xl: "48px"
components:
  button-primary:
    backgroundColor: "{colors.brand}"
    textColor: "{colors.paper}"
    rounded: "{rounded.lg}"
    padding: "14px 24px"
  button-primary-hover:
    backgroundColor: "{colors.brand-dark}"
---

## Overview

RideSentinel splits its visual grammar intentionally by surface mode while sharing one brand palette (`#2563EB` signal blue, `#0F172A` ink, `#F1F5F9` page, `#FFFFFF` paper):

- **Persuade & Onboarding surfaces (`/`, `/login`, `/register`):** *Iloilo Curbside Signal* world — `Bricolage Grotesque` display headlines, `Onest` body copy, `JetBrains Mono` protocol tokens, flat `#2563EB` signal-blue focal fields, and 1px hairline specification ledgers.
- **Operate app surfaces (`/home`, `/qr`, `/scan`, `/verify`, `/profile`, `/admin/*`):** Mobile-first `Inter` UI preserved from `docs/SPEC.md §18`.

## Colors

- **Grounds:** Dark tarmac `#0F172A` (`--color-ink`) and `#0B1120` for opening hero, auth, and footer; `#FFFFFF` (`--color-paper`) and `#F1F5F9` (`--color-page`) for readable daylight sections and app screens.
- **Primary Signal:** `#2563EB` (`--color-brand`) with `#1D4ED8` (`--color-brand-dark`) hover. Pair `#2563EB` fields with pure `#FFFFFF` or `#EFF6FF` (`text-blue-50`) text to preserve ≥4.5:1 WCAG AA contrast.
- **Semantic Status:** Verified (`text-green-800` on `bg-green-100`, `text-green-400` on dark), Pending (`text-amber-800` on `bg-amber-100`, `text-amber-700` on white), Danger (`#DC2626`).

## Typography

- **Marketing Display (`font-display`):** `Bricolage Grotesque` (600–800) with `-0.03em` tracking on hero headlines.
- **Marketing Body (`font-marketing`):** `Onest` (400–700), minimum `12px` for functional UI text and `14px–16px` for body paragraphs (capped at `≤75ch` measure).
- **App Body (`font-sans`):** `Inter` (400–800) on inner authenticated rider and admin routes.
- **Protocol Tokens (`font-mono`):** `JetBrains Mono` strictly for QR nonces, TTL/countdowns (`tabular-nums`), and pilot scope metadata.

## Layout

- **Landing (`/`):** Top sticky bar → wide headline + action header → unified 2-zone Curbside Signal Deck (`bg-brand` protocol ledger joined flush to the interactive `HandshakePreview`) → unbroken 4-column horizontal step strip → 2-column specification ledger (`Why RideSentinel` + 3 server rules) → 2-column FAQ → closing strip + `DemoQuickAccess`.
- **Auth (`/login`, `/register`):** Focused, centered single-column layout (`max-w-[460px]`) on `#0F172A` with high-contrast segmented tabs and accessible `<label>` pairs.

## Elevation & Depth

- Marketing and Auth surfaces rely on **1px hairline borders** (`border-white/15` on dark, `border-mist` `#E2E8F0` on light) and tonal contrast rather than nested cards or blurred glow shadows.
- Inner mobile app screens preserve existing `.neu-out` / `.neu-in` soft-UI utility classes in `src/index.css`.

## Shapes

- Controls and inputs use `12px` (`rounded-xl`) or `8px` (`rounded-lg`); status chips use `rounded-full` or `rounded-md`.
- Keep containers flat — avoid nesting bordered/shadowed cards inside other cards.

## Do's and Don'ts

- **Do:** Keep `≥12px` text floor, `≥4.5:1` contrast, `≤75ch` prose measure, and `tabular-nums` on countdowns and metrics.
- **Don't:** Add uppercase kickers above headings, `01/02/03` chapter pills beside titles, CSS grid-line background gradients, fake user avatar stacks, or passwords in client bundles.
