/** Routing skeleton stand-in until the milestone that builds this screen lands (see docs/SPEC.md §14). */
export function PlaceholderScreen({ title, milestone }: { title: string; milestone: string }) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-2 p-6 text-center">
      <div className="text-lg font-bold text-ink">{title}</div>
      <div className="text-sm text-slate">Ships in {milestone} — see docs/SPEC.md §14.</div>
    </div>
  )
}
