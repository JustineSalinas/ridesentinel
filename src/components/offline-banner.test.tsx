import { render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { OfflineBanner } from './offline-banner'

describe('OfflineBanner', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('renders nothing while online', () => {
    vi.stubGlobal('navigator', { ...navigator, onLine: true })
    render(<OfflineBanner />)
    expect(screen.queryByRole('status')).not.toBeInTheDocument()
  })

  it('warns when offline', () => {
    vi.stubGlobal('navigator', { ...navigator, onLine: false })
    render(<OfflineBanner />)
    expect(screen.getByRole('status')).toHaveTextContent(/offline/i)
  })
})
