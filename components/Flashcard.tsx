'use client'

import { useState } from 'react'
import { AlphabetCard } from '@/lib/alphabetData'
import { useAudioPlayer } from '@/hooks/useAudioPlayer'

type Props = {
  cards: AlphabetCard[]
  language: string
}

export default function Flashcard({ cards, language }: Props) {
  const [index, setIndex] = useState(0)
  const [flipped, setFlipped] = useState(false)
  const { isPlaying, isLoading, speak, stop } = useAudioPlayer();

  const card = cards[index]

  const getLangCode = () => {
    switch(language) {
      case 'japanese': return 'ja-JP';
      case 'korean': return 'ko-KR';
      case 'chinese': return 'zh-CN';
      default: return 'ja-JP';
    }
  };

  const handleSpeak = async () => {
    if (isPlaying) {
      stop();
    } else {
      if (card?.char) {
        await speak(card.char, getLangCode());
      }
    }
  };

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

  if (!card) {
    return <div>No cards available</div>
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
          ← Prev
        </button>

        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
          <span className="flashcard-counter">{index + 1} / {cards.length}</span>
          <button
            className="flashcard-audio-btn"
            onClick={(e) => { 
              e.stopPropagation(); 
              handleSpeak();
            }}
            disabled={isLoading || !card.char}
          >
            {isLoading ? '⏳...' : (isPlaying ? '■ Stop' : '▶ Play')}
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
  );
}