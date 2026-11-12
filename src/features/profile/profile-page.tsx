import { useState } from 'react'
import { useAuthActions } from '@convex-dev/auth/react'
import { useMutation, useQuery } from 'convex/react'
import { useNavigate } from 'react-router-dom'
import { api } from '../../../convex/_generated/api'
import { cn } from '@/lib/utils'

export function ProfilePage() {
  const me = useQuery(api.profiles.getMe)
  const updateProfile = useMutation(api.profiles.updateProfile)
  const deleteMyAccount = useMutation(api.profiles.deleteMyAccount)
  const { signOut } = useAuthActions()
  const navigate = useNavigate()

  const [editing, setEditing] = useState(false)
  const [displayName, setDisplayName] = useState('')
  const [phone, setPhone] = useState('')
  const [rideRole, setRideRole] = useState<'driver' | 'passenger'>('driver')
  const [confirmingDelete, setConfirmingDelete] = useState(false)
  const [busy, setBusy] = useState(false)

  if (me === undefined) return null
  if (me === null) return null

  function startEdit() {
    setDisplayName(me!.displayName)
    setPhone(me!.phone ?? '')
    setRideRole(me!.rideRole)
    setEditing(true)
  }

  async function save() {
    setBusy(true)
    try {
      await updateProfile({ displayName, phone: phone || undefined, rideRole })
      setEditing(false)
    } finally {
      setBusy(false)
    }
  }

  async function handleDelete() {
    setBusy(true)
    try {
      await deleteMyAccount({})
      await signOut()
      navigate('/')
    } finally {
      setBusy(false)
    }
  }

  if (confirmingDelete) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-4 bg-page px-7 text-center">
        <div className="neu-out flex h-16 w-16 items-center justify-center rounded-full">
          <svg width="26" height="26" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path
              d="M5 7h14M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2m-9 0l1 12a2 2 0 0 0 2 2h4a2 2 0 0 0 2-2l1-12"
              stroke="#DC2626"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>
        <div className="text-[17px] font-bold text-ink">Delete your account?</div>
        <p className="max-w-[280px] text-[13px] text-slate">
          Your profile and ID documents are removed. Past ratings stay as anonymous numbers so other
          users&apos; scores remain accurate.
        </p>
        <div className="mt-2 flex w-full max-w-[280px] gap-2">
          <button
            onClick={() => setConfirmingDelete(false)}
            className="neu-out flex-1 rounded-xl py-3 text-[13.5px] font-bold text-ink"
          >
            Keep account
          </button>
          <button
            onClick={handleDelete}
            disabled={busy}
            className="flex-1 rounded-xl bg-danger py-3 text-[13.5px] font-bold text-white disabled:opacity-40"
          >
            Delete
          </button>
        </div>
      </div>
    )
  }

  if (editing) {
    return (
      <div className="flex flex-1 flex-col gap-4 bg-page px-6 py-6">
        <div className="text-[18px] font-extrabold text-ink">Edit profile</div>
        <Field label="Display name">
          <input
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            className="neu-in h-11 rounded-xl px-3 text-[14px] text-ink outline-none"
          />
        </Field>
        <Field label="Phone">
          <input
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className="neu-in h-11 rounded-xl px-3 text-[14px] text-ink outline-none"
          />
        </Field>
        <Field label="I usually ride as">
          <div className="flex gap-2">
            <button
              onClick={() => setRideRole('driver')}
              className={cn(
                'flex-1 rounded-xl border-2 py-2.5 text-sm font-bold transition-colors',
                rideRole === 'driver' ? 'border-brand bg-blue-50 text-brand-dark' : 'border-transparent neu-out-sm text-slate',
              )}
            >
              Driver
            </button>
            <button
              onClick={() => setRideRole('passenger')}
              className={cn(
                'flex-1 rounded-xl border-2 py-2.5 text-sm font-bold transition-colors',
                rideRole === 'passenger' ? 'border-brand bg-blue-50 text-brand-dark' : 'border-transparent neu-out-sm text-slate',
              )}
            >
              Passenger
            </button>
          </div>
        </Field>
        <div className="mt-2 flex gap-2">
          <button onClick={() => setEditing(false)} className="neu-out flex-1 rounded-xl py-3 text-[14px] font-bold text-ink">
            Cancel
          </button>
          <button
            onClick={save}
            disabled={busy}
            className="flex-1 rounded-xl bg-brand py-3 text-[14px] font-bold text-white disabled:opacity-40"
          >
            Save
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-1 flex-col gap-5 bg-page px-6 py-6">
      <div className="flex items-center gap-3">
        <div className="neu-out flex h-16 w-16 items-center justify-center rounded-full text-[17px] font-bold text-ink">
          {me.displayName
            .split(' ')
            .map((p) => p[0])
            .slice(0, 2)
            .join('')
            .toUpperCase()}
        </div>
        <div>
          <div className="text-[17px] font-extrabold text-ink">{me.displayName}</div>
          <div className="text-[12.5px] capitalize text-slate">{me.rideRole}</div>
        </div>
      </div>

      <div className="neu-out flex flex-col rounded-2xl">
        <Row label="Display name" value={me.displayName} />
        <Row label="Phone" value={me.phone ?? '—'} />
        <Row
          label="Tier"
          value={
            me.verified
              ? `ID-verified · until ${new Date(me.tierExpiresAt!).toLocaleDateString()}`
              : 'Unverified'
          }
          last
        />
      </div>

      <button onClick={startEdit} className="neu-out rounded-xl py-3 text-[14px] font-bold text-ink">
        Edit profile
      </button>

      <div className="mt-auto flex flex-col gap-2 pb-4">
        <button onClick={() => signOut()} className="neu-out rounded-xl py-3 text-[14px] font-bold text-slate">
          Log out
        </button>
        <button
          onClick={() => setConfirmingDelete(true)}
          className="neu-out rounded-xl py-3 text-[14px] font-bold text-danger"
        >
          Delete my account
        </button>
      </div>
    </div>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5">
      <span className="text-[13px] font-semibold text-[#334155]">{label}</span>
      {children}
    </div>
  )
}

function Row({ label, value, last }: { label: string; value: string; last?: boolean }) {
  return (
    <div className={cn('flex items-center justify-between px-4 py-3.5', !last && 'border-b border-white/60')}>
      <span className="text-[12px] text-slate">{label}</span>
      <span className="text-[13.5px] font-semibold text-ink">{value}</span>
    </div>
  )
}
