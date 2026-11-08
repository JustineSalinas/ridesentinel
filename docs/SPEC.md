# RideSentinel — Implementation Spec (for Claude Code)

> Anything marked **DECISION** is a gap in the capstone paper that this spec fills. Change it if you disagree, then tell Claude Code.

---

## 0. How Claude Code should work on this repo

1. Read this whole spec first. Build in the order of **Section 14 (Build Plan)**. One milestone per branch and pull request.
2. **The server decides what is true.** The phone never decides tier, token validity, interaction state, rating visibility or admin rights. All of that lives in Postgres (RLS + SECURITY DEFINER functions) and Supabase Edge Functions.
3. Everything must run on **free tiers**. Do not add paid services, SDKs that need paid plans, or anything that needs a native build.
4. Prefer boring, well-known libraries (listed in Section 2). Do not add new dependencies without a reason written in the PR description.
5. Every schema change is a SQL migration file in `supabase/migrations/`. Never edit the database by hand.
6. Every feature ships with tests (Section 12). A feature is not done until its acceptance criteria (Section 13) pass.
7. Never log, print, or commit secrets, ID photos, or signed URLs. Never store ID numbers (no OCR).
8. When a requirement is ambiguous, pick the safest option, write a one-line note in `docs/DECISIONS.md`, and continue.

---

## 1. Product summary

**RideSentinel** is a mobile-first installable web app (PWA) that lets two people who are about to share an informal motorcycle ride check **who they are meeting** and build **reputation from confirmed meetings only**.

- It is **not** a ride-hailing app: no matching, booking, payments, pricing, GPS, or navigation. Users still arrange rides on Facebook, chats, etc.
- Core loop: **register → verify (ID + selfie, admin reviewed) → show/scan a rotating QR at pickup → both confirm the meeting → rate within 48 hours (hidden until both rate or window closes)**.
- Three design rules: **QR codes expire**, **ratings need a confirmed interaction**, **the server decides what is true**.
- Pilot: one community in Jaro / La Paz / Mandurriao, Iloilo City, 20–30 users, plus ≥2 named administrators. Four-day pilot (Oct 18–21, 2026). Hard deadline for everything: Oct 24, 2026.

### 1.1 Roles

| Role | Description |
|---|---|
| `user` | A driver or a passenger. Both use the same functions. `ride_role` (`driver`/`passenger`) is only a label chosen at registration. |
| `admin` | Reviewer with the admin role in the **same app** (no separate admin app). Reviews verification requests, handles reports, reads the audit log. |

### 1.2 Non-goals (do not build)

Ride matching/booking, payments, live GPS/location, navigation, social feed/comments/hashtags, OCR of ID data, native Flutter/React Native app, community-vouched tier (future), phone-number verification (future), push notifications (future), face recognition (the *humans* compare faces), background checks.

---

## 2. Tech stack (fixed)

| Area | Choice |
|---|---|
| Language | TypeScript everywhere (front end + Edge Functions); SQL for DB |
| Front end | React + Vite, built as PWA (`vite-plugin-pwa`) |
| UI | Tailwind CSS, shadcn/ui, Lucide React, Framer Motion (small animations only) |
| Routing / data / forms | React Router, TanStack Query, React Hook Form + Zod |
| QR | `qrcode.react` (display), `html5-qrcode` (camera scan) |
| Backend | Supabase: Auth (email + password), PostgreSQL with RLS, Storage (private bucket), Realtime, Edge Functions (Deno) |
| Hosting | Vercel Hobby (HTTPS required for camera) |
| CI | GitHub Actions: lint, typecheck, unit tests, policy tests, e2e |
| Tests | Vitest, React Testing Library, Playwright (two browser contexts), Supabase CLI (`supabase test db` / pgTAP for policy tests) |
| Package manager | `pnpm` (**DECISION**) |

Supabase quirks to respect: free projects pause after ~1 week of inactivity; default email sending is limited. **DECISION:** turn email confirmation **off** for the pilot; compress images to ~1 MB in the browser before upload.

---

## 3. Repository layout

```
ridesentinel/
├─ CLAUDE.md                     # points to docs/SPEC.md
├─ docs/
│  ├─ SPEC.md                    # this file
│  └─ DECISIONS.md               # running log of decisions made while building
├─ src/
│  ├─ main.tsx, App.tsx, routes.tsx
│  ├─ lib/                       # supabase client, zod schemas, utils, format
│  ├─ features/
│  │  ├─ auth/                   # login, register, consent
│  │  ├─ profile/
│  │  ├─ verification/           # submit ID+selfie, status
│  │  ├─ qr/                     # my-qr, scanner, scan-result
│  │  ├─ interactions/           # confirm, list
│  │  ├─ ratings/
│  │  ├─ reports/
│  │  └─ admin/                  # review queue, report queue, audit log
│  ├─ components/ui/             # shadcn
│  └─ hooks/
├─ supabase/
│  ├─ config.toml
│  ├─ migrations/                # 0001_schema.sql, 0002_rls.sql, 0003_functions.sql, ...
│  ├─ functions/
│  │  ├─ _shared/                # cors, auth helper, token signing, audit helper
│  │  ├─ issue-qr/
│  │  ├─ scan-qr/
│  │  ├─ confirm-meeting/
│  │  ├─ cancel-interaction/
│  │  ├─ admin-get-file-url/
│  │  ├─ admin-review-verification/
│  │  ├─ admin-handle-report/
│  │  └─ purge-expired-files/
│  ├─ tests/                     # pgTAP policy tests
│  └─ seed.sql                   # dev admin + sample users
├─ e2e/                          # Playwright
└─ .github/workflows/ci.yml
```

Environment variables (never commit; provide `.env.example`):

```
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=
# Edge Function secrets (supabase secrets set ...):
QR_SIGNING_SECRET=          # >=32 random bytes, base64; the phone never sees it
PURGE_CRON_SECRET=          # shared secret for the scheduled purge call
```

---

## 4. Domain model (database)

Seven data stores (D1–D7) from the paper, plus two support tables (`app_config`, `scan_events`) needed for the daily cap and for measuring evaluation targets. All tables have RLS **enabled**; default is deny.

### 4.1 Enums

```sql
create type app_role      as enum ('user','admin');
create type ride_role     as enum ('driver','passenger');
create type tier_t        as enum ('unverified','id_verified');   -- 'community_vouched' = future work
create type vreq_status   as enum ('pending','approved','rejected');
create type inter_status  as enum ('scanned','confirmed','cancelled','expired');
create type report_reason as enum ('impersonation','abusive_or_unsafe','fake_or_coerced_rating');
create type report_status as enum ('open','dismissed','warned','upheld');
create type report_action as enum ('dismiss','warn','remove_rating','suspend','revoke_tier');
```

### 4.2 Tables (reference SQL — adapt, but keep the columns and rules)

```sql
-- D1 users
create table profiles (
  id              uuid primary key references auth.users on delete cascade,
  role            app_role not null default 'user',
  ride_role       ride_role not null,
  display_name    text not null check (char_length(display_name) between 2 and 60),
  phone           text,                          -- optional, never returned by scan
  avatar_path     text,                          -- profile photo (private bucket 'avatars' or public-by-signed-url)
  tier            tier_t not null default 'unverified',
  tier_expires_at timestamptz,                   -- tier + 12 months on approval
  suspended_at    timestamptz,
  consent_at      timestamptz,                   -- RA 10173 consent + terms acceptance
  created_at      timestamptz not null default now()
);

-- D2 verification requests
create table verification_requests (
  id               uuid primary key default gen_random_uuid(),
  user_id          uuid not null references profiles on delete cascade,
  id_type          text not null,                -- e.g. 'driver_license','national_id','school_id' (label only, no ID number)
  id_photo_path    text,                         -- null after deletion
  selfie_path      text,                         -- null after deletion
  status           vreq_status not null default 'pending',
  reviewer_id      uuid references profiles,
  reason           text,                         -- required on reject
  decided_at       timestamptz,
  files_delete_after timestamptz,                -- decided_at + 30 days (or after an open dispute closes, whichever later)
  files_deleted_at timestamptz,
  created_at       timestamptz not null default now()
);
create unique index one_pending_per_user on verification_requests(user_id) where status='pending';

-- D3 QR tokens
create table qr_tokens (
  nonce      uuid primary key,
  user_id    uuid not null references profiles on delete cascade,
  issued_at  timestamptz not null default now(),
  expires_at timestamptz not null,               -- issued_at + 60 seconds
  used_at    timestamptz,
  used_by    uuid references profiles
);

-- D4 interactions
create table interactions (
  id                uuid primary key default gen_random_uuid(),
  nonce             uuid not null unique references qr_tokens,
  user_a            uuid not null references profiles,  -- QR owner
  user_b            uuid not null references profiles,  -- scanner
  scanned_at        timestamptz not null default now(),
  b_confirmed_at    timestamptz,                 -- "This is the person"
  a_confirmed_at    timestamptz,
  status            inter_status not null default 'scanned',
  rating_window_ends_at timestamptz,             -- set when status -> confirmed: now()+48h
  cancel_reason     text,
  check (user_a <> user_b)
);

-- D5 ratings
create table ratings (
  id             uuid primary key default gen_random_uuid(),
  interaction_id uuid not null references interactions on delete cascade,
  rater_id       uuid not null references profiles,
  rated_id       uuid not null references profiles,
  stars          smallint not null check (stars between 1 and 5),
  counted        boolean not null default true,  -- false when anti-abuse rules exclude it
  flagged        boolean not null default false,
  removed_at     timestamptz,
  removed_reason text,
  created_at     timestamptz not null default now(),
  unique (interaction_id, rater_id),
  check (rater_id <> rated_id)
);
-- "visible after" is derived, see 4.4 (rating_is_revealed).

-- D6 reports
create table reports (
  id               uuid primary key default gen_random_uuid(),
  reporter_id      uuid not null references profiles,
  reported_user_id uuid references profiles,
  rating_id        uuid references ratings,
  interaction_id   uuid references interactions,  -- e.g. face mismatch report
  reason           report_reason not null,
  details          text check (char_length(details) <= 500),
  status           report_status not null default 'open',
  action           report_action,
  handler_id       uuid references profiles,
  handler_reason   text,
  handled_at       timestamptz,
  created_at       timestamptz not null default now(),
  check (reported_user_id is not null or rating_id is not null)
);

-- D7 audit log (append-only)
create table audit_log (
  id          bigint generated always as identity primary key,
  actor_id    uuid,                              -- admin (or null for system jobs)
  action      text not null,                     -- 'verification.approve', 'verification.reject', 'file.view', 'report.uphold', 'tier.revoke', 'rating.remove', 'user.suspend', 'files.purge', ...
  target_type text,
  target_id   text,
  reason      text,
  metadata    jsonb,
  created_at  timestamptz not null default now()
);

-- support
create table app_config (key text primary key, value jsonb not null);
insert into app_config values
  ('qr_ttl_seconds','60'), ('rating_window_hours','48'), ('min_ratings_for_score','3'),
  ('pair_cooldown_days','7'), ('daily_counted_interaction_cap','10'), ('tier_months','12'), ('file_retention_days','30');

-- measures "90% of scans return a profile on first attempt" and "80% of scans end confirmed"
create table scan_events (
  id bigint generated always as identity primary key,
  scanner_id uuid, owner_id uuid, outcome text not null,   -- 'ok','expired','reused','bad_signature','self_scan','not_verified','suspended'
  interaction_id uuid, ms_to_profile integer, created_at timestamptz not null default now()
);
```

### 4.3 Hard database rules (enforce with triggers/privileges, not only UI)

- **Users cannot change** `role`, `tier`, `tier_expires_at`, `suspended_at`, `consent_at` on their own row (use a BEFORE UPDATE trigger that raises unless the caller is `service_role`/admin function, or revoke column privileges). No self-promotion to admin — admins are created via seed/SQL by the owner.
- `audit_log`: `REVOKE UPDATE, DELETE, TRUNCATE` from every role incl. `authenticated`; only `INSERT` via Edge Functions (service role). **No UI for editing.**
- `ratings`: insert **only** through RPC `submit_rating(...)` (SECURITY DEFINER); no direct insert/update policy for users.
- `interactions`, `qr_tokens`: written **only** by Edge Functions (service role).
- A suspended user (`suspended_at is not null`) cannot issue/scan QR, submit ratings, or submit verification.
- A tier is effective only if `tier = 'id_verified' and (tier_expires_at is null or tier_expires_at > now())`. Provide SQL function `is_verified(uuid) returns boolean`.
- Age ≥ 18: checked by the administrator against the submitted ID. Registration requires ticking "I am 18 or older"; the admin checklist on review requires confirming it before approve.

### 4.4 Derived logic (SQL functions / views)

**Rating reveal (blind rating).** A rating is *revealed* when **both** raters of that interaction have submitted **or** `now() >= interactions.rating_window_ends_at`. Implement as a view/function (lazy evaluation; no cron needed):

```sql
create function rating_is_revealed(p_interaction uuid) returns boolean language sql stable as $$
  select (select count(*) from ratings r where r.interaction_id = p_interaction) = 2
      or now() >= (select rating_window_ends_at from interactions i where i.id = p_interaction);
$$;
```

Users may read a rating row only if they are the rater, **or** `rating_is_revealed(interaction_id)` and `removed_at is null` — this makes "read another user's hidden rating" fail at the database.

**Public score (view `rating_summary`).** For each user, count ratings where: revealed, `counted`, `removed_at is null`, `rated_id = user`. Show `avg(stars)` **only if `count(distinct rater_id) >= min_ratings_for_score` (3)**; otherwise return `score = null` and the UI shows **"New"** plus `confirmed_meetings` = number of `interactions` with `status='confirmed'` where the user is A or B.

**Anti-abuse (`counted` flag, evaluated inside `submit_rating`):**
1. At most **one counted rating per pair of users per 7 days** (either direction counts as the same pair, per rater→rated). If a counted rating from the same rater to the same rated user exists in the last 7 days → insert with `counted=false`.
2. **Daily cap:** if a user already has `daily_counted_interaction_cap` (10) counted ratings *received or given* today → `counted=false`. (Cap value is tunable in `app_config`; **DECISION:** the cap is on counted ratings given per rater per UTC+8 calendar day.)
3. Uncounted ratings are stored but don't change the score.

**`submit_rating(p_interaction uuid, p_stars int)` (SECURITY DEFINER) must verify:** caller is A or B of the interaction; `status='confirmed'`; `now() < rating_window_ends_at`; no existing rating from caller; caller not suspended. Rated user = the other party. Raises distinct errors for each failure (used by tests).

**Interaction expiry.** An interaction stuck in `scanned` for > 10 minutes is treated as `expired` (**DECISION**): lazily in the Edge Function (`confirm-meeting` checks `scanned_at`) plus a `purge-expired-files` side job that flips old `scanned` rows to `expired`.

---

## 5. Row-level security (policy matrix)

| Table | `user` can | `admin` can |
|---|---|---|
| `profiles` | SELECT own row; UPDATE own `display_name`, `phone`, `avatar_path`, `ride_role` only. Other users' profiles are **never** selectable directly (scan returns a limited projection via Edge Function). | SELECT all; UPDATE only through admin Edge Functions |
| `verification_requests` | INSERT own (status pending); SELECT own row **without** file paths being usable (paths are useless without signed URLs; storage policy blocks reads) | SELECT all; update only through `admin-review-verification` |
| `qr_tokens` | nothing | nothing (service role only) |
| `interactions` | SELECT where `user_a = auth.uid() or user_b = auth.uid()` | SELECT all |
| `ratings` | SELECT own given; SELECT received only when revealed & not removed; no direct writes | SELECT all (moderation) |
| `reports` | INSERT own; SELECT own | SELECT all; update through `admin-handle-report` |
| `audit_log` | nothing | SELECT only |
| `app_config` | SELECT | SELECT |
| `scan_events` | nothing | SELECT (for evaluation export) |

Admin check helper: `create function is_admin() returns boolean ... select exists(select 1 from profiles where id = auth.uid() and role='admin' and suspended_at is null)` (SECURITY DEFINER, stable, `set search_path = public`).

**Storage**
- Bucket `verification` — **private**. Path pattern: `{user_id}/{request_id}/id.jpg`, `.../selfie.jpg`. Policy: user may `INSERT` into their own folder only; **nobody** (including the owner) can `SELECT`; admins read only via signed URL created by `admin-get-file-url`.
- Bucket `avatars` — profile photos. **DECISION:** private bucket; scan results and profile screens use short-lived signed URLs (e.g., 5 min) generated server-side.
- Short-lived signed URLs: 60 seconds for admin ID/selfie views.

---

## 6. Edge Functions (API contract)

All functions: verify the Supabase JWT (`Authorization: Bearer`), use the service-role client **inside** the function only, validate input with Zod, return JSON `{ ok: true, data }` or `{ ok: false, error: { code, message } }`, handle CORS. Never trust client-sent user IDs — use `auth.uid()` from the JWT.

### 6.1 `issue-qr` — POST `{}`
- Caller must be `is_verified` and not suspended, else `403 NOT_VERIFIED` / `SUSPENDED`.
- Create `nonce = uuid`, `expires_at = now() + 60s`; insert `qr_tokens`.
- Build token: `base64url(payload) + "." + base64url(HMAC-SHA256(QR_SIGNING_SECRET, payload))`, payload `{ sub: userId, iat, exp, nonce }`.
- Return `{ token, expires_at }`. The client renders the QR from `token`.
- Client auto-refreshes ~15 s before expiry (so a new token every ~45 s). Old nonces simply expire. Rate limit: max 20 issues/min/user.

### 6.2 `scan-qr` — POST `{ token }` (caller = User B)
Checks in order (record `scan_events.outcome` for each failure):
1. Caller verified & not suspended (`not_verified`/`suspended`).
2. Signature valid (`bad_signature`), `exp` not passed (`expired`), nonce row exists, `used_at is null` (`reused`).
3. `sub != caller` (`self_scan`).
4. Atomically mark nonce `used_at = now(), used_by = caller` (UPDATE ... WHERE used_at IS NULL, check rows = 1 → prevents races).
5. Insert `interactions` row (`user_a = sub`, `user_b = caller`, status `scanned`).
6. Return **only**: `{ interaction_id, profile: { display_name, ride_role, tier, photo_url (signed, 5 min), rating_summary: { score|null, count, confirmed_meetings } } }`. **Never** phone, email, ID details, address, or any other field.
- Target: profile on screen ≤ 3 s on 4G. Do a single round trip and a single DB transaction where possible.
- Realtime: A is subscribed to `interactions` changes where `user_a = me`; the insert triggers A's "Someone scanned you" prompt.

### 6.3 `confirm-meeting` — POST `{ interaction_id }`
- Caller must be A or B of that interaction; interaction `status='scanned'` and not older than 10 min.
- If caller = B: set `b_confirmed_at` (B's "This is the person").
- If caller = A: allowed **only after** `b_confirmed_at` is set? **DECISION:** A may confirm only after B has confirmed (matches the flowchart: B taps first, then A's screen shows B's profile and asks A to confirm). Before that return `409 WAIT_FOR_OTHER`.
- When both timestamps are set: `status='confirmed'`, `rating_window_ends_at = now() + 48h`. Return the interaction.
- A's screen must show **B's verified profile** (photo first) before A can confirm: provide `get-interaction-profile` behaviour inside this function or `scan-qr` response for A via an RPC/GET variant returning the same limited projection for the *other party*.

### 6.4 `cancel-interaction` — POST `{ interaction_id, reason: 'face_mismatch'|'other', report?: boolean }`
- Either party, status `scanned` only → `cancelled`. If `face_mismatch` and `report=true`, also inserts a `reports` row (`reason='impersonation'`, `interaction_id`, `reported_user_id` = the other party). No interaction record counted.

### 6.5 Admin functions (caller must be `is_admin()`)
- `admin-get-file-url` `{ request_id, kind: 'id'|'selfie' }` → writes `audit_log('file.view')` **before** returning a 60-s signed URL. If the audit insert fails, return no URL.
- `admin-review-verification` `{ request_id, decision: 'approve'|'reject', reason, confirmed_18_plus }`:
  - Reject requires non-empty `reason`. Approve requires `confirmed_18_plus=true`.
  - Approve: `tier='id_verified'`, `tier_expires_at = now()+12 months`, `files_delete_after = now()+30d`.
  - Reject: user sees reason and may resubmit; `files_delete_after = now()+30d`.
  - Writes `audit_log` (`verification.approve|reject`, actor, target, reason).
- `admin-handle-report` `{ report_id, action: 'dismiss'|'warn'|'remove_rating'|'suspend'|'revoke_tier', reason }`: reason mandatory; effects: `remove_rating` → set `removed_at/removed_reason`; `suspend` → `suspended_at=now()`; `revoke_tier` → `tier='unverified'`; update report status; write audit. Revoking a tier cancels nothing already confirmed. An admin cannot act on a report about themselves.
- `purge-expired-files` (called daily by GitHub Actions cron or Supabase scheduled function with `PURGE_CRON_SECRET`): delete storage objects for requests where `files_delete_after < now()` and **no open dispute** on that user (open report on that user extends retention until closed); set `*_path = null`, `files_deleted_at`; write `audit_log('files.purge', actor null)`; also flips stale `scanned` interactions to `expired`.

---

## 7. Front-end: routes and screens

Mobile-first (design at 360 px), large tap targets, high contrast on scan/confirm screens. **A first-time user must reach the scan screen in ≤ 3 taps** (e.g., Home → Scan; Home is the default route after login; the Scan and My QR buttons live in a bottom tab bar).

| Route | Screen | Notes |
|---|---|---|
| `/login`, `/register` | Auth | Email + password. Register collects display name, ride role (driver/passenger), phone (optional), "I am 18 or older". |
| `/consent` | Consent + terms | **Gate:** must be accepted (writes `consent_at`) before any ID upload. States what's collected, why, who sees it, 30-day deletion, contact for the data protection contact, disclaimer that a badge is not a safety guarantee and the app does not arrange/price/operate/endorse rides. |
| `/verify` | Submit ID photo + selfie | Pick `id_type`; capture via camera or file; compress to ~1 MB in-browser; show preview; upload to private bucket then insert request. |
| `/verify/status` | Pending/approved/rejected | Shows reason on reject + resubmit button. |
| `/home` | Dashboard | Tier badge, rating summary ("New · N meetings" or score), buttons: **My QR**, **Scan**, recent interactions, pending rating prompts. |
| `/qr` | My QR | Disabled with explanation if not verified. Shows QR + countdown, auto-refresh. Subscribes to realtime for scans. When a scan arrives: modal with **B's photo-first profile** and *Confirm meeting* / *Not this person* buttons (A confirms only after B confirmed; show waiting state otherwise). |
| `/scan` | Camera scanner | `html5-qrcode`; handle permission denied and unsupported-browser states; no QR caching. |
| `/scan/result/:id` | Scanned profile (photo-first) | **Large photo first**, then name, tier badge, rating summary. Two buttons: **"This is the person"** (primary) and **"Not the person / Cancel & report"**. Waits for A's confirmation (realtime). |
| `/interactions` | List | Confirmed interactions with status of rating window. |
| `/rate/:interactionId` | Rate | 1–5 stars. Shows time left in the 48-h window. After submit: "Hidden until both rate or window closes". |
| `/profile` | Own profile | Edit name/phone/avatar; view tier + expiry; request account deletion. |
| `/report` (modal from scan result / rating) | Report | Fixed reasons only (impersonation, abusive or unsafe conduct, fake or coerced rating) + optional details ≤ 500 chars. |
| `/admin` | Admin home | Links + counts. |
| `/admin/verifications` & `/:id` | Review queue / detail | Oldest first. Detail fetches signed URLs on demand (each view is audit-logged), shows ID + selfie + profile photo side by side, 18+ confirmation checkbox, Approve / Reject (reason required). |
| `/admin/reports` & `/:id` | Report queue / detail | Actions: dismiss, warn, remove rating, suspend, revoke tier — each with required reason. |
| `/admin/audit` | Audit log | Read-only, newest first, filter by action/actor. |

UX rules:
- Offline: show a clear "You're offline — a data connection is needed" banner on every screen; **do not cache** QR tokens or API responses for QR/scan/rating endpoints (service worker `NetworkOnly` for Supabase calls; precache only the static app shell).
- Unverified users see a persistent nudge to verify; QR generation is disabled for them.
- A verified badge never says "safe". Use the wording "ID checked by an administrator".
- Tier display: `ID-verified` (one color). Leave a styled-but-hidden slot for future `Community-vouched` (different color/label, weaker). Do not implement it.
- Accessibility: labels on all inputs, focus states, color contrast ≥ 4.5:1, scan/confirm buttons ≥ 56 px high, font ≥ 18 px on those screens.
- Motion: Framer Motion only for small transitions; respect `prefers-reduced-motion`.

---

## 8. Key flows (state machines)

### 8.1 Verification
`unverified` → user submits (request `pending`) → admin opens (audit `file.view`) → approve ⇒ `id_verified` (+12 months) / reject ⇒ request `rejected` with reason, user may resubmit (new request) → at `decided_at + 30 days` files purged.
Tier expiry: when `tier_expires_at < now()` the user is effectively `unverified` again (the UI prompts to re-verify). Revocation by admin sets `tier='unverified'`.

### 8.2 QR confirmation (the product's core)
```
A: My QR → token (60s, one-time nonce, signed)
B: Scan → server checks signature/expiry/nonce/not self/B verified
     → interaction{scanned}; B sees A's photo-first profile
B: "This is the person" → b_confirmed_at
A: (screen open) sees B's photo-first profile → "Confirm" → a_confirmed_at
server: both set → interaction{confirmed}, rating_window_ends_at = now()+48h
Any reject/mismatch/timeout → cancelled/expired, no interaction record counted
```
A screenshot fails twice: the token expires within 60 s, and A's own live device must approve the scan.

### 8.3 Rating
Confirmed interaction → both may rate once within 48 h → ratings hidden until both submitted or window closes → revealed → included in `rating_summary` if `counted` and not removed. If no rating arrives in 48 h, nothing is counted. Flag → report → admin may remove with a logged reason.

### 8.4 Reports
User files report (fixed reasons) → admin queue → action with logged reason → report status updated; reporter sees status (dismissed / warned / upheld).

---

## 9. Security requirements (must pass tests)

| Threat | Required behavior |
|---|---|
| QR replay / screenshot | Expired token, reused nonce, bad signature, and a scan that A never confirms are all rejected / produce no interaction. |
| Account lending | Photo-first screens; both confirm; mismatch report leads to review/revocation. |
| Fake ID | Admin checklist (selfie matches ID and profile photo, 18+). Not forensic. |
| ID image leak | Private bucket, no direct SELECT for any user, 60-s signed URLs, RLS everywhere, 30-day purge. |
| Admin misuse | Every file view and decision logged; audit log not editable from the app; limited named admins. |
| Rating abuse | Section 4.4 rules enforced in SQL. Collusion is slowed, not prevented (state this in docs). |
| Account takeover | Min password 8 chars, Supabase auth rate limits, email recovery. |
| IDOR | A user can never read another user's profile row, ID photo, hidden rating, or interaction they are not part of. |

Also: validate all inputs with Zod on both client and Edge Functions; use `set search_path = public` on SECURITY DEFINER functions; no `select *` returned from Edge Functions on `profiles`; strict CORS to the deployed origin; CSP header via Vercel config (self + Supabase origin); no secrets in client bundle.

---

## 10. Privacy and legal (RA 10173) — implement as product behavior

- Consent screen before any ID upload; consent timestamp stored.
- Data minimization: **no OCR, no ID number stored**; keep `id_type`, decision, decision date only.
- No location data collected, no GPS permission requested.
- ID/selfie images deleted **30 days after decision** (or after an open dispute closes, whichever is later).
- Users can view/correct profile and request account deletion; on deletion, their ratings are **anonymized** (rater/rated references replaced with a tombstone user; keep stars for others' scores) — implement as an RPC `delete_my_account()`.
- Scan returns only name, photo, tier, rating summary.
- Terms of use and community guidelines, accepted at registration: the app does not arrange, price, operate, or endorse rides; a badge is not a safety guarantee; users own their conduct; fake ratings and impersonation lead to account action. (Draft text in `src/features/auth/terms.ts`; the adviser reviews wording before pilot.)
- Name one **data protection contact** (configurable constant) shown on the consent screen.
- Survey/pilot data exported without names.

---

## 11. Non-functional requirements

| Area | Target |
|---|---|
| Performance | Scan → profile on screen ≤ 3 s on 4G; first load < 3 s on mid-range Android |
| Security | RLS on every table; private storage; signed short-lived links |
| Usability | ≤ 3 taps to scan; large fonts/high contrast on scan & confirm |
| Compatibility | Current Chrome on Android (test on a low-end phone); iPhone Safari if available; admin can use desktop browser |
| Connectivity | Needs data connection; clear offline message; no QR caching |
| Auditability | Every admin action logged; log immutable from the app |
| Maintainability | Lint + typecheck + tests on every PR; migrations only; typed Supabase client (`supabase gen types typescript`) |

---

## 12. Testing requirements

**Unit / component (Vitest + RTL):** QR token build/verify (valid, expired, tampered, wrong secret), tier effectiveness logic (expiry), rating summary rule (<3 raters ⇒ "New"), rating window countdown, form validation (Zod), photo-first result screen rendering order (photo before text).

**Database / policy tests (pgTAP via `supabase test db`):** these must **fail to read/write**:
- user reads another user's `profiles`, `verification_requests`, ID/selfie storage object, interactions they aren't in;
- user reads a rating before reveal; user inserts into `ratings`/`interactions`/`qr_tokens`/`audit_log` directly;
- user updates own `role`, `tier`, `suspended_at`;
- anyone updates/deletes `audit_log`;
- `submit_rating` rejects: not a party, interaction not confirmed, window closed, duplicate, suspended caller.

**Security tests (QR replay):** expired token rejected; reused nonce rejected; token scanned but never confirmed by A ⇒ no `confirmed` interaction; self-scan rejected; unverified scanner rejected; race: two simultaneous scans of the same nonce ⇒ exactly one succeeds. **Target: 100% of expired/reused/unconfirmed tokens rejected.**

**End-to-end (Playwright, two browser contexts A and B):** register + admin approves both → A opens My QR → B scans (inject token, or use a fake camera) → B taps "This is the person" → A confirms → both rate → ratings revealed; plus the mismatch/cancel path; plus offline banner. Run on every PR once it exists.

**Manual checklist before pilot:** low-end Android Chrome (camera permission denied/granted, QR readable in sunlight/brightness boost), iPhone Safari if available, PWA install, admin ID view access dry run, Supabase project status check.

---

## 13. Acceptance criteria (Must features)

Feature IDs match the paper's functional decomposition. Format: Given / When / Then.

**1.0 Account & profile**
- 1.1 *Given* new visitor, *when* they register with valid data, *then* a `profiles` row exists with role `user`, tier `unverified`, and they land on `/consent`.
- 1.3 *Given* a user without `consent_at`, *when* they open `/verify`, *then* they are redirected to `/consent`.
- 1.4 *Given* any table, *then* RLS is enabled and the policy tests in Section 12 pass.

**2.0 Verification**
- 2.1 Images are compressed to ≈1 MB and uploaded to the private bucket under the user's folder; a `pending` request is created; a second pending request is blocked.
- 2.2/2.3 Admin approves ⇒ user tier is `id_verified` with 12-month expiry and an audit entry; reject requires a reason and the user sees it.
- 2.4 Files older than the retention rule are deleted by the purge job and paths nulled.
- 2.5 Status screen reflects pending/approved/rejected + reason.

**3.0 QR confirmation**
- 3.1 Token expires at 60 s; nonce single use; signature verified server-side only.
- 3.2 My QR auto-refreshes before expiry; unverified users cannot generate.
- 3.3 Scanner returns a profile or a clear error for each failure case.
- 3.4 The photo is the first and largest element on the scanned profile.
- 3.5 Both sides must confirm; A cannot confirm before B; A receives a realtime prompt.
- 3.6 Confirmed interaction opens a 48-h rating window for both.

**4.0 Ratings**
- 4.1 One rating per person per confirmed interaction within 48 h; 0 ratings accepted without a confirmed interaction.
- 4.2 Ratings hidden until both rated or the window closes.
- 4.3 Score appears after ≥3 ratings from different users; else "New · N meetings".
- 4.4 Pair 7-day rule and daily cap implemented; excess ratings stored as `counted=false`.
- 4.5 Rating flag creates a report.

**5.0 Reports & moderation**
- 5.1–5.4 Report with a fixed reason; admin queue; actions dismiss/warn/remove rating/suspend/revoke tier each with a logged reason; reporter sees status.

**6.0 Admin & audit**
- 6.1–6.3 Every approval, rejection, file view and moderation action is written to `audit_log`; read-only viewer; admin dashboard links to queues.

**7.0 QA & deployment**
- 7.1 Installable PWA (manifest, icons, service worker that never caches QR/API).
- 7.2–7.4 Security/policy/e2e tests green in CI; Vercel deploy from `main`; README with setup and a data-export script.

---

## 14. Build plan (milestones; each one = branch + PR + passing tests)

Target dates from the paper's schedule (Oct 5–24, 2026; feature freeze Oct 17; Product Owner scope checkpoint Oct 14).

| # | Milestone | Scope | Target |
|---|---|---|---|
| M0 | Foundations | Repo, Vite+TS+Tailwind+shadcn, Supabase project, Vercel deploy of empty app, CI, `.env.example`, PWA shell, typed client | Oct 6–7 |
| M1 | Schema + RLS + audit | Migrations for all tables, enums, helper functions (`is_admin`, `is_verified`), RLS policies, storage buckets/policies, seed (dev admin), pgTAP policy tests | Oct 7 |
| M2 | Iteration 1: accounts + verification | Register/login, consent gate, profile, ID+selfie upload with compression, status screen, admin review queue/detail with audited signed URLs, tier assignment + expiry, audit log recording + viewer, admin dashboard | Oct 8–11 |
| M3 | Iteration 2: QR handshake (**highest risk — build early, test on real phones**) | `issue-qr`, My QR with auto-refresh, scanner, `scan-qr`, photo-first result, `confirm-meeting`, `cancel-interaction`, realtime prompt, `scan_events` logging, replay tests | Oct 12–14 |
| — | **Checkpoint Oct 14** | Product Owner confirms or cuts the remaining scope (cut order below) | Oct 14 |
| M4 | Iteration 3: ratings + reports + polish | `submit_rating` RPC + anti-abuse, blind reveal, summary view, reports + admin queue + actions, purge function + scheduled call, offline banner, accessibility pass, motion polish | Oct 15–16 |
| M5 | Test + freeze | Full unit/policy/e2e suite, low-end Android checklist, ID access dry run, fix bugs, README | Oct 14–17 (freeze Oct 17) |
| M6 | Pilot support | Pilot accounts, onboarding, log/data export script, bug fixes only | Oct 18–21 |
| M7 | Wrap-up | Export data before Supabase pause risk, final fixes | Oct 21–24 |

**Scope-cut order if time runs out** (never cut the QR handshake or the rating gate): 1) rating flag and removal screens, 2) the daily interaction cap, 3) motion polish.

---

## 15. Pilot instrumentation and evaluation targets

The app must make these measurable from the database (provide `scripts/export-metrics.sql` or an admin-only export):

| Measure | Source | Target |
|---|---|---|
| QR scan success | `scan_events` — share of scans with outcome `ok` on first attempt | ≥ 90% |
| Confirmation completion | interactions `confirmed` / `scanned` | ≥ 80% |
| Verification turnaround | `decided_at - created_at` (median) | ≤ 24 h |
| Scan-to-profile latency | `scan_events.ms_to_profile` | ≤ 3 s |
| QR replay resistance | security test script | 100% rejected |
| Rating gating | policy tests | 0 ratings without a confirmed interaction |
| Real vs guided interactions | add `interactions.is_guided boolean default false`, admin can flag pilot pairs (**DECISION**) | reported separately |

Surveys (SUS, TAM, confidence before/after, ISO 25010 checklist) are external (Google Forms) — not part of the app.

---

## 16. Definition of done (every PR)

- [ ] Matches Section 13 acceptance criteria for its feature IDs
- [ ] Types pass (`pnpm typecheck`), lint passes, unit + policy tests pass
- [ ] New table/column ⇒ migration + RLS + policy test
- [ ] No secrets, no ID numbers, no PII in logs
- [ ] Works at 360 px width; scan/confirm screens meet accessibility rules
- [ ] `docs/DECISIONS.md` updated for any **DECISION** taken

---

## 17. Open items (do not guess silently — ask the owner)

1. Pilot community name and the named **data protection contact** (shown on the consent screen).
2. Final wording of terms of use / community guidelines (adviser review).
3. Real admin accounts (≥ 2 named administrators) and who owns the Supabase and Vercel accounts (planned under the Project Manager).
4. Whether NPC registration applies at pilot scale (paper says to confirm with the adviser).
5. Branding: app name/logo/colors (use a neutral blue theme until provided).

---

## 18. UI reference

A clickable design prototype of all 13 screens (rider + admin flows) was built and approved before implementation began. It covers: Login/Register, Consent, Verify (submit + status), Home, My QR, Scanned Profile, Rate, Interactions list, Profile, Report, and the three admin surfaces (Verification Review, Reports, Audit Log). Match spacing, color tokens, copy tone, and the photo-first layout rule from that prototype when building each screen. Palette: Ink `#0F172A`, Slate `#475569`, Mist `#E2E8F0`, Paper `#FFFFFF`, Blue `#2563EB`/`#1D4ED8`, Green (verified) `#16A34A`, Amber (pending) `#D97706`, Red (reject/report) `#DC2626`. Font: Inter.
