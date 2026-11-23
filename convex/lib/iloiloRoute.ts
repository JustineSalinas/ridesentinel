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
