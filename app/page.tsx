'use client'

import { useState, useEffect } from 'react'
import { supabase, Translation, TranslationResult } from '@/lib/supabase'
import { HELLO_MOCK } from '@/lib/mockData'
import TranslateInput from '@/components/TranslateInput'
import ResultCard from '@/components/ResultCard'
import CheckResultCard from '@/components/CheckResultCard'
import HistoryList from '@/components/HistoryList'
import TutorialTour from '@/components/TutorialTour'
import ConversationMode from '@/components/ConversationMode'
import AlphabetSection from '@/components/AlphabetSection'
import AuthScreen from '@/components/AuthScreen'
import UserMenu from '@/components/UserMenu'
import LanguageSelect from '@/components/LanguageSelect'
import ThemeToggle from '@/components/ThemeToggle'
import PinPrompt, { shouldShowPinPrompt } from '@/components/PinPrompt'

const TOUR_KEY = 'language-tool-tour-done'
const SKIP_AUTH_KEY = 'language-tool-skip-auth'
const LANG_KEY = 'language-tool-last-lang'
const THEME_KEY = 'language-tool-theme'

type Language = 'japanese' | 'korean' | 'chinese'
type Mode = 'en-to-lang' | 'lang-to-en' | 'check' | 'converse' | 'alphabet'

const LANG_NAMES: Record<Language, string> = {
  japanese: 'Japanese',
  korean: 'Korean',
  chinese: 'Chinese',
}

const LANG_SCRIPTS: Record<Language, string> = {
  japanese: '\u65e5\u672c\u8a9e',
  korean: '\ud55c\uad6d\uc5b4',
  chinese: '\u4e2d\u6587',
}

export default function Home() {
  const [language, setLanguage] = useState<Language | null>(null)
  const [theme, setTheme] = useState<'light' | 'dark'>('light')
  const [mode, setMode] = useState<Mode>('en-to-lang')
  const [input, setInput] = useState('')
  const [intended, setIntended] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<TranslationResult | null>(null)
  const [checkResult, setCheckResult] = useState<any | null>(null)
  const [error, setError] = useState('')
  const [history, setHistory] = useState<Translation[]>([])
  const [showTour, setShowTour] = useState(false)
  const [isMockResult, setIsMockResult] = useState(false)
  const [authUser, setAuthUser] = useState<any | null>(null)
  const [authChecked, setAuthChecked] = useState(false)
  const [showAuth, setShowAuth] = useState(false)
  const [showPinPrompt, setShowPinPrompt] = useState(false)

  // Init theme and language from localStorage
  useEffect(() => {
    const savedTheme = (localStorage.getItem(THEME_KEY) as 'light' | 'dark') ||
      (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light')
    setTheme(savedTheme)
    document.documentElement.setAttribute('data-theme', savedTheme)

    const savedLang = localStorage.getItem(LANG_KEY) as Language | null
    if (savedLang) setLanguage(savedLang)
  }, [])

  // Auth check
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        setAuthUser(session.user)
        setAuthChecked(true)
      } else {
        // Check for PIN session first — takes priority over showing auth screen
        const pinUserId = localStorage.getItem('pin_user_id')
        const pinEmail = localStorage.getItem('pin_user_email')
        if (pinUserId) {
          setAuthUser({ id: pinUserId, email: pinEmail || 'PIN user', isPinUser: true })
          setAuthChecked(true)
          // Don't show auth screen — PIN user is logged in
          return
        }
        setAuthChecked(true)
        const skipped = localStorage.getItem(SKIP_AUTH_KEY)
        if (!skipped && language) setShowAuth(true)
      }
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setAuthUser(session?.user ?? null)
      if (session?.user) {
        setShowAuth(false)
        if (language) loadHistory(session.user.id, language)
        if (shouldShowPinPrompt()) setShowPinPrompt(true)
      }
    })

    return () => subscription.unsubscribe()
  }, [language])

  // Load history and tour after auth check
  useEffect(() => {
    if (!authChecked || !language) return
    if (authUser) loadHistory(authUser.id, language)

    const tourDone = localStorage.getItem(TOUR_KEY)
    if (!tourDone && mode !== 'alphabet' && mode !== 'converse') {
      setTimeout(() => {
        setInput('Hello')
        setResult(HELLO_MOCK)
        setIsMockResult(true)
        setShowTour(true)
      }, 600)
    }
  }, [authChecked, authUser, language])

  function toggleTheme() {
    const next = theme === 'light' ? 'dark' : 'light'
    setTheme(next)
    document.documentElement.setAttribute('data-theme', next)
    localStorage.setItem(THEME_KEY, next)
  }

  function handleSelectLanguage(lang: Language) {
    setLanguage(lang)
    localStorage.setItem(LANG_KEY, lang)
    setMode('en-to-lang')
    setResult(null)
    setCheckResult(null)
    setInput('')
    setIntended('')
    setHistory([])
    if (authUser) loadHistory(authUser.id, lang)
    const isPinLoggedIn = !!localStorage.getItem('pin_user_id')
    if (!authUser && !isPinLoggedIn && !localStorage.getItem(SKIP_AUTH_KEY)) setShowAuth(true)
  }

  function handleSkipAuth() {
    localStorage.setItem(SKIP_AUTH_KEY, 'true')
    setShowAuth(false)
  }

  function handlePinLogin(userId: string, email?: string) {
    localStorage.setItem('pin_user_id', userId)
    if (email) localStorage.setItem('pin_user_email', email)
    setAuthUser({ id: userId, email: email || 'PIN user', isPinUser: true })
    setShowAuth(false)
    if (language) loadHistory(userId, language)
  }

  function handleSignOut() {
    localStorage.removeItem('pin_user_id')
    localStorage.removeItem('pin_user_email')
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

  async function loadHistory(userId: string, lang: Language) {
    // Use server-side API so PIN users (no Supabase session) can access history
    const res = await fetch('/api/history', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, language: lang }),
    })
    const result = await res.json()
    if (result.data) setHistory(result.data)
  }

  async function handleSubmit() {
    const trimmed = input.trim()
    if (!trimmed || !language) return
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
          body: JSON.stringify({ attempt: trimmed, intended: intended.trim(), language }),
        })
        if (!res.ok) throw new Error('Check failed')
        setCheckResult(await res.json())
      } else {
        const res = await fetch('/api/translate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ input: trimmed, direction: mode, language }),
        })
        if (!res.ok) throw new Error('Translation failed')
        const data: TranslationResult = await res.json()
        setResult(data)

        if (authUser) {
          const { error: dbError } = await supabase.from('translations').insert({
            input_text: trimmed,
            direction: mode,
            user_id: authUser.id,
            language,
            ...data,
          })
          if (!dbError) loadHistory(authUser.id, language)
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
    if (!authUser || !language) return
    const { error } = await supabase
      .from('translations')
      .delete()
      .eq('user_id', authUser.id)
      .eq('language', language)
    if (!error) setHistory([])
  }

  const langName = language ? LANG_NAMES[language] : ''
  const langScript = language ? LANG_SCRIPTS[language] : ''

  // Show language selection if none chosen
  if (!language) {
    return (
      <LanguageSelect
        onSelect={handleSelectLanguage}
        theme={theme}
        onToggleTheme={toggleTheme}
      />
    )
  }

  // Show auth screen
  if (showAuth) return <AuthScreen onSkip={handleSkipAuth} onPinLogin={handlePinLogin} />

  // Wait for auth check
  if (!authChecked) return null

  return (
    <main className="main">
      <div className="container">

        <header className="header">
          <div className="header-top">
            <button className="switch-lang-btn" onClick={() => setLanguage(null)}>
              ← Languages
            </button>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <ThemeToggle theme={theme} onToggle={toggleTheme} />
              {authUser ? (
                <UserMenu email={authUser.email} userId={authUser.id} onSignOut={handleSignOut} />
              ) : (
                <button className="auth-signin-btn" onClick={() => setShowAuth(true)}>
                  Sign in
                </button>
              )}
            </div>
          </div>
          <h1><span style={{color: "var(--accent)"}}>Tri</span>lingo<span style={{color: "var(--text-secondary)", fontWeight: 700}}> — {langName}</span></h1>
          <p>Translate, check your writing, practise conversations, and master the {langName} alphabet.</p>
        </header>

        <div className="top-tabs">
          {([
            ['en-to-lang', `EN → ${langName.slice(0, 2)}`],
            ['lang-to-en', `${langName.slice(0, 2)} → EN`],
            ['check', 'Check'],
            ['converse', 'Converse'],
            ['alphabet', 'Alphabet'],
          ] as [Mode, string][]).map(([m, label]) => (
            <button
              key={m}
              className={`top-tab ${mode === m ? 'active' : ''}`}
              onClick={() => handleModeChange(m)}
            >
              {label}
            </button>
          ))}
        </div>

        {mode === 'converse' && <ConversationMode language={language} />}
        {mode === 'alphabet' && <AlphabetSection language={language} />}

        {mode !== 'converse' && mode !== 'alphabet' && (
          <>
            <TranslateInput
              input={input}
              intended={intended}
              mode={mode as 'en-to-lang' | 'lang-to-en' | 'check'}
              language={language}
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
                <p>{mode === 'check' ? 'Checking your writing...' : 'Translating...'}</p>
              </div>
            )}

            {result && (
              <div style={{ position: 'relative' }}>
                {isMockResult && (
                  <div className="mock-badge">
                    Preview — this is what your results look like
                  </div>
                )}
                <ResultCard result={result} targetLanguage={language as any} />
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
              <div className="auth-history-prompt">
                <button onClick={() => setShowAuth(true)}>
                  Sign in to save your {langName} translation history
                </button>
              </div>
            )}
          </>
        )}

      </div>

      {showTour && <TutorialTour onComplete={handleTourComplete} />}
      {showPinPrompt && (
        <PinPrompt
          onSetPin={() => { setShowPinPrompt(false) }}
          onDismiss={() => setShowPinPrompt(false)}
        />
      )}
    </main>
  )
}
