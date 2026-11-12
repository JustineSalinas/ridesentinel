# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Commuters and informal motorcycle riders (`driver` and `passenger`) in Jaro, La Paz, and Mandurriao (Iloilo City) who arrange rides externally via group chats or Messenger, plus named community administrators who review ID verifications, handle reports, and inspect the audit log.

## Product Purpose

RideSentinel lets two people about to share an informal motorcycle ride verify who they are meeting face-to-face at pickup and build reputation solely from mutually confirmed meetings.

## Positioning

Unlike ride-hailing platforms, RideSentinel does not match drivers, book trips, set prices, process payments, or track GPS. Unlike informal chat groups, identity checks and reputation are enforced on the server: human-reviewed ID + selfie verification, single-use 60-second QR handshakes, two-sided in-person confirmation, and blind 48-hour ratings that never reveal early.

## Operating Context

- **Scene:** Curbside outdoor pickups in Iloilo City on mobile phones (360px+ viewports, PWA-installable, HTTPS camera access for QR scanning, active data connection required).
- **Pre-ride:** Users register, accept Pilot v1 consent & guidelines (`privacy@ridesentinel.app`), and upload a government/school ID + selfie; an admin reviews within ~24h.
- **At pickup:** One verified rider shows a rotating QR (`60s` expiry, auto-rotates at `15s` remaining); the other scans it, sees the verified photo first, and both confirm face-to-face.
- **Post-ride:** Both have a 48h window to rate; scores stay hidden until both submit or the window closes, and ≥3 ratings from distinct users are required before an average score appears.
- **Demo/pilot convenience:** Landing includes a `DemoQuickAccess` login-email prefill bar for `Driver`, `Passenger`, and `Admin` test accounts without embedding passwords in client code.

## Capabilities and Constraints

- **Backend:** Convex (queries/mutations/actions, Convex Auth email+password, Convex file storage, scheduled functions); authorization enforced explicitly in `convex/lib/authz.ts`.
- **Data minimization:** Zero OCR and zero stored ID numbers; verification images are auto-purged 30 days after admin decision; account deletion anonymizes historical ratings rather than erasing other riders' scores.
- **Honest boundaries:** "ID-verified" means a human administrator checked a government or school ID — not a criminal background check or safety guarantee.
- **E2E contract:** `/register` preserves existing form field placeholders (`e.g. Marco D.`, `you@example.com`, `At least 8 characters`), adult 18+ checkbox, and button labels (`Create account`, `Log in`), plus `?email=` query prefill on `/login`.

## Brand Commitments

- **Name:** RideSentinel (`RideSentinel Pilot Community — Jaro / La Paz / Mandurriao`, contact `privacy@ridesentinel.app`).
- **Committed assets:** Brand blue `#2563EB` / `#1D4ED8` (`SPEC.md §17.5`, `DECISIONS.md` 2026-11-12) and the shield-with-checkmark emblem across app icons and navigation.
- **Tone:** Confident, friendly-but-serious civic utility (Grab-like clarity in blue, without hype or unverified claims).
- **Redesign scope (2026-11-12):** Landing and Auth surfaces (`/`, `/login`, `/register`) may adopt a fresh layout world and replace `Inter` with a distinctive typography pairing while keeping `#2563EB` blue and the shield mark; inner app screens stay as-is.

## Evidence on Hand

- Live specification and decisions in `docs/SPEC.md` and `docs/DECISIONS.md`.
- Working React + Vite + Convex app routes (`/`, `/login`, `/register`, `/consent`, `/verify`, `/home`, `/qr`, `/scan`, `/interactions`, `/profile`, `/report`, `/admin/*`).
- Pilot metrics targets (`SPEC.md §15`): ≥90% first-attempt QR scan success, ≥80% confirmation completion, ≤24h median verification turnaround, 100% QR replay rejection, 0 ratings without confirmed interaction.
- No invented testimonials, user counts, or press quotes.

## Product Principles

1. **The server decides what is true:** Tokens, verification tiers, confirmation state, and blind rating locks live strictly on the server.
2. **Photo-first human verification:** Interfaces show the verified person clearly before confirmation; humans compare faces, never automated recognition.
3. **Zero unconfirmed ratings:** Reputation cannot exist without a live mutual pickup handshake.
4. **Honest scope:** Never imply RideSentinel is a ride-hailing, booking, payment, or safety-guarantee service.
5. **Minimal retention:** Collect only what verification needs and purge ID images on schedule.

