'use client'

import { useState } from 'react'
import { ALPHABET_DATA } from '@/lib/alphabetData'
import Flashcard from '@/components/Flashcard'
import AlphabetQuiz from '@/components/AlphabetQuiz'

type Props = {
  language: string
}

type AlphabetMode = 'flashcard' | 'quiz'

export default function AlphabetSection({ language }: Props) {
  const sets = ALPHABET_DATA[language] || []
  const [activeSet, setActiveSet] = useState(sets[0]?.id || '')
  const [mode, setMode] = useState<AlphabetMode>('flashcard')

  if (sets.length === 0) {
    return (
      <div style={{ padding: 24, textAlign: 'center', color: 'var(--text-muted)' }}>
        Alphabet data coming soon for this language.
      </div>
    )
  }

  const currentSet = sets.find(s => s.id === activeSet) || sets[0]

  return (
    <div className="alphabet-section">

      {/* Script selector */}
      {sets.length > 1 && (
        <div className="alphabet-header">
          {sets.map(set => (
            <button
              key={set.id}
              className={`script-tab ${activeSet === set.id ? 'active' : ''}`}
              onClick={() => setActiveSet(set.id)}
            >
              {set.label}
            </button>
          ))}
        </div>
      )}

      {/* Mode toggle */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10 }}>
        <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
          {currentSet.cards.length} characters
        </div>
        <div className="alphabet-mode-tabs">
          <button
            className={`alphabet-mode-btn ${mode === 'flashcard' ? 'active' : ''}`}
            onClick={() => setMode('flashcard')}
          >
            Flashcards
          </button>
          <button
            className={`alphabet-mode-btn ${mode === 'quiz' ? 'active' : ''}`}
            onClick={() => setMode('quiz')}
          >
            Quiz
          </button>
        </div>
      </div>

      {/* Content */}
      {mode === 'flashcard' ? (
        <Flashcard cards={currentSet.cards} language={language} />
      ) : (
        <AlphabetQuiz cards={currentSet.cards} />
      )}

    </div>
  )
}
