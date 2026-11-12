// Terms of use + community guidelines for the pilot (SPEC.md §10, §17).
// Ratified as the pilot v1 wording — see docs/DECISIONS.md 2026-11-12. A
// lawyer/adviser pass before any post-pilot public launch is still worth
// doing, but this is not blocked on one for the pilot itself.

export const PILOT_COMMUNITY_NAME = 'RideSentinel Pilot Community — Jaro / La Paz / Mandurriao'
export const DATA_PROTECTION_CONTACT = 'privacy@ridesentinel.app'

export const TERMS_OF_USE = `
RideSentinel — Terms of Use (Pilot v1 — Iloilo City)

1. What this is. RideSentinel helps two people who have already arranged a
   motorcycle ride elsewhere confirm who they're meeting before it starts.

2. What this isn't. RideSentinel does not arrange, match, book, price,
   operate, or endorse rides. We are not a transportation provider. Riders
   remain responsible for arranging their own rides, agreeing on terms, and
   using their own judgment about who to ride with.

3. Verification is not a safety guarantee. "ID-verified" means a named
   administrator reviewed a government or school ID and a selfie and judged
   them to plausibly match. It is a human check, not a background check,
   and it does not certify that a person is trustworthy, safe to ride with,
   or who they claim beyond that single document check.

4. Your conduct is your responsibility. You agree to show up as the person
   on your verified profile, to use the app's QR confirmation honestly, and
   not to lend your account to anyone else.

5. Ratings and reports. Ratings may only be given after both parties
   confirm a meeting in person. Submitting a rating or report you know to
   be false, or pressuring someone into giving or changing a rating, is
   grounds for suspension or losing your verified badge.

6. Data. See the consent screen for what we collect, who sees it, and how
   long we keep it. In short: your name, an ID photo, and a selfie — never
   an ID number, never your location.

7. Account action. An administrator may warn, suspend, or revoke your
   verified tier for violations of these terms, with a reason recorded in
   our audit log.

8. Contact. Questions about your data go to ${DATA_PROTECTION_CONTACT}.
`.trim()

export const COMMUNITY_GUIDELINES = `
RideSentinel — Community Guidelines (pilot draft)

- Show up as yourself. The photo on your profile should be you, now.
- Confirm honestly. Only tap "this is the person" if it actually is.
- Rate what happened. A rating reflects the specific meeting, not a grudge
  from somewhere else.
- Report, don't retaliate. If something felt wrong, use the report flow —
  an administrator will look at it.
- No harassment, threats, or coercion — toward a rider or toward getting a
  particular rating.
`.trim()
