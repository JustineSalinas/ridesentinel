import { test, expect, type Page } from '@playwright/test'
import { execFileSync } from 'node:child_process'
import { writeFileSync, unlinkSync } from 'node:fs'
import { join } from 'node:path'
import { createRequire } from 'node:module'
import zlib from 'node:zlib'

const require = createRequire(import.meta.url)

// SPEC.md §12: "register + admin approves both -> A opens My QR -> B scans
// (inject token, or use a fake camera) -> B taps 'This is the person' -> A
// confirms -> both rate -> ratings revealed; plus the mismatch/cancel path;
// plus offline banner." This file covers the confirm+rate path end to end,
// across three real browser contexts (admin, rider A, rider B).
//
// "Scan" here uses the inject-token path, not a real camera: ScanPage reads
// a decoded QR string and calls qr.scanQr with it — html5-qrcode's camera
// decoding isn't something Playwright can drive without a prerecorded video
// feed, so this calls the same mutation directly via the dev-only
// window.__convex bridge (src/lib/convexClient.ts), which is exactly what
// a real scan would send.

function makeTestPng(path: string, r: number, g: number, b: number) {
  function crc32(buf: Buffer) {
    let c
    let crc = 0xffffffff
    for (let i = 0; i < buf.length; i++) {
      c = (crc ^ buf[i]) & 0xff
      for (let j = 0; j < 8; j++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1
      crc = (crc >>> 8) ^ c
    }
    return (crc ^ 0xffffffff) >>> 0
  }
  function chunk(type: string, data: Buffer) {
    const len = Buffer.alloc(4)
    len.writeUInt32BE(data.length)
    const t = Buffer.from(type, 'ascii')
    const crc = Buffer.alloc(4)
    crc.writeUInt32BE(crc32(Buffer.concat([t, data])))
    return Buffer.concat([len, t, data, crc])
  }
  const sig = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])
  const size = 40
  const ihdr = Buffer.alloc(13)
  ihdr.writeUInt32BE(size, 0)
  ihdr.writeUInt32BE(size, 4)
  ihdr[8] = 8
  ihdr[9] = 2
  const row = Buffer.alloc(1 + size * 3)
  for (let x = 0; x < size; x++) {
    row[1 + x * 3] = r
    row[1 + x * 3 + 1] = g
    row[1 + x * 3 + 2] = b
  }
  const raw = Buffer.concat(Array.from({ length: size }, () => row))
  const idat = zlib.deflateSync(raw)
  writeFileSync(
    path,
    Buffer.concat([sig, chunk('IHDR', ihdr), chunk('IDAT', idat), chunk('IEND', Buffer.alloc(0))]),
  )
}

async function registerUser(page: Page, name: string, email: string) {
  await page.goto('/register')
  await page.getByPlaceholder('e.g. Marco D.').fill(name)
  await page.getByPlaceholder('you@example.com').fill(email)
  await page.getByPlaceholder('At least 8 characters').fill('testpassword123')
  await page.getByRole('checkbox').check()
  await page.getByRole('button', { name: 'Create account' }).click()
  await expect(page).toHaveURL(/\/consent/, { timeout: 15_000 })
}

async function submitVerification(page: Page, idPath: string, selfiePath: string) {
  await page.goto('/consent')
  await page.getByRole('button', { name: /I agree/ }).click()
  await expect(page).toHaveURL(/\/verify/, { timeout: 10_000 })
  await page.locator('#id-photo-input').setInputFiles(idPath)
  await page.locator('#selfie-input').setInputFiles(selfiePath)
  await page.getByRole('button', { name: 'Submit for review' }).click()
  await expect(page.getByText('Pending review')).toBeVisible({ timeout: 15_000 })
}

async function approveOldestPending(adminPage: Page) {
  await adminPage.goto('/admin/verifications')
  const checkbox = adminPage.getByRole('checkbox')
  await expect(checkbox).toBeVisible({ timeout: 10_000 })
  await checkbox.check()
  await adminPage.getByRole('button', { name: /Approve/ }).click()
}

test('two riders confirm a meeting and rate each other, replay is rejected', async ({ browser }) => {
  test.setTimeout(120_000)
  const stamp = Date.now()
  const idPng = join(process.cwd(), 'e2e', `.tmp-id-${stamp}.png`)
  const selfiePng = join(process.cwd(), 'e2e', `.tmp-selfie-${stamp}.png`)
  makeTestPng(idPng, 180, 60, 60)
  makeTestPng(selfiePng, 60, 160, 60)

  const adminCtx = await browser.newContext()
  const aCtx = await browser.newContext()
  const bCtx = await browser.newContext()
  const admin = await adminCtx.newPage()
  const a = await aCtx.newPage()
  const b = await bCtx.newPage()

  try {
    const adminName = `E2E Admin ${stamp}`
    await registerUser(admin, adminName, `e2e-admin-${stamp}@example.com`)
    await registerUser(a, `Rider A ${stamp}`, `e2e-a-${stamp}@example.com`)
    await registerUser(b, `Rider B ${stamp}`, `e2e-b-${stamp}@example.com`)

    // Invoke the Convex CLI's JS entry directly with `node`, bypassing
    // `npx`/`npx.cmd` entirely — avoids Windows .cmd-shim argv mangling
    // (cmd.exe's own quoting rules stripped our JSON arg's quotes when
    // this went through `shell: true` + npx.cmd instead).
    const convexPkg = require.resolve('convex/package.json')
    const convexBin = join(convexPkg, '..', require('convex/package.json').bin.convex)
    execFileSync(
      process.execPath,
      [convexBin, 'run', 'admin:makeAdmin', JSON.stringify({ displayName: adminName })],
      { cwd: process.cwd(), stdio: 'pipe' },
    )

    await submitVerification(a, idPng, selfiePng)
    await submitVerification(b, idPng, selfiePng)

    await approveOldestPending(admin) // A
    await approveOldestPending(admin) // B

    // A opens My QR and issues a token
    await a.goto('/qr')
    // className="hidden" (display:none) on purpose — real users never see
    // this, so assert presence in the DOM, not visibility.
    const nonceLocator = a.getByTestId('qr-nonce')
    await expect(nonceLocator).toBeAttached({ timeout: 10_000 })
    const nonce = await nonceLocator.textContent()
    expect(nonce).toBeTruthy()

    // B "scans" — inject-token path (SPEC.md §12), calls the real mutation
    await b.goto('/home')
    const scanResult = await b.evaluate(async (n: string) => {
      const w = window as unknown as { __convex: { mutation: (ref: unknown, args: unknown) => Promise<unknown> }; __convexApi: { qr: { scanQr: unknown } } }
      return await w.__convex.mutation(w.__convexApi.qr.scanQr, { nonce: n })
    }, nonce!)
    const interactionId = (scanResult as { interactionId: string }).interactionId
    expect(interactionId).toBeTruthy()

    // Replay: the same nonce must be rejected now that it's used
    await expect(
      b.evaluate(async (n: string) => {
        const w = window as unknown as { __convex: { mutation: (ref: unknown, args: unknown) => Promise<unknown> }; __convexApi: { qr: { scanQr: unknown } } }
        return await w.__convex.mutation(w.__convexApi.qr.scanQr, { nonce: n })
      }, nonce!),
    ).rejects.toThrow()

    // B confirms on the scanned-profile screen
    await b.goto(`/scan/result/${interactionId}`)
    await b.getByRole('button', { name: 'This is the person' }).click()

    // A sees the "someone scanned you" modal and confirms (A cannot confirm before B — SPEC.md §6.3)
    await a.reload()
    await expect(a.getByText('Someone scanned your QR')).toBeVisible({ timeout: 10_000 })
    await a.getByRole('button', { name: 'Confirm' }).click()

    // B sees the meeting confirmed and rates
    await b.goto(`/scan/result/${interactionId}`)
    await expect(b.getByText('CONFIRMED')).toBeVisible({ timeout: 10_000 })
    await b.getByRole('link', { name: 'Rate now' }).click()
    await b.getByLabel('5 stars').click()
    await b.getByRole('button', { name: 'Submit rating' }).click()
    await expect(b.getByText('Rating recorded')).toBeVisible({ timeout: 10_000 })

    // A rates too — only once both have rated does either see a real score
    await a.goto(`/rate/${interactionId}`)
    await a.getByLabel('4 stars').click()
    await a.getByRole('button', { name: 'Submit rating' }).click()
    await expect(a.getByText('Rating recorded')).toBeVisible({ timeout: 10_000 })
  } finally {
    await adminCtx.close()
    await aCtx.close()
    await bCtx.close()
    try {
      unlinkSync(idPng)
      unlinkSync(selfiePng)
    } catch {
      // best-effort cleanup
    }
  }
})
