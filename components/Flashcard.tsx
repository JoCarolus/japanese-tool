'use client'

import { useState, useEffect, useRef } from 'react'
import { AlphabetCard } from '@/lib/alphabetData'

type Props = {
  cards: AlphabetCard[]
  language: string
}

function useSpeech() {
  const [speaking, setSpeaking] = useState(false)
  const [audioInitialized, setAudioInitialized] = useState(false)
  const voicesRef = useRef<SpeechSynthesisVoice[]>([])

  useEffect(() => {
    function loadVoices() {
      const voices = window.speechSynthesis.getVoices()
      if (voices.length > 0) {
        voicesRef.current = voices
      } else {
        // Retry after a short delay on mobile
        setTimeout(loadVoices, 100)
      }
    }
    loadVoices()
    window.speechSynthesis.onvoiceschanged = loadVoices
    return () => {
      window.speechSynthesis.onvoiceschanged = null
    }
  }, [])

  const initAudio = () => {
    if (!audioInitialized && window.speechSynthesis) {
      // Prime the audio system with a silent utterance
      const silentUtterance = new SpeechSynthesisUtterance(' ')
      silentUtterance.volume = 0
      window.speechSynthesis.speak(silentUtterance)
      window.speechSynthesis.cancel()
      setAudioInitialized(true)
    }
  }

  function speak(text: string, lang: string) {
    if (!window.speechSynthesis) return
    
    // Initialize audio on first user interaction
    if (!audioInitialized) {
      initAudio()
      setTimeout(() => speak(text, lang), 100)
      return
    }
    
    window.speechSynthesis.cancel()

    const langCode = lang === 'japanese' ? 'ja-JP' : lang === 'korean' ? 'ko-KR' : 'zh-CN'
    const langPrefix = lang === 'japanese' ? 'ja' : lang === 'korean' ? 'ko' : 'zh'

    const utterance = new SpeechSynthesisUtterance(text)
    utterance.lang = langCode
    utterance.rate = 0.8

    const voices = voicesRef.current.length
      ? voicesRef.current
      : window.speechSynthesis.getVoices()
    const voice = voices.find(v => v.lang.startsWith(langPrefix))
    if (voice) utterance.voice = voice

    utterance.onstart = () => setSpeaking(true)
    utterance.onend = () => setSpeaking(false)
    utterance.onerror = () => setSpeaking(false)

    // REMOVED: setSpeaking(true) - this was causing race conditions
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
        <div className={'flashcard ' + (flipped ? 'flipped' : '')}>
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
          {'\u2190'} Prev
        </button>

        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
          <span className="flashcard-counter">{index + 1} / {cards.length}</span>
          <button
            className="flashcard-audio-btn"
            onClick={(e) => { e.stopPropagation(); speak(card.char, language) }}
          >
            {speaking ? '\u25a0 Stop' : '\u25b6 Play'}
          </button>
        </div>

        <button
          className="flashcard-nav-btn"
          onClick={goNext}
          disabled={index === cards.length - 1}
        >
          Next {'\u2192'}
        </button>
      </div>

    </div>
  )
}