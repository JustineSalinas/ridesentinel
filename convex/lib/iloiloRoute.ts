// A fixed, hardcoded line through real Iloilo City districts (Jaro ->
// Mandurriao -> City Proper), used only to animate a marker for the demo
// "simulate GPS tracking" buttons (SPEC.md stays out of real routing —
// see docs/DECISIONS.md, 2026-11-23). Not fetched from any routing API,
// not tied to a request's actual note/destination — every simulated ride
// moves along this same path.
export const ILOILO_DEMO_ROUTE: [number, number][] = [
  [122.5644, 10.7272], // Jaro Plaza
  [122.5658, 10.7211],
  [122.5679, 10.7149],
  [122.5661, 10.7101], // Iloilo Doctors' / Jalandoni St area
  [122.5636, 10.7057],
  [122.5612, 10.7021], // Mandurriao approach
  [122.5588, 10.6995], // Mandurriao
  [122.5571, 10.7034],
  [122.5583, 10.7079],
  [122.5612, 10.7118],
  [122.5634, 10.7088], // SM City Iloilo area
  [122.5651, 10.7046],
  [122.5665, 10.7006], // Diversion Rd towards City Proper
  [122.5693, 10.6978],
  [122.5721, 10.6968], // Iloilo City Proper / Esplanade
]

// Turn-by-turn instructions for the Grab/Waze-style navigation screen
// (2026-11-25). `atIndex` is the ILOILO_DEMO_ROUTE vertex each step starts
// at — fixed text matched to a fixed route, same as the route itself: not
// generated from any real routing/directions API.
export const ILOILO_DEMO_STEPS: { atIndex: number; instruction: string; distanceM: number }[] = [
  { atIndex: 0, instruction: 'Head south from Jaro Plaza', distanceM: 700 },
  { atIndex: 2, instruction: 'Continue onto Jalandoni Street', distanceM: 550 },
  { atIndex: 4, instruction: 'Keep straight toward Mandurriao', distanceM: 480 },
  { atIndex: 6, instruction: "You're passing through Mandurriao", distanceM: 430 },
  { atIndex: 8, instruction: 'Turn left toward SM City Iloilo', distanceM: 470 },
  { atIndex: 10, instruction: 'Continue past SM City Iloilo', distanceM: 460 },
  { atIndex: 12, instruction: 'Merge onto Diversion Road', distanceM: 420 },
  { atIndex: 14, instruction: 'Arrive at Iloilo City Proper / Esplanade', distanceM: 0 },
]

/** Which step a route-progress fraction (0–1) currently sits in. */
export function stepIndexForProgress(progress: number): number {
  const clamped = Math.min(1, Math.max(0, progress))
  const vertexIndex = clamped * (ILOILO_DEMO_ROUTE.length - 1)
  let current = 0
  for (let i = 0; i < ILOILO_DEMO_STEPS.length; i += 1) {
    if (ILOILO_DEMO_STEPS[i].atIndex <= vertexIndex) current = i
  }
  return current
}
