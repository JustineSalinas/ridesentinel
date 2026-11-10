import { useState } from 'react'
import { useAuthActions } from '@convex-dev/auth/react'
import { useMutation, useQuery } from 'convex/react'
import { useNavigate } from 'react-router-dom'
import { api } from '../../../convex/_generated/api'

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
    setDisplayName(me.displayName)
    setPhone(me.phone ?? '')
    setRideRole(me.rideRole)
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
      <div className="flex flex-1 flex-col items-center justify-center gap-4 px-7 text-center">
        <div className="text-[17px] font-bold">Delete your account?</div>
        <p className="max-w-[280px] text-[13px] text-slate">
          Your profile and ID documents are removed. Past ratings stay as anonymous numbers so other
          users&apos; scores remain accurate.
        </p>
        <div className="mt-2 flex w-full max-w-[280px] gap-2">
          <button
            onClick={() => setConfirmingDelete(false)}
            className="flex-1 rounded-full border border-mist bg-paper py-3 text-[13.5px] font-bold"
          >
            Keep account
          </button>
          <button
            onClick={handleDelete}
            disabled={busy}
            className="flex-1 rounded-full bg-danger py-3 text-[13.5px] font-bold text-white disabled:opacity-40"
          >
            Delete
          </button>
        </div>
      </div>
    )
  }

  if (editing) {
    return (
      <div className="flex flex-1 flex-col gap-4 px-6 py-6">
        <div className="text-[18px] font-extrabold">Edit profile</div>
        <Field label="Display name">
          <input
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            className="h-11 rounded-lg border border-mist bg-paper px-3 text-[14px]"
          />
        </Field>
        <Field label="Phone">
          <input
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className="h-11 rounded-lg border border-mist bg-paper px-3 text-[14px]"
          />
        </Field>
        <Field label="I usually ride as">
          <div className="flex gap-2">
            <button
              onClick={() => setRideRole('driver')}
              className={
                'flex-1 rounded-full py-2.5 text-sm font-bold ' +
                (rideRole === 'driver' ? 'bg-ink text-white' : 'bg-mist text-slate')
              }
            >
              Driver
            </button>
            <button
              onClick={() => setRideRole('passenger')}
              className={
                'flex-1 rounded-full py-2.5 text-sm font-bold ' +
                (rideRole === 'passenger' ? 'bg-ink text-white' : 'bg-mist text-slate')
              }
            >
              Passenger
            </button>
          </div>
        </Field>
        <div className="mt-2 flex gap-2">
          <button onClick={() => setEditing(false)} className="flex-1 rounded-full border border-mist bg-paper py-3 text-[14px] font-bold">
            Cancel
          </button>
          <button
            onClick={save}
            disabled={busy}
            className="flex-1 rounded-full bg-brand py-3 text-[14px] font-bold text-white disabled:opacity-40"
          >
            Save
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-1 flex-col gap-5 px-6 py-6">
      <div className="flex items-center gap-3">
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-ink text-[16px] font-bold text-white">
          {me.displayName
            .split(' ')
            .map((p) => p[0])
            .slice(0, 2)
            .join('')
            .toUpperCase()}
        </div>
        <div>
          <div className="text-[17px] font-extrabold">{me.displayName}</div>
          <div className="text-[12.5px] capitalize text-slate">{me.rideRole}</div>
        </div>
      </div>

      <div className="rounded-xl border border-mist bg-paper">
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

      <button onClick={startEdit} className="rounded-full border border-mist bg-paper py-3 text-[14px] font-bold">
        Edit profile
      </button>

      <div className="mt-auto flex flex-col gap-2 pb-4">
        <button
          onClick={() => signOut()}
          className="rounded-full border border-mist bg-paper py-3 text-[14px] font-bold text-slate"
        >
          Log out
        </button>
        <button
          onClick={() => setConfirmingDelete(true)}
          className="rounded-full border border-danger bg-paper py-3 text-[14px] font-bold text-danger"
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
      <span className="font-mono text-[10.5px] font-bold uppercase tracking-widest text-slate-400">{label}</span>
      {children}
    </div>
  )
}

function Row({ label, value, last }: { label: string; value: string; last?: boolean }) {
  return (
    <div className={'flex items-center justify-between px-4 py-3' + (last ? '' : ' border-b border-mist')}>
      <span className="text-[12px] text-slate">{label}</span>
      <span className="text-[13.5px] font-semibold">{value}</span>
    </div>
  )
}
