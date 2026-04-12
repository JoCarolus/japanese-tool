'use client'

import { useState } from 'react'
import { AlphabetCard } from '@/lib/alphabetData'
import { useAudioPlayer } from '@/hooks/useAudioPlayer'

type Props = {
  cards: AlphabetCard[]
  language: string
}

export default function AlphabetGrid({ cards, language }: Props) {
  const [expanded, setExpanded] = useState<string | null>(null)
  const { isPlaying, isLoading, speak, stop } = useAudioPlayer()
  const [playingCardId, setPlayingCardId] = useState<string | null>(null)

  function toggle(char: string) {
    setExpanded(prev => prev === char ? null : char)
  }

  const getLangCode = () => {
    switch(language) {
      case 'japanese': return 'ja-JP'
      case 'korean': return 'ko-KR'
      case 'chinese': return 'zh-CN'
      default: return 'ja-JP'
    }
  }

  const handlePlay = async (char: string, cardId: string, e: React.MouseEvent) => {
    e.stopPropagation()
    
    if (playingCardId === cardId && isPlaying) {
      stop()
      setPlayingCardId(null)
    } else {
      stop()
      setPlayingCardId(cardId)
      await speak(char, getLangCode())
      // Reset playing state when done (speak will trigger isPlaying to change)
      setTimeout(() => {
        if (!isPlaying) setPlayingCardId(null)
      }, 500)
    }
  }

  return (
    <div className="alphabet-grid">
      {cards.map((card, i) => {
        const isOpen = expanded === card.char
        const cardId = `card-${i}`
        const isThisCardPlaying = playingCardId === cardId && isPlaying

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
  className={`flashcard-audio-btn ${isThisCardPlaying ? 'playing' : ''}`}
  style={{ marginTop: 8 }}
  onClick={(e) => handlePlay(card.char, cardId, e)}
  disabled={isLoading && isThisCardPlaying}
>
  {isLoading && isThisCardPlaying ? (
    '⏳...'
  ) : isThisCardPlaying ? (
    <>
      <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor" style={{ marginRight: 4 }}>
        <rect x="4" y="4" width="16" height="16" rx="2" />
      </svg>
      Stop
    </>
  ) : (
    <>
      <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor" style={{ marginRight: 4 }}>
        <polygon points="5,3 19,12 5,21" />
      </svg>
      Play
    </>
  )}
</button>
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}