'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase'

type Props = {
  onSkip: () => void
}

export default function AuthScreen({ onSkip }: Props) {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit() {
    const trimmed = email.trim()
    if (!trimmed) return
    setLoading(true)
    setError('')

    const { error } = await supabase.auth.signInWithOtp({
      email: trimmed,
      options: {
        emailRedirectTo: window.location.origin,
      },
    })

    if (error) {
      setError('Something went wrong. Please try again.')
      setLoading(false)
    } else {
      setSent(true)
      setLoading(false)
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter') handleSubmit()
  }

  return (
    <div className="auth-overlay">
      <div className="auth-card">

        {/* Icon */}
        <div className="auth-icon">あ</div>

        <h1 className="auth-title">
          日本語 <span>Learn Japanese</span>
        </h1>
        <p className="auth-subtitle">
          Translate, check your writing, and practise conversations.
        </p>

        {!sent ? (
          <>
            <div className="auth-form">
              <label className="auth-label">
                Sign in to save your history across sessions
              </label>
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
                onClick={handleSubmit}
                disabled={loading || !email.trim()}
              >
                {loading ? 'Sending...' : 'Send magic link →'}
              </button>
            </div>

            <button className="auth-skip" onClick={onSkip}>
              Skip for now — use without saving history
            </button>
          </>
        ) : (
          <div className="auth-sent">
            <div className="auth-sent-icon">📧</div>
            <h2 className="auth-sent-title">Check your email</h2>
            <p className="auth-sent-text">
              We sent a magic link to <strong>{email}</strong>.
              Click it to sign in — no password needed.
            </p>
            <button className="auth-skip" onClick={onSkip}>
              Continue without signing in
            </button>
          </div>
        )}

      </div>
    </div>
  )
}

