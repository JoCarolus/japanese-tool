'use client'

import { useState } from 'react'
import { AlphabetCard } from '@/lib/alphabetData'

type Props = {
  cards: AlphabetCard[]
  language: string
}

function useSpeech() {
  const [speaking, setSpeaking] = useState(false)
  function speak(text: string, lang: string) {
    if (!window.speechSynthesis) return
    window.speechSynthesis.cancel()
    const utterance = new SpeechSynthesisUtterance(text)
    utterance.lang = lang === 'japanese' ? 'ja-JP' : lang === 'korean' ? 'ko-KR' : 'zh-CN'
    utterance.rate = 0.8
    const voices = window.speechSynthesis.getVoices()
    const langCode = lang === 'japanese' ? 'ja' : lang === 'korean' ? 'ko' : 'zh'
    const voice = voices.find(v => v.lang.startsWith(langCode))
    if (voice) utterance.voice = voice
    utterance.onstart = () => setSpeaking(true)
    utterance.onend = () => setSpeaking(false)
    utterance.onerror = () => setSpeaking(false)
    window.speechSynthesis.speak(utterance)
  }
  return { speaking, speak }
}

export default function Flashcard({ cards, language }: Props) {
  const [index, setIndex] = useState(0)
  const [flipped, setFlipped] = useState(false)
  const { speaking, speak } = useSpeech()

  const card = cards[index]

  function goNext() {
    setFlipped(false)
    setTimeout(() => setIndex(i => Math.min(i + 1, cards.length - 1)), 150)
  }

  function goPrev() {
    setFlipped(false)
    setTimeout(() => setIndex(i => Math.max(i - 1, 0)), 150)
  }

  function handleFlip() {
    setFlipped(f => !f)
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

      <div className="flashcard-wrap" onClick={handleFlip}>
        <div className={`flashcard ${flipped ? 'flipped' : ''}`}>
          <div className="flashcard-front">
            <div className="flashcard-char">{card.char}</div>
            <div className="flashcard-hint">Tap to reveal</div>
          </div>
          <div className="flashcard-back">
            <div className="flashcard-char">{card.char}</div>
            <div className="flashcard-romaji">{card.romaji}</div>
            {card.meaning && <div className="flashcard-meaning">{card.meaning}</div>}
            {card.tip && <div className="flashcard-tip">{card.tip}</div>}
          </div>
        </div>
      </div>

      <div className="flashcard-nav">
        <button
          className="flashcard-nav-btn"
          onClick={goPrev}
          disabled={index === 0}
        >
          ← Prev
        </button>

        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
          <span className="flashcard-counter">{index + 1} / {cards.length}</span>
          <button
            className="flashcard-audio-btn"
            onClick={(e) => { e.stopPropagation(); speak(card.char, language) }}
          >
            {speaking ? '■ Stop' : '▶ Play'}
          </button>
        </div>

        <button
          className="flashcard-nav-btn"
          onClick={goNext}
          disabled={index === cards.length - 1}
        >
          Next →
        </button>
      </div>

    </div>
  )
}
