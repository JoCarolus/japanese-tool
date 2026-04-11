'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase'

type Props = {
  email: string
  userId: string
  onSignOut: () => void
}

export default function UserMenu({ email, userId, onSignOut }: Props) {
  const [open, setOpen] = useState(false)
  const [pinMode, setPinMode] = useState<'idle' | 'set' | 'sent'>('idle')
  const [pin, setPin] = useState('')
  const [confirm, setConfirm] = useState('')
  const [pinError, setPinError] = useState('')
  const [saving, setSaving] = useState(false)
  const [resetEmail, setResetEmail] = useState(email)

  const displayEmail = email.split('@')[0]

  async function handleSignOut() {
    localStorage.removeItem('pin_user_id')
    await supabase.auth.signOut()
    onSignOut()
    setOpen(false)
  }

  async function handleSetPin() {
    if (pin.length !== 4 || !/^\d{4}$/.test(pin)) {
      setPinError('PIN must be exactly 4 digits')
      return
    }
    if (pin !== confirm) {
      setPinError('PINs do not match')
      return
    }
    setSaving(true)
    setPinError('')
    const res = await fetch('/api/pin', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'set', userId, pin }),
    })
    const data = await res.json()
    setSaving(false)
    if (data.success) {
      setPinMode('idle')
      setPin('')
      setConfirm('')
      alert('PIN saved! You can now use it to log in on any device.')
    } else {
      setPinError('Something went wrong. Please try again.')
    }
  }

  async function handleRequestReset() {
    setSaving(true)
    const res = await fetch('/api/pin-reset', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'request', email: resetEmail }),
    })
    setSaving(false)
    const data = await res.json()
    if (data.success) setPinMode('sent')
  }

  return (
    <div className="user-menu">
      <button className="user-menu-btn" onClick={() => setOpen(!open)} title={email}>
        <span className="user-menu-avatar">{displayEmail[0].toUpperCase()}</span>
        <span className="user-menu-name">{displayEmail}</span>
        <span className="user-menu-caret">{open ? '▲' : '▼'}</span>
      </button>

      {open && (
        <div className="user-menu-dropdown" style={{ minWidth: 260 }}>
          <div className="user-menu-email">{email}</div>

          {pinMode === 'idle' && (
            <>
              <button className="user-menu-action" onClick={() => setPinMode('set')}>
                Set up PIN login
              </button>
              <button className="user-menu-action" onClick={() => setPinMode('set')}>
                Reset PIN
              </button>
              <button className="user-menu-signout" onClick={handleSignOut}>
                Sign out
              </button>
            </>
          )}

          {pinMode === 'set' && (
            <div style={{ padding: '8px 0' }}>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: 8, padding: '0 8px' }}>
                Set a 4-digit PIN to log in on any device without email.
              </p>
              <input
                type="number"
                className="auth-input"
                style={{ margin: '0 0 8px', fontSize: '0.9rem', padding: '8px 12px' }}
                placeholder="New PIN (4 digits)"
                value={pin}
                onChange={e => setPin(e.target.value.slice(0, 4))}
              />
              <input
                type="number"
                className="auth-input"
                style={{ margin: '0 0 8px', fontSize: '0.9rem', padding: '8px 12px' }}
                placeholder="Confirm PIN"
                value={confirm}
                onChange={e => setConfirm(e.target.value.slice(0, 4))}
              />
              {pinError && <p style={{ fontSize: '0.8rem', color: 'var(--danger)', padding: '0 8px', marginBottom: 8 }}>{pinError}</p>}
              <div style={{ display: 'flex', gap: 6, padding: '0 0 4px' }}>
                <button className="btn-translate" style={{ flex: 1, padding: '8px', fontSize: '0.85rem' }} onClick={handleSetPin} disabled={saving}>
                  {saving ? '...' : 'Save PIN'}
                </button>
                <button className="btn-clear" style={{ padding: '8px 12px', fontSize: '0.85rem' }} onClick={() => { setPinMode('idle'); setPin(''); setConfirm(''); setPinError('') }}>
                  Cancel
                </button>
              </div>
            </div>
          )}

          {pinMode === 'sent' && (
            <div style={{ padding: '8px' }}>
              <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>
                PIN reset link sent to {resetEmail}. Click it to set a new PIN.
              </p>
              <button className="auth-skip" style={{ marginTop: 8 }} onClick={() => setPinMode('idle')}>Done</button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
