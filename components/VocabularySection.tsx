'use client'

import { useState, useEffect, useCallback } from 'react'

type VocabWord = {
  id: string
  english: string
  native: string
  reading: string
  romaji: string
  tip: string
  language: string
  created_at: string
}

type Props = {
  language: string
  userId: string | null
}

type VocabMode = 'all' | 'flashcard' | 'quiz'

function useSpeech() {
  const [speaking, setSpeaking] = useState<string | null>(null)
  function speak(text: string, id: string, lang: string) {
    if (!window.speechSynthesis) return
    window.speechSynthesis.cancel()
    if (speaking === id) { setSpeaking(null); return }
    const utterance = new SpeechSynthesisUtterance(text)
    utterance.lang = lang === 'japanese' ? 'ja-JP' : lang === 'korean' ? 'ko-KR' : 'zh-CN'
    utterance.rate = 0.85
    const voices = window.speechSynthesis.getVoices()
    const code = lang === 'japanese' ? 'ja' : lang === 'korean' ? 'ko' : 'zh'
    const voice = voices.find(v => v.lang.startsWith(code))
    if (voice) utterance.voice = voice
    utterance.onstart = () => setSpeaking(id)
    utterance.onend = () => setSpeaking(null)
    utterance.onerror = () => setSpeaking(null)
    window.speechSynthesis.speak(utterance)
  }
  return { speaking, speak }
}

// ── ALL WORDS VIEW ──
function AllWords({ words, language, onDelete }: { words: VocabWord[], language: string, onDelete: (id: string) => void }) {
  const [expanded, setExpanded] = useState<string | null>(null)
  const { speaking, speak } = useSpeech()

  if (words.length === 0) {
    return (
      <div style={{ textAlign: 'center', padding: 32, color: 'var(--text-muted)' }}>
        No words yet. Add your first word above.
      </div>
    )
  }

  return (
    <div className="alphabet-grid">
      {words.map(word => {
        const isOpen = expanded === word.id
        return (
          <div
            key={word.id}
            className={`alpha-card ${isOpen ? 'open' : ''}`}
            onClick={() => setExpanded(prev => prev === word.id ? null : word.id)}
          >
            <div className="alpha-card-char" style={{ fontSize: '1.4rem' }}>{word.native}</div>
            <div className="alpha-card-romaji">{word.english}</div>
            {isOpen && (
              <div className="alpha-card-detail" onClick={e => e.stopPropagation()}>
                {word.reading && <div className="alpha-card-meaning">{word.reading}</div>}
                {word.romaji && <div className="alpha-card-tip">{word.romaji}</div>}
                {word.tip && <div className="alpha-card-tip" style={{ marginTop: 4 }}>{word.tip}</div>}
                <div style={{ display: 'flex', gap: 6, marginTop: 8 }}>
                  <button
                    className="flashcard-audio-btn"
                    onClick={() => speak(word.native, word.id, language)}
                  >
                    {speaking === word.id ? '■ Stop' : '▶ Play'}
                  </button>
                  <button
                    className="flashcard-audio-btn"
                    style={{ color: 'var(--danger)', borderColor: 'var(--danger)' }}
                    onClick={() => onDelete(word.id)}
                  >
                    Delete
                  </button>
                </div>
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}

// ── FLASHCARD VIEW ──
function VocabFlashcard({ words, language }: { words: VocabWord[], language: string }) {
  const [index, setIndex] = useState(0)
  const [flipped, setFlipped] = useState(false)
  const [shuffled, setShuffled] = useState<VocabWord[]>([])
  const { speaking, speak } = useSpeech()

  useEffect(() => {
    setShuffled([...words].sort(() => Math.random() - 0.5))
    setIndex(0)
    setFlipped(false)
  }, [words])

  if (shuffled.length === 0) return null

  const card = shuffled[index]

  function goNext() {
    setFlipped(false)
    setTimeout(() => setIndex(i => Math.min(i + 1, shuffled.length - 1)), 150)
  }

  function goPrev() {
    setFlipped(false)
    setTimeout(() => setIndex(i => Math.max(i - 1, 0)), 150)
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div className="flashcard-wrap" onClick={() => setFlipped(f => !f)}>
        <div className={`flashcard ${flipped ? 'flipped' : ''}`}>
          <div className="flashcard-front">
            <div className="flashcard-char" style={{ fontSize: '2.5rem' }}>{card.native}</div>
            <div className="flashcard-hint">Tap to reveal</div>
          </div>
          <div className="flashcard-back">
            <div className="flashcard-char" style={{ fontSize: '2.5rem' }}>{card.native}</div>
            <div className="flashcard-romaji">{card.english}</div>
            {card.reading && <div className="flashcard-meaning">{card.reading}</div>}
            {card.romaji && <div className="flashcard-tip">{card.romaji}</div>}
            {card.tip && <div className="flashcard-tip">{card.tip}</div>}
          </div>
        </div>
      </div>

      <div className="flashcard-nav">
        <button className="flashcard-nav-btn" onClick={goPrev} disabled={index === 0}>← Prev</button>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
          <span className="flashcard-counter">{index + 1} / {shuffled.length}</span>
          <button className="flashcard-audio-btn" onClick={() => speak(card.native, `fc-${card.id}`, language)}>
            {speaking === `fc-${card.id}` ? '■ Stop' : '▶ Play'}
          </button>
        </div>
        <button className="flashcard-nav-btn" onClick={goNext} disabled={index === shuffled.length - 1}>Next →</button>
      </div>
    </div>
  )
}

// ── QUIZ VIEW ──
function VocabQuiz({ words }: { words: VocabWord[] }) {
  const [questions, setQuestions] = useState<{ word: VocabWord, options: string[], correct: string }[]>([])
  const [current, setCurrent] = useState(0)
  const [selected, setSelected] = useState<string | null>(null)
  const [correct, setCorrect] = useState(0)
  const [wrong, setWrong] = useState(0)
  const [done, setDone] = useState(false)

  function buildQuestions() {
    const shuffled = [...words].sort(() => Math.random() - 0.5).slice(0, Math.min(10, words.length))
    return shuffled.map(word => {
      const others = words.filter(w => w.id !== word.id).sort(() => Math.random() - 0.5).slice(0, 3).map(w => w.english)
      const options = [word.english, ...others].sort(() => Math.random() - 0.5)
      return { word, options, correct: word.english }
    })
  }

  useEffect(() => {
    if (words.length >= 2) {
      setQuestions(buildQuestions())
      setCurrent(0)
      setSelected(null)
      setCorrect(0)
      setWrong(0)
      setDone(false)
    }
  }, [words])

  if (words.length < 2) {
    return (
      <div style={{ textAlign: 'center', padding: 32, color: 'var(--text-muted)' }}>
        Add at least 2 words to take a quiz.
      </div>
    )
  }

  if (questions.length === 0) return null

  if (done) {
    const total = questions.length
    const score = Math.round((correct / total) * 100)
    return (
      <div className="quiz-card">
        <div style={{ fontSize: '2.5rem', marginBottom: 8 }}>
          {score >= 80 ? '🎉' : score >= 50 ? '💪' : '📚'}
        </div>
        <div style={{ fontSize: '2rem', fontWeight: 700, color: score >= 80 ? 'var(--success)' : score >= 50 ? 'var(--warning)' : 'var(--danger)', marginBottom: 8 }}>
          {score}%
        </div>
        <div style={{ fontSize: '0.9rem', color: 'var(--text-muted)', marginBottom: 20 }}>
          {correct} correct · {wrong} wrong · {total} total
        </div>
        <button className="btn-translate" onClick={() => {
          setQuestions(buildQuestions())
          setCurrent(0)
          setSelected(null)
          setCorrect(0)
          setWrong(0)
          setDone(false)
        }}>
          Try again
        </button>
      </div>
    )
  }

  const q = questions[current]

  function handleSelect(option: string) {
    if (selected) return
    setSelected(option)
    if (option === q.correct) setCorrect(c => c + 1)
    else setWrong(w => w + 1)
    setTimeout(() => {
      if (current + 1 >= questions.length) setDone(true)
      else { setCurrent(c => c + 1); setSelected(null) }
    }, 900)
  }

  return (
    <div className="quiz-card">
      <div className="quiz-progress">
        <div className="quiz-progress-bar">
          <div className="quiz-progress-fill" style={{ width: `${(current / questions.length) * 100}%` }} />
        </div>
        <span className="quiz-progress-label">{current + 1} / {questions.length}</span>
      </div>

      <div className="quiz-question-char" style={{ fontSize: '2.5rem' }}>{q.word.native}</div>
      <div className="quiz-question-label">What does this mean in English?</div>

      <div className="quiz-options">
        {q.options.map(option => {
          let cls = 'quiz-option'
          if (selected) {
            if (option === q.correct) cls += ' correct'
            else if (option === selected) cls += ' wrong'
          }
          return (
            <button key={option} className={cls} onClick={() => handleSelect(option)} disabled={!!selected}>
              {option}
            </button>
          )
        })}
      </div>

      <div className={`quiz-feedback ${selected ? (selected === q.correct ? 'correct' : 'wrong') : ''}`}>
        {selected ? (selected === q.correct ? 'Correct!' : `Answer: ${q.correct}`) : ''}
      </div>
    </div>
  )
}

// ── MAIN COMPONENT ──
export default function VocabularySection({ language, userId }: Props) {
  const [mode, setMode] = useState<VocabMode>('all')
  const [words, setWords] = useState<VocabWord[]>([])
  const [input, setInput] = useState('')
  const [adding, setAdding] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)

  const loadWords = useCallback(async () => {
    if (!userId) { setLoading(false); return }
    setLoading(true)
    const res = await fetch('/api/vocabulary', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'list', userId, language }),
    })
    const data = await res.json()
    setWords(data.data || [])
    setLoading(false)
  }, [userId, language])

  useEffect(() => { loadWords() }, [loadWords])

  async function handleAdd() {
    const trimmed = input.trim()
    if (!trimmed || !userId) return
    setAdding(true)
    setError('')
    const res = await fetch('/api/vocabulary', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'add', userId, language, english: trimmed }),
    })
    const data = await res.json()
    if (data.error) {
      setError('Failed to add word. Please try again.')
    } else {
      setInput('')
      await loadWords()
    }
    setAdding(false)
  }

  async function handleDelete(wordId: string) {
    if (!userId) return
    await fetch('/api/vocabulary', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'delete', userId, wordId }),
    })
    setWords(prev => prev.filter(w => w.id !== wordId))
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter') handleAdd()
  }

  if (!userId) {
    return (
      <div style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>
        <div style={{ fontSize: '2rem', marginBottom: 12 }}>📚</div>
        <p>Sign in to save your vocabulary words across devices.</p>
      </div>
    )
  }

  return (
    <div className="alphabet-section">

      {/* Add word input */}
      <div className="vocab-add-row">
        <input
          type="text"
          className="auth-input"
          style={{ flex: 1, padding: '10px 14px', fontSize: '0.95rem' }}
          placeholder="Type an English word and press Enter..."
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={adding}
        />
        <button
          className="btn-translate"
          style={{ padding: '10px 20px', whiteSpace: 'nowrap' }}
          onClick={handleAdd}
          disabled={adding || !input.trim()}
        >
          {adding ? '...' : '+ Add'}
        </button>
      </div>
      {error && <div className="auth-error">{error}</div>}

      {/* Mode toggle */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10 }}>
        <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
          {words.length} word{words.length !== 1 ? 's' : ''}
        </div>
        <div className="alphabet-mode-tabs">
          <button className={`alphabet-mode-btn ${mode === 'all' ? 'active' : ''}`} onClick={() => setMode('all')}>All words</button>
          <button className={`alphabet-mode-btn ${mode === 'flashcard' ? 'active' : ''}`} onClick={() => setMode('flashcard')}>Flashcards</button>
          <button className={`alphabet-mode-btn ${mode === 'quiz' ? 'active' : ''}`} onClick={() => setMode('quiz')}>Quiz</button>
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <div className="loading"><div className="dots"><span></span><span></span><span></span></div></div>
      ) : mode === 'all' ? (
        <AllWords words={words} language={language} onDelete={handleDelete} />
      ) : mode === 'flashcard' ? (
        <VocabFlashcard words={words} language={language} />
      ) : (
        <VocabQuiz words={words} />
      )}
    </div>
  )
}
