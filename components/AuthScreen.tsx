'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'

type Props = {
  onSkip: () => void
  onPinLogin?: (userId: string, email: string) => void
}

type Mode = 'check' | 'magic' | 'pin' | 'sent'

export default function AuthScreen({ onSkip, onPinLogin }: Props) {
  const [mode, setMode] = useState<Mode>('check')
  const [email, setEmail] = useState('')
  const [pin, setPin] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [hasPins, setHasPins] = useState(false)

  useEffect(() => {
    async function check() {
      try {
        const res = await fetch('/api/pin', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'check' }),
        })
        const data = await res.json()
        setHasPins(data.hasPins)
        setMode(data.hasPins ? 'pin' : 'magic')
      } catch {
        setMode('magic')
      }
    }
    check()
  }, [])

  async function handleMagicLink() {
    const trimmed = email.trim()
    if (!trimmed) return
    setLoading(true)
    setError('')
    const { error } = await supabase.auth.signInWithOtp({
      email: trimmed,
      options: { emailRedirectTo: window.location.origin },
    })
    if (error) {
      setError('Something went wrong. Please try again.')
      setLoading(false)
    } else {
      setMode('sent')
      setLoading(false)
    }
  }

  async function handlePinLogin() {
    if (pin.length !== 4) return
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/pin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'verify', pin }),
      })
      const data = await res.json()
      if (data.success && data.userId) {
        localStorage.setItem('pin_user_id', data.userId)
        await new Promise(resolve => setTimeout(resolve, 100))
        const saved = localStorage.getItem('pin_user_id')
        if (saved === data.userId) {
  onPinLogin?.(data.userId, data.email || '')
        } else {
          setError('Could not save session. Please try again.')
          setPin('')
          setLoading(false)
        }
      } else {
        setError('Incorrect PIN. Please try again.')
        setPin('')
        setLoading(false)
      }
    } catch {
      setError('Something went wrong. Please try again.')
      setPin('')
      setLoading(false)
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter') {
      if (mode === 'magic') handleMagicLink()
      if (mode === 'pin') handlePinLogin()
    }
  }

  if (mode === 'check') {
    return (
      <div className="auth-overlay">
        <div className="auth-card">
          <div className="loading"><div className="dots"><span></span><span></span><span></span></div></div>
        </div>
      </div>
    )
  }

  return (
    <div className="auth-overlay">
      <div className="auth-card">
        <div className="auth-icon">🌐</div>
        <h1 className="auth-title">Tri<span>lingo</span></h1>
        <p className="auth-subtitle">Learn Japanese, Korean, and Chinese.</p>

        {mode === 'pin' && (
          <>
            <div className="auth-form">
              <label className="auth-label">Enter your PIN</label>
              <div className="pin-input-row">
                {[0, 1, 2, 3].map(i => (
                  <input
                    key={i}
                    type="number"
                    className="pin-digit"
                    value={pin[i] || ''}
                    readOnly
                    placeholder="·"
                  />
                ))}
              </div>
              <div className="pin-keypad">
                {[1,2,3,4,5,6,7,8,9,'',0,'⌫'].map((k, i) => (
                  <button
                    key={i}
                    className={`pin-key ${k === '' ? 'pin-key-empty' : ''}`}
                    onClick={() => {
                      if (k === '⌫') setPin(p => p.slice(0, -1))
                      else if (k !== '' && pin.length < 4) setPin(p => p + k)
                    }}
                    disabled={loading}
                  >
                    {k}
                  </button>
                ))}
              </div>
              {error && <div className="auth-error">{error}</div>}
              <button
                className="btn-translate auth-btn"
                onClick={handlePinLogin}
                disabled={loading || pin.length !== 4}
              >
                {loading ? 'Checking...' : 'Sign in with PIN →'}
              </button>
            </div>
            <button className="auth-skip" onClick={() => setMode('magic')}>
              Sign in with email instead
            </button>
            <button className="auth-skip" onClick={onSkip}>
              Skip for now
            </button>
          </>
        )}

        {mode === 'magic' && (
          <>
            <div className="auth-form">
              <label className="auth-label">Sign in to save your history across devices</label>
              <input
                type="email"
                className="auth-input"
                placeholder="your@email.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
                onKeyDown={handleKeyDown}
                autoFocus
              />
              {error && <div className="auth-error">{error}</div>}
              <button
                className="btn-translate auth-btn"
                onClick={handleMagicLink}
                disabled={loading || !email.trim()}
              >
                {loading ? 'Sending...' : 'Send magic link →'}
              </button>
            </div>
            {hasPins && (
              <button className="auth-skip" onClick={() => setMode('pin')}>
                Sign in with PIN instead
              </button>
            )}
            <button className="auth-skip" onClick={onSkip}>
              Skip for now — use without saving history
            </button>
          </>
        )}

        {mode === 'sent' && (
          <div className="auth-sent">
            <div className="auth-sent-icon">📧</div>
            <h2 className="auth-sent-title">Check your email</h2>
            <p className="auth-sent-text">
              We sent a magic link to <strong>{email}</strong>. Click it on this device to sign in.
            </p>
            <p className="auth-sent-text" style={{ marginTop: 8, fontSize: '0.82rem' }}>
              After signing in, go to Settings to set up a PIN for easy login on any device.
            </p>
            <button className="auth-skip" onClick={onSkip} style={{ marginTop: 16 }}>
              Continue without signing in
            </button>
          </div>
        )}
      </div>
    </div>
  )
}