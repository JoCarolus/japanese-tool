'use client'

import { useState } from 'react'
import { AlphabetCard } from '@/lib/alphabetData'

type Props = {
  cards: AlphabetCard[]
  language: string
}

function useSpeech() {
  const [speaking, setSpeaking] = useState<string | null>(null)
  function speak(text: string, id: string, lang: string) {
    if (!window.speechSynthesis) return
    window.speechSynthesis.cancel()
    if (speaking === id) { setSpeaking(null); return }
    const utterance = new SpeechSynthesisUtterance(text)
    utterance.lang = lang === 'japanese' ? 'ja-JP' : lang === 'korean' ? 'ko-KR' : 'zh-CN'
    utterance.rate = 0.8
    const voices = window.speechSynthesis.getVoices()
    const langCode = lang === 'japanese' ? 'ja' : lang === 'korean' ? 'ko' : 'zh'
    const voice = voices.find(v => v.lang.startsWith(langCode))
    if (voice) utterance.voice = voice
    utterance.onstart = () => setSpeaking(id)
    utterance.onend = () => setSpeaking(null)
    utterance.onerror = () => setSpeaking(null)
    window.speechSynthesis.speak(utterance)
  }
  return { speaking, speak }
}

export default function AlphabetGrid({ cards, language }: Props) {
  const [expanded, setExpanded] = useState<string | null>(null)
  const { speaking, speak } = useSpeech()

  function toggle(char: string) {
    setExpanded(prev => prev === char ? null : char)
  }

  return (
    <div className="alphabet-grid">
      {cards.map((card, i) => {
        const isOpen = expanded === card.char
        const cardId = `card-${i}`
        return (
          <div
            key={i}
            className={`alpha-card ${isOpen ? 'open' : ''}`}
            onClick={() => toggle(card.char)}
          >
            <div className="alpha-card-char">{card.char}</div>
            <div className="alpha-card-romaji">{card.romaji}</div>

            {isOpen && (
              <div className="alpha-card-detail" onClick={e => e.stopPropagation()}>
                {card.meaning && (
                  <div className="alpha-card-meaning">{card.meaning}</div>
                )}
                {card.tip && (
                  <div className="alpha-card-tip">{card.tip}</div>
                )}
                <button
                  className={`flashcard-audio-btn ${speaking === cardId ? 'playing' : ''}`}
                  style={{ marginTop: 8 }}
                  onClick={() => speak(card.char, cardId, language)}
                >
                  {speaking === cardId ? '■ Stop' : '▶ Play'}
                </button>
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
