'use client'

import { useState, useEffect } from 'react'
import TranslateInput from '@/components/TranslateInput'
import ResultCard from '@/components/ResultCard'
import CheckResultCard from '@/components/CheckResultCard'
import HistoryList from '@/components/HistoryList'
import TutorialTour from '@/components/TutorialTour'
import ConversationMode from '@/components/ConversationMode'
import { supabase, Translation, TranslationResult } from '@/lib/supabase'
import { HELLO_MOCK } from '@/lib/mockData'

const TOUR_KEY = 'japanese-tool-tour-done'

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

  useEffect(() => {
    loadHistory()
    const tourDone = localStorage.getItem(TOUR_KEY)
    if (!tourDone) {
      setTimeout(() => {
        setInput('Hello')
        setResult(HELLO_MOCK)
        setIsMockResult(true)
        setShowTour(true)
      }, 600)
    }
  }, [])

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

  async function loadHistory() {
    const { data, error } = await supabase
      .from('translations')
      .select('*')
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
        const data = await res.json()
        setCheckResult(data)
      } else {
        const res = await fetch('/api/translate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ input: trimmed, direction: mode }),
        })
        if (!res.ok) throw new Error('Translation failed')
        const data: TranslationResult = await res.json()
        setResult(data)
        const { error: dbError } = await supabase.from('translations').insert({
          input_text: trimmed,
          direction: mode,
          ...data,
        })
        if (!dbError) loadHistory()
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
    await supabase.from('translations').delete().neq('id', '00000000-0000-0000-0000-000000000000')
    setHistory([])
  }

  return (
    <main className="main">
      <div className="container">

        <header className="header">
          <h1>日本語 <span>Learn Japanese</span></h1>
          <p>Translate, check your writing, or have a practice conversation.</p>
        </header>

        {/* Top-level mode tabs including Converse */}
        <div className="top-tabs">
          {(['en-to-jp', 'jp-to-en', 'check', 'converse'] as Mode[]).map(m => (
            <button
              key={m}
              className={`top-tab ${mode === m ? 'active' : ''}`}
              onClick={() => handleModeChange(m)}
            >
              {m === 'en-to-jp' && 'EN → JP'}
              {m === 'jp-to-en' && 'JP → EN'}
              {m === 'check' && 'Check'}
              {m === 'converse' && '💬 Converse'}
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
              mode={mode}
              loading={loading}
              onInputChange={setInput}
              onIntendedChange={setIntended}
              onModeChange={() => {}}
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
                {isMockResult && <div className="mock-badge">Preview — this is what your results look like</div>}
                <ResultCard result={result} />
              </div>
            )}

            {checkResult && <CheckResultCard result={checkResult} />}

            <HistoryList
              history={history}
              onSelect={(r) => { setResult(r); setCheckResult(null); setIsMockResult(false) }}
              onClear={handleClearHistory}
            />
          </>
        )}

      </div>

      {showTour && <TutorialTour onComplete={handleTourComplete} />}
    </main>
  )
}
