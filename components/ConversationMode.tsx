'use client'

import { useState, useRef, useEffect } from 'react'

const TOPICS = [
  { id: 'greetings', label: 'Greetings', emoji: '👋', description: 'Hello, goodbye, how are you' },
  { id: 'food', label: 'Food & Drinks', emoji: '🍜', description: 'Ordering at a restaurant or café' },
  { id: 'directions', label: 'Asking Directions', emoji: '🗺️', description: 'Finding your way around' },
  { id: 'shopping', label: 'Shopping', emoji: '🛍️', description: 'Buying things, asking prices' },
  { id: 'weather', label: 'Weather & Small Talk', emoji: '🌤️', description: 'Casual everyday chat' },
  { id: 'hotel', label: 'At a Hotel', emoji: '🏨', description: 'Check in, requests, questions' },
  { id: 'transport', label: 'Transport', emoji: '🚆', description: 'Trains, buses, taxis' },
  { id: 'numbers', label: 'Numbers & Prices', emoji: '💴', description: 'Counting, money, quantities' },
]

const LENGTH_OPTIONS = [
  { id: 'short', label: 'Short', description: '5 exchanges', exchanges: 5 },
  { id: 'medium', label: 'Medium', description: '10 exchanges', exchanges: 10 },
  { id: 'open', label: 'Keep going', description: 'Until I stop', exchanges: 999 },
]

type Message = {
  role: 'bot' | 'user'
  japanese: string
  romaji: string
  english: string
  correction?: {
    is_correct: boolean
    confidence_score: number
    confidence_label: string
    corrected: string
    tip: string | null
  } | null
}

type Summary = {
  overall_score: number
  overall_label: string
  highlight: string
  focus_next: string
  encouragement: string
}

function useSpeech() {
  const [speaking, setSpeaking] = useState<string | null>(null)
  function speak(text: string, id: string) {
    if (!window.speechSynthesis) return
    window.speechSynthesis.cancel()
    if (speaking === id) { setSpeaking(null); return }
    const utterance = new SpeechSynthesisUtterance(text)
    utterance.lang = 'ja-JP'
    utterance.rate = 0.85
    const voices = window.speechSynthesis.getVoices()
    const jpVoice = voices.find(v => v.lang.startsWith('ja'))
    if (jpVoice) utterance.voice = jpVoice
    utterance.onstart = () => setSpeaking(id)
    utterance.onend = () => setSpeaking(null)
    utterance.onerror = () => setSpeaking(null)
    window.speechSynthesis.speak(utterance)
  }
  return { speaking, speak }
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false)
  function handleCopy() {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    })
  }
  return (
    <button className="copy-btn" onClick={handleCopy}>
      {copied ? '✓ Copied!' : 'Copy Japanese'}
    </button>
  )
}

export default function ConversationMode() {
  const [stage, setStage] = useState<'topic' | 'length' | 'chat' | 'summary'>('topic')
  const [selectedTopic, setSelectedTopic] = useState<typeof TOPICS[0] | null>(null)
  const [selectedLength, setSelectedLength] = useState<typeof LENGTH_OPTIONS[0] | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [exchangeCount, setExchangeCount] = useState(0)
  const [summary, setSummary] = useState<Summary | null>(null)
  const [corrections, setCorrections] = useState<any[]>([])
  const { speaking, speak } = useSpeech()
  const bottomRef = useRef<HTMLDivElement>(null)
  const chatHistory = useRef<{ role: string; content: string }[]>([])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, loading])

  async function startConversation() {
    if (!selectedTopic || !selectedLength) return
    setLoading(true)
    try {
      const res = await fetch('/api/converse-start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ topic: selectedTopic.label }),
      })
      const data = await res.json()
      const botMsg: Message = {
        role: 'bot',
        japanese: data.japanese,
        romaji: data.romaji,
        english: data.english,
      }
      setMessages([botMsg])
      chatHistory.current = [{ role: 'assistant', content: data.japanese }]
      setStage('chat')
    } catch {
      // handle error
    } finally {
      setLoading(false)
    }
  }

  async function sendMessage() {
    const trimmed = input.trim()
    if (!trimmed || loading) return

    const userMsg: Message = {
      role: 'user',
      japanese: trimmed,
      romaji: '',
      english: '',
    }
    setMessages(prev => [...prev, userMsg])
    setInput('')
    setLoading(true)

    chatHistory.current.push({ role: 'user', content: trimmed })

    try {
      const res = await fetch('/api/converse', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          topic: selectedTopic?.label,
          history: chatHistory.current.slice(-10),
          userMessage: trimmed,
        }),
      })
      const data = await res.json()

      // Attach correction to the user message
      if (data.correction) {
        setCorrections(prev => [...prev, data.correction])
        setMessages(prev =>
          prev.map((m, i) =>
            i === prev.length - 1 ? { ...m, correction: data.correction } : m
          )
        )
      }

      const botMsg: Message = {
        role: 'bot',
        japanese: data.japanese,
        romaji: data.romaji,
        english: data.english,
      }
      setMessages(prev => [...prev, botMsg])
      chatHistory.current.push({ role: 'assistant', content: data.japanese })

      const newCount = exchangeCount + 1
      setExchangeCount(newCount)

      if (selectedLength && selectedLength.exchanges !== 999 && newCount >= selectedLength.exchanges) {
        await fetchSummary([...corrections, data.correction].filter(Boolean))
      }
    } catch {
      // handle error
    } finally {
      setLoading(false)
    }
  }

  // Enter to send, Shift+Enter for new line
  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  async function fetchSummary(allCorrections: any[]) {
    try {
      const res = await fetch('/api/converse-summary', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ topic: selectedTopic?.label, corrections: allCorrections }),
      })
      const data = await res.json()
      setSummary(data)
      setStage('summary')
    } catch {
      setStage('summary')
    }
  }

  async function handleFinish() {
    await fetchSummary(corrections)
  }

  function handleRestart() {
    setStage('topic')
    setSelectedTopic(null)
    setSelectedLength(null)
    setMessages([])
    setInput('')
    setExchangeCount(0)
    setSummary(null)
    setCorrections([])
    chatHistory.current = []
  }

  // ── TOPIC SELECTION ──
  if (stage === 'topic') {
    return (
      <div className="convo-container">
        <div className="convo-header">
          <h2 className="convo-title">Practice Conversation</h2>
          <p className="convo-subtitle">Choose a topic to start practising</p>
        </div>
        <div className="topic-grid">
          {TOPICS.map(topic => (
            <button
              key={topic.id}
              className={`topic-card ${selectedTopic?.id === topic.id ? 'selected' : ''}`}
              onClick={() => setSelectedTopic(topic)}
            >
              <span className="topic-emoji">{topic.emoji}</span>
              <span className="topic-label">{topic.label}</span>
              <span className="topic-desc">{topic.description}</span>
            </button>
          ))}
        </div>
        {selectedTopic && (
          <button
            className="btn-translate"
            style={{ margin: '20px auto', display: 'block', minWidth: 200 }}
            onClick={() => setStage('length')}
          >
            Next →
          </button>
        )}
      </div>
    )
  }

  // ── LENGTH SELECTION ──
  if (stage === 'length') {
    return (
      <div className="convo-container">
        <div className="convo-header">
          <button className="convo-back" onClick={() => setStage('topic')}>← Back</button>
          <h2 className="convo-title">{selectedTopic?.emoji} {selectedTopic?.label}</h2>
          <p className="convo-subtitle">How long do you want to practise?</p>
        </div>
        <div className="length-options">
          {LENGTH_OPTIONS.map(opt => (
            <button
              key={opt.id}
              className={`length-card ${selectedLength?.id === opt.id ? 'selected' : ''}`}
              onClick={() => setSelectedLength(opt)}
            >
              <span className="length-label">{opt.label}</span>
              <span className="length-desc">{opt.description}</span>
            </button>
          ))}
        </div>
        {selectedLength && (
          <button
            className="btn-translate"
            style={{ margin: '20px auto', display: 'block', minWidth: 200 }}
            onClick={startConversation}
            disabled={loading}
          >
            {loading ? 'Starting...' : 'Start conversation →'}
          </button>
        )}
      </div>
    )
  }

  // ── SUMMARY ──
  if (stage === 'summary') {
    const score = summary?.overall_score ?? 0
    const scoreColor = score >= 90 ? '#22c55e' : score >= 70 ? '#84cc16' : score >= 50 ? '#f59e0b' : '#f97316'
    const circumference = 2 * Math.PI * 28
    const strokeDashoffset = circumference - (score / 100) * circumference

    return (
      <div className="convo-container">
        <div className="result-card">
          <div className="result-section check-score-section">
            <div className="check-score-row">
              <div className="check-score-ring">
                <svg width="72" height="72" viewBox="0 0 72 72">
                  <circle cx="36" cy="36" r="28" fill="none" stroke="#2a2a45" strokeWidth="6" />
                  <circle cx="36" cy="36" r="28" fill="none" stroke={scoreColor} strokeWidth="6"
                    strokeLinecap="round" strokeDasharray={circumference} strokeDashoffset={strokeDashoffset}
                    transform="rotate(-90 36 36)" style={{ transition: 'stroke-dashoffset 0.8s ease' }} />
                  <text x="36" y="40" textAnchor="middle" fill="#fff" fontSize="14" fontWeight="700">{score}%</text>
                </svg>
              </div>
              <div className="check-score-info">
                <div className="check-score-label" style={{ color: scoreColor }}>{summary?.overall_label ?? 'Well done!'}</div>
                <div className="check-score-sub">Conversation complete</div>
              </div>
            </div>
          </div>
          {summary && (
            <>
              <div className="result-section check-right-section">
                <div className="check-feedback-icon">✓</div>
                <div className="check-feedback-text">{summary.highlight}</div>
              </div>
              <div className="result-section check-tip-section">
                <div className="check-tip-header">
                  <span className="check-tip-icon">💡</span>
                  <span className="section-label" style={{ margin: 0 }}>Focus on next time</span>
                </div>
                <div className="structure-content" style={{ marginTop: 8 }}>{summary.focus_next}</div>
              </div>
              <div className="result-section">
                <div className="structure-content">{summary.encouragement}</div>
              </div>
            </>
          )}
          <div className="result-section" style={{ display: 'flex', gap: 10 }}>
            <button className="btn-translate" style={{ flex: 1 }} onClick={handleRestart}>
              New conversation
            </button>
            <button className="btn-clear" onClick={() => setStage('chat')}>
              Review chat
            </button>
          </div>
        </div>
      </div>
    )
  }

  // ── CHAT ──
  return (
    <div className="convo-container">
      <div className="chat-header">
        <div className="chat-topic-badge">
          {selectedTopic?.emoji} {selectedTopic?.label}
        </div>
        {selectedLength?.exchanges !== 999 && (
          <div className="chat-progress">
            {exchangeCount} / {selectedLength?.exchanges}
          </div>
        )}
        <button className="btn-clear" style={{ padding: '6px 14px', fontSize: '0.8rem' }} onClick={handleFinish}>
          Finish
        </button>
      </div>

      <div className="chat-messages">
        {messages.map((msg, i) => (
          <div key={i} className={`chat-bubble-wrap ${msg.role}`}>
            {msg.role === 'bot' ? (
              <div className="chat-bubble bot-bubble">
                <div className="chat-jp">{msg.japanese}</div>
                <div className="chat-romaji">{msg.romaji}</div>
                <div className="chat-en">{msg.english}</div>
                <div className="btn-row" style={{ marginTop: 8 }}>
                  <button
                    className={`play-btn ${speaking === `msg-${i}` ? 'playing' : ''}`}
                    onClick={() => speak(msg.japanese, `msg-${i}`)}
                  >
                    {speaking === `msg-${i}` ? '■ Stop' : '▶ Play'}
                  </button>
                  <CopyButton text={msg.japanese} />
                </div>
              </div>
            ) : (
              <div className="chat-bubble user-bubble">
                <div className="chat-jp">{msg.japanese}</div>
                {msg.correction && !msg.correction.is_correct && (
                  <div className="chat-correction">
                    <div className="chat-correction-score">
                      <span style={{
                        color: msg.correction.confidence_score >= 70 ? '#84cc16' :
                               msg.correction.confidence_score >= 40 ? '#f59e0b' : '#ef4444'
                      }}>
                        {msg.correction.confidence_score}% — {msg.correction.confidence_label}
                      </span>
                    </div>
                    {msg.correction.corrected !== msg.japanese && (
                      <div className="chat-correction-text">✏️ {msg.correction.corrected}</div>
                    )}
                    {msg.correction.tip && (
                      <div className="chat-correction-tip">💡 {msg.correction.tip}</div>
                    )}
                  </div>
                )}
                {msg.correction?.is_correct && (
                  <div className="chat-correction-perfect">✓ Perfect!</div>
                )}
              </div>
            )}
          </div>
        ))}

        {loading && (
          <div className="chat-bubble-wrap bot">
            <div className="chat-bubble bot-bubble">
              <div className="dots"><span></span><span></span><span></span></div>
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      <div className="chat-input-row">
        <textarea
          className="chat-input"
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Type your Japanese reply... (Enter to send, Shift+Enter for new line)"
          rows={2}
          disabled={loading}
        />
        <button
          className="chat-send-btn"
          onClick={sendMessage}
          disabled={loading || !input.trim()}
        >
          Send
        </button>
      </div>
    </div>
  )
}
