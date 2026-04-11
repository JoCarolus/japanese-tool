﻿'use client'

import { useState, useEffect } from 'react'
import { supabase, Translation, TranslationResult } from '@/lib/supabase'
import { HELLO_MOCK } from '@/lib/mockData'
import TranslateInput from '@/components/TranslateInput'
import ResultCard from '@/components/ResultCard'
import CheckResultCard from '@/components/CheckResultCard'
import HistoryList from '@/components/HistoryList'
import TutorialTour from '@/components/TutorialTour'
import ConversationMode from '@/components/ConversationMode'
import AuthScreen from '@/components/AuthScreen'
import UserMenu from '@/components/UserMenu'

const TOUR_KEY = 'japanese-tool-tour-done'
const SKIP_AUTH_KEY = 'japanese-tool-skip-auth'

type Mode = 'en-to-jp' | 'jp-to-en' | 'check' | 'converse'

export default function Home() {
  const [input, setInput] = useState('')
  const [intended, setIntended] = useState('')
  const [mode, setMode] = useState<Mode>('en-to-jp')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<TranslationResult | null>(null)
  const [checkResult, setCheckResult] = useState<any | null>(null)
  const [error, setError] = useState('')
  const [history, setHistory] = useState<Translation[]>([])
  const [showTour, setShowTour] = useState(false)
  const [isMockResult, setIsMockResult] = useState(false)

  // Auth state
  const [authUser, setAuthUser] = useState<any | null>(null)
  const [authChecked, setAuthChecked] = useState(false)
  const [showAuth, setShowAuth] = useState(false)

  // Check auth on mount
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setAuthUser(session?.user ?? null)
      setAuthChecked(true)

      if (!session?.user) {
        const skipped = localStorage.getItem(SKIP_AUTH_KEY)
        if (!skipped) setShowAuth(true)
      }
    })

    // Listen for auth changes (magic link click)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setAuthUser(session?.user ?? null)
        if (session?.user) {
          setShowAuth(false)
          loadHistory(session.user.id)
        }
      }
    )

    return () => subscription.unsubscribe()
  }, [])

  // Load history and tour after auth check
  useEffect(() => {
    if (!authChecked) return

    if (authUser) loadHistory(authUser.id)

    const tourDone = localStorage.getItem(TOUR_KEY)
    if (!tourDone) {
      setTimeout(() => {
        setInput('Hello')
        setResult(HELLO_MOCK)
        setIsMockResult(true)
        setShowTour(true)
      }, 600)
    }
  }, [authChecked, authUser])

  function handleSkipAuth() {
    localStorage.setItem(SKIP_AUTH_KEY, 'true')
    setShowAuth(false)
  }

  function handleSignOut() {
    setAuthUser(null)
    setHistory([])
  }

  function handleTourComplete() {
    setShowTour(false)
    localStorage.setItem(TOUR_KEY, 'true')
    setInput('')
    setResult(null)
    setIsMockResult(false)
  }

  function handleModeChange(newMode: Mode) {
    setMode(newMode)
    setInput('')
    setIntended('')
    setResult(null)
    setCheckResult(null)
    setError('')
    setIsMockResult(false)
  }

  async function loadHistory(userId: string) {
    const { data, error } = await supabase
      .from('translations')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(20)
    if (!error && data) setHistory(data as Translation[])
  }

  async function handleSubmit() {
    const trimmed = input.trim()
    if (!trimmed) return
    setLoading(true)
    setError('')
    setResult(null)
    setCheckResult(null)
    setIsMockResult(false)

    try {
      if (mode === 'check') {
        const res = await fetch('/api/check', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ attempt: trimmed, intended: intended.trim() }),
        })
        if (!res.ok) throw new Error('Check failed')
        setCheckResult(await res.json())
      } else {
        const res = await fetch('/api/translate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ input: trimmed, direction: mode }),
        })
        if (!res.ok) throw new Error('Translation failed')
        const data: TranslationResult = await res.json()
        setResult(data)

        // Only save if logged in
        if (authUser) {
          const { error: dbError } = await supabase.from('translations').insert({
            input_text: trimmed,
            direction: mode,
            user_id: authUser.id,
            ...data,
          })
          if (!dbError) loadHistory(authUser.id)
        }
      }
    } catch {
      setError('Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  function handleClear() {
    setInput('')
    setIntended('')
    setResult(null)
    setCheckResult(null)
    setError('')
    setIsMockResult(false)
  }

  async function handleClearHistory() {
    if (!authUser) return
    const { error } = await supabase
      .from('translations')
      .delete()
      .eq('user_id', authUser.id)
    if (!error) setHistory([])
  }

  // Show auth screen first if needed
  if (showAuth) {
    return <AuthScreen onSkip={handleSkipAuth} />
  }

  // Wait for auth check before rendering
  if (!authChecked) return null

  return (
    <main className="main">
      <div className="container">

        <header className="header">
          <div className="header-top">
            <div />
            {authUser ? (
              <UserMenu email={authUser.email} onSignOut={handleSignOut} />
            ) : (
              <button className="auth-signin-btn" onClick={() => setShowAuth(true)}>
                Sign in
              </button>
            )}
          </div>
          <h1>&#26085;&#26412;&#35486; <span>Learn Japanese</span></h1>
          <p>Translate, check your writing, or have a practice conversation.</p>
        </header>

        <div className="top-tabs">
          {(['en-to-jp', 'jp-to-en', 'check', 'converse'] as Mode[]).map(m => (
            <button
              key={m}
              className={`top-tab ${mode === m ? 'active' : ''}`}
              onClick={() => handleModeChange(m)}
            >
              {m === 'en-to-jp' && 'EN \u2192 JP'}
              {m === 'jp-to-en' && 'JP \u2192 EN'}
              {m === 'check' && 'Check'}
              {m === 'converse' && '\u{1F4AC} Converse'}
            </button>
          ))}
        </div>

        {mode === 'converse' ? (
          <ConversationMode />
        ) : (
          <>
            <TranslateInput
              input={input}
              intended={intended}
              mode={mode as 'en-to-jp' | 'jp-to-en' | 'check'}
              loading={loading}
              onInputChange={setInput}
              onIntendedChange={setIntended}
              onModeChange={(m) => handleModeChange(m as Mode)}
              onTranslate={handleSubmit}
              onClear={handleClear}
            />

            {error && <div className="error-msg">{error}</div>}

            {loading && (
              <div className="loading">
                <div className="dots"><span></span><span></span><span></span></div>
                <p>{mode === 'check' ? 'Checking your Japanese...' : 'Translating...'}</p>
              </div>
            )}

            {result && (
              <div style={{ position: 'relative' }}>
                {isMockResult && (
                  <div className="mock-badge">
                    Preview \u2014 this is what your results look like
                  </div>
                )}
                <ResultCard result={result} />
              </div>
            )}

            {checkResult && <CheckResultCard result={checkResult} />}

            {authUser ? (
              <HistoryList
                history={history}
                onSelect={(r) => { setResult(r); setCheckResult(null); setIsMockResult(false) }}
                onClear={handleClearHistory}
              />
            ) : (
              history.length === 0 && (
                <div className="auth-history-prompt">
                  <button onClick={() => setShowAuth(true)}>
                    Sign in to save your translation history
                  </button>
                </div>
              )
            )}
          </>
        )}

      </div>

      {showTour && <TutorialTour onComplete={handleTourComplete} />}
    </main>
  )
}
