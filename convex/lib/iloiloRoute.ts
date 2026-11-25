// A fixed, hardcoded line roughly following the real Jaro -> La Paz ->
// City Proper corridor, used only to animate a marker for the demo
// "simulate GPS tracking" buttons (SPEC.md stays out of real routing —
// see docs/DECISIONS.md, 2026-11-23). Not fetched from any routing API,
// not tied to a request's actual note/destination — every simulated ride
// moves along this same path.
//
// 2026-11-25: the original version detoured west to Mandurriao and back,
// which made the line double back on itself and cross its own path on
// screen — looked obviously fake ("the routing circled"). Replaced with a
// single coherent line: longitude and latitude both move in one direction
// only (east and south respectively) from one point to the next, so it
// can never visually cross or loop.
export const ILOILO_DEMO_ROUTE: [number, number][] = [
  [122.5644, 10.7297], // Jaro Plaza
  [122.5649, 10.7230], // Lopez Jaena St, Jaro
  [122.5656, 10.7170],
  [122.5663, 10.7110], // La Paz
  [122.5671, 10.705], // Jalandoni St
  [122.5686, 10.699], // Diversion Rd
  [122.5704, 10.6975],
  [122.5721, 10.6968], // Iloilo City Proper / Esplanade
]

// Turn-by-turn instructions for the Grab/Waze-style navigation screen
// (2026-11-25). `atIndex` is the ILOILO_DEMO_ROUTE vertex each step starts
// at — fixed text matched to a fixed route, same as the route itself: not
// generated from any real routing/directions API.
export const ILOILO_DEMO_STEPS: { atIndex: number; instruction: string; distanceM: number }[] = [
  { atIndex: 0, instruction: 'Head south from Jaro Plaza onto Lopez Jaena Street', distanceM: 650 },
  { atIndex: 2, instruction: 'Continue straight through Jaro toward La Paz', distanceM: 600 },
  { atIndex: 3, instruction: 'Keep straight through La Paz', distanceM: 560 },
  { atIndex: 4, instruction: 'Continue onto Jalandoni Street', distanceM: 520 },
  { atIndex: 5, instruction: 'Merge onto Diversion Road', distanceM: 480 },
  { atIndex: 7, instruction: 'Arrive at Iloilo City Proper / Esplanade', distanceM: 0 },
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
