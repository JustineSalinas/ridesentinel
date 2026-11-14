/** Minimal monochrome platform glyphs — no icon library needed for just two marks. */

export function AppleGlyph({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 16 16" fill="currentColor" className={className} aria-hidden="true">
      <path d="M11.2 2.3c-.6.7-1.5 1.2-2.4 1.1-.1-.9.3-1.9.9-2.5.6-.7 1.6-1.2 2.4-1.2.1 1-.3 1.9-.9 2.6zM13.6 11.5c-.3.7-.5 1-.9 1.6-.5.8-1.2 1.9-2.2 1.9-.8 0-1-.5-2.1-.5s-1.4.5-2.2.5c-.9 0-1.6-1-2.1-1.8-1.5-2.2-1.7-4.8-.7-6.2.7-1 1.8-1.6 2.9-1.6 1 0 1.7.6 2.5.6.8 0 1.3-.6 2.5-.6.8 0 1.8.5 2.4 1.3-2.1 1.2-1.8 4.2.9 4.8z" />
    </svg>
  )
}

export function AndroidGlyph({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 16 16" fill="currentColor" className={className} aria-hidden="true">
      <path d="M4.7 1.9l.8 1.3c-1.8.9-3 2.6-3.1 4.6h11.2c-.1-2-1.3-3.7-3.1-4.6l.8-1.3-.5-.3-.9 1.4C9.2 2.7 8.6 2.6 8 2.6s-1.2.1-1.9.4L5.2 1.6l-.5.3zM6 5.6c-.3 0-.5-.2-.5-.5s.2-.5.5-.5.5.2.5.5-.2.5-.5.5zm4 0c-.3 0-.5-.2-.5-.5s.2-.5.5-.5.5.2.5.5-.2.5-.5.5zM1.8 8.9c-.6 0-1 .4-1 1v3.4c0 .6.4 1 1 1s1-.4 1-1V9.9c0-.6-.4-1-1-1zm12.4 0c-.6 0-1 .4-1 1v3.4c0 .6.4 1 1 1s1-.4 1-1V9.9c0-.6-.4-1-1-1zM3.2 8.6v5.7c0 .5.4.9.9.9h.6v2c0 .6.4 1 1 1s1-.4 1-1v-2h1.6v2c0 .6.4 1 1 1s1-.4 1-1v-2h.6c.5 0 .9-.4.9-.9V8.6H3.2z" />
    </svg>
  )
}
