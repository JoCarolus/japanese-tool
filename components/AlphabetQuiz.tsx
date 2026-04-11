'use client'

import { useState, useEffect } from 'react'
import { AlphabetCard } from '@/lib/alphabetData'

type Props = {
  cards: AlphabetCard[]
}

type QuizQuestion = {
  card: AlphabetCard
  options: string[]
  correct: string
}

function shuffle<T>(arr: T[]): T[] {
  return [...arr].sort(() => Math.random() - 0.5)
}

function generateQuestions(cards: AlphabetCard[]): QuizQuestion[] {
  return shuffle(cards).slice(0, Math.min(10, cards.length)).map(card => {
    const correct = card.romaji
    const others = shuffle(cards.filter(c => c.romaji !== correct)).slice(0, 3).map(c => c.romaji)
    const options = shuffle([correct, ...others])
    return { card, options, correct }
  })
}

export default function AlphabetQuiz({ cards }: Props) {
  const [questions, setQuestions] = useState<QuizQuestion[]>([])
  const [current, setCurrent] = useState(0)
  const [selected, setSelected] = useState<string | null>(null)
  const [correct, setCorrect] = useState(0)
  const [wrong, setWrong] = useState(0)
  const [done, setDone] = useState(false)

  useEffect(() => {
    setQuestions(generateQuestions(cards))
    setCurrent(0)
    setSelected(null)
    setCorrect(0)
    setWrong(0)
    setDone(false)
  }, [cards])

  if (questions.length === 0) return null

  const q = questions[current]
  const isCorrect = selected === q.correct
  const progress = ((current) / questions.length) * 100

  function handleSelect(option: string) {
    if (selected) return
    setSelected(option)
    if (option === q.correct) {
      setCorrect(c => c + 1)
    } else {
      setWrong(w => w + 1)
    }
    setTimeout(() => {
      if (current + 1 >= questions.length) {
        setDone(true)
      } else {
        setCurrent(c => c + 1)
        setSelected(null)
      }
    }, 900)
  }

  function handleRestart() {
    setQuestions(generateQuestions(cards))
    setCurrent(0)
    setSelected(null)
    setCorrect(0)
    setWrong(0)
    setDone(false)
  }

  if (done) {
    const total = questions.length
    const score = Math.round((correct / total) * 100)
    const scoreColor = score >= 80 ? 'var(--success)' : score >= 50 ? 'var(--warning)' : 'var(--danger)'

    return (
      <div className="quiz-card">
        <div style={{ marginBottom: 20 }}>
          <div style={{ fontSize: '3rem', marginBottom: 8 }}>
            {score >= 80 ? '\u{1F389}' : score >= 50 ? '\u{1F4AA}' : '\u{1F4DA}'}
          </div>
          <div style={{ fontSize: '2rem', fontWeight: 700, color: scoreColor, marginBottom: 4 }}>
            {score}%
          </div>
          <div style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>
            {score >= 80 ? 'Excellent work!' : score >= 50 ? 'Good effort — keep practising!' : 'Keep going — every attempt helps!'}
          </div>
        </div>

        <div className="quiz-score">
          <div className="quiz-score-item">
            <span className="quiz-score-num" style={{ color: 'var(--success)' }}>{correct}</span>
            <span className="quiz-score-label">correct</span>
          </div>
          <div className="quiz-score-item">
            <span className="quiz-score-num" style={{ color: 'var(--danger)' }}>{wrong}</span>
            <span className="quiz-score-label">wrong</span>
          </div>
          <div className="quiz-score-item">
            <span className="quiz-score-num">{total}</span>
            <span className="quiz-score-label">total</span>
          </div>
        </div>

        <button className="btn-translate" onClick={handleRestart}>
          Try again
        </button>
      </div>
    )
  }

  return (
    <div className="quiz-card">
      <div className="quiz-progress">
        <div className="quiz-progress-bar">
          <div className="quiz-progress-fill" style={{ width: `${progress}%` }} />
        </div>
        <span className="quiz-progress-label">{current + 1} / {questions.length}</span>
      </div>

      <div className="quiz-question-char">{q.card.char}</div>
      <div className="quiz-question-label">What is this character?</div>

      <div className="quiz-options">
        {q.options.map(option => {
          let className = 'quiz-option'
          if (selected) {
            if (option === q.correct) className += ' correct'
            else if (option === selected) className += ' wrong'
          }
          return (
            <button
              key={option}
              className={className}
              onClick={() => handleSelect(option)}
              disabled={!!selected}
            >
              {option}
            </button>
          )
        })}
      </div>

      <div className={`quiz-feedback ${selected ? (isCorrect ? 'correct' : 'wrong') : ''}`}>
        {selected ? (isCorrect ? 'Correct!' : `The answer is ${q.correct}`) : ''}
      </div>
    </div>
  )
}
