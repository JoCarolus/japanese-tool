'use client'

import { useState } from 'react'

type ExampleSentence = {
  japanese: string
  romaji: string
  english: string
}

type CheckResult = {
  correct_sentence: string
  correct_romaji: string
  student_sentence: string
  is_correct: boolean
  confidence_score: number
  confidence_label: string
  what_was_wrong: string
  what_was_right: string
  remember_this: string
  example_sentences: ExampleSentence[]
}

type Props = {
  result: CheckResult
}

function useSpeech() {
  const [speaking, setSpeaking] = useState<string | null>(null)

  function speak(text: string, id: string) {
    if (!window.speechSynthesis) return
    window.speechSynthesis.cancel()

    if (speaking === id) {
      setSpeaking(null)
      return
    }

    const utterance = new SpeechSynthesisUtterance(text)
    utterance.lang = 'ja-JP'
    utterance.rate = 0.85

    const voices = window.speechSynthesis.getVoices()
    const japaneseVoice = voices.find(v => v.lang.startsWith('ja'))
    if (japaneseVoice) utterance.voice = japaneseVoice

    utterance.onstart = () => setSpeaking(id)
    utterance.onend = () => setSpeaking(null)
    utterance.onerror = () => setSpeaking(null)

    window.speechSynthesis.speak(utterance)
  }

  return { speaking, speak }
}

export default function CheckResultCard({ result }: Props) {
  const { speaking, speak } = useSpeech()
  const score = result.confidence_score ?? 0

  const scoreColor =
    score >= 90 ? '#22c55e' :
    score >= 70 ? '#84cc16' :
    score >= 50 ? '#f59e0b' :
    score >= 30 ? '#f97316' : '#ef4444'

  const circumference = 2 * Math.PI * 28
  const strokeDashoffset = circumference - (score / 100) * circumference

  return (
    <div className="result-card">

      {/* Score header */}
      <div className="result-section check-score-section">
        <div className="check-score-row">
          <div className="check-score-ring">
            <svg width="72" height="72" viewBox="0 0 72 72">
              <circle cx="36" cy="36" r="28" fill="none" stroke="#2a2a45" strokeWidth="6" />
              <circle
                cx="36" cy="36" r="28"
                fill="none"
                stroke={scoreColor}
                strokeWidth="6"
                strokeLinecap="round"
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffset}
                transform="rotate(-90 36 36)"
                style={{ transition: 'stroke-dashoffset 0.8s ease' }}
              />
              <text x="36" y="40" textAnchor="middle" fill="#fff" fontSize="14" fontWeight="700">
                {score}%
              </text>
            </svg>
          </div>
          <div className="check-score-info">
            <div className="check-score-label" style={{ color: scoreColor }}>
              {result.confidence_label}
            </div>
            <div className="check-score-sub">
              {result.is_correct
                ? 'Your sentence was correct!'
                : "Here's how to improve it"}
            </div>
          </div>
        </div>
      </div>

      {/* Correct sentence */}
      <div className="result-section">
        <div className="section-label">Correct sentence</div>
        <div className="japanese-kanji">{result.correct_sentence}</div>
        <div className="japanese-romaji" style={{ marginTop: 8 }}>{result.correct_romaji}</div>
        {!result.is_correct && (
          <div className="check-student-attempt">
            <span className="check-attempt-label">Your attempt: </span>
            <span className="check-attempt-text">{result.student_sentence}</span>
          </div>
        )}
        <button
          className={`play-btn ${speaking === 'correct' ? 'playing' : ''}`}
          style={{ marginTop: 12 }}
          onClick={() => speak(result.correct_sentence, 'correct')}
        >
          {speaking === 'correct' ? '■ Stop' : '▶ Play Audio'}
        </button>
      </div>

      {/* What was right */}
      {result.what_was_right && (
        <div className="result-section check-right-section">
          <div className="check-feedback-icon">✓</div>
          <div className="check-feedback-text">{result.what_was_right}</div>
        </div>
      )}

      {/* What was wrong */}
      {!result.is_correct && result.what_was_wrong && (
        <div className="result-section check-wrong-section">
          <div className="section-label">What to fix</div>
          <div className="structure-content">{result.what_was_wrong}</div>
        </div>
      )}

      {/* Remember this */}
      {result.remember_this && (
        <div className="result-section check-tip-section">
          <div className="check-tip-header">
            <span className="check-tip-icon">💡</span>
            <span className="section-label" style={{ margin: 0 }}>Remember this</span>
          </div>
          <div className="structure-content" style={{ marginTop: 8 }}>
            {result.remember_this}
          </div>
        </div>
      )}

      {/* Example sentences */}
      {result.example_sentences?.length > 0 && (
        <div className="result-section">
          <div className="section-label">Similar examples</div>
          <div className="check-examples">
            {result.example_sentences.map((ex, i) => (
              <div key={i} className="check-example-item">
                <div className="check-example-jp">{ex.japanese}</div>
                <div className="check-example-romaji">{ex.romaji}</div>
                <div className="check-example-en">{ex.english}</div>
                <button
                  className={`play-btn ${speaking === `example-${i}` ? 'playing' : ''}`}
                  style={{ marginTop: 8 }}
                  onClick={() => speak(ex.japanese, `example-${i}`)}
                >
                  {speaking === `example-${i}` ? '■ Stop' : '▶ Play Audio'}
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

    </div>
  )
}
