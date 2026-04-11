'use client'

import { useState, useEffect, useCallback } from 'react'

type Step = {
  target: string
  title: string
  description: string
  position: 'top' | 'bottom'
}

const STEPS: Step[] = [
  {
    target: '.top-tabs',
    title: 'Five ways to learn',
    description: 'EN → Lang translates from English. Lang → EN translates to English. Check tests your own writing. Converse lets you chat with a language bot. Alphabet teaches you the writing system.',
    position: 'bottom',
  },
  {
    target: 'textarea',
    title: 'Type anything here',
    description: 'Enter a word, phrase, or full sentence. We\'ve pre-filled "Hello" so you can see exactly what a result looks like.',
    position: 'bottom',
  },
  {
    target: '.btn-translate',
    title: 'Translate',
    description: 'Hit Translate to get your full breakdown. Press Enter to submit, or Shift+Enter for a new line.',
    position: 'top',
  },
  {
    target: '.result-japanese',
    title: 'Your translation',
    description: 'You get the text in native script, the phonetic reading, and the romanised pronunciation. Use Copy or Play Audio buttons to hear it spoken aloud.',
    position: 'top',
  },
  {
    target: '.result-pronunciation',
    title: 'Pronunciation guide',
    description: 'Every result includes a syllable-by-syllable breakdown, pitch accent pattern, and tips on sounds that are tricky for English speakers.',
    position: 'top',
  },
  {
    target: '.result-breakdown',
    title: 'Word breakdown',
    description: 'Each word is listed separately. Word shows the character as written. Reading shows how to pronounce it phonetically. Meaning is the English translation of that word.',
    position: 'top',
  },
  {
    target: '.result-structure',
    title: 'Sentence structure',
    description: 'A plain English explanation of how the sentence is built — word order, connecting words, and verb form. No textbook jargon.',
    position: 'top',
  },
  {
    target: '.result-tips',
    title: 'Usage tips',
    description: 'Friendly advice on when to use the phrase, easy mistakes to avoid, and related expressions worth knowing.',
    position: 'top',
  },
  {
    target: '.btn-clear',
    title: 'Ready to go!',
    description: 'Hit Clear to wipe the example and start with your own words. Switch to Check to test your writing, Converse to practise chatting, or Alphabet to learn the writing system.',
    position: 'top',
  },
]

type Props = {
  onComplete: () => void
}

export default function TutorialTour({ onComplete }: Props) {
  const [step, setStep] = useState(0)
  const [tooltipPos, setTooltipPos] = useState({ top: 0, left: 0, width: 310 })
  const [highlightPos, setHighlightPos] = useState({ top: 0, left: 0, width: 0, height: 0 })

  const currentStep = STEPS[step]
  const isLast = step === STEPS.length - 1

  const positionTooltip = useCallback(() => {
    const target = document.querySelector(currentStep.target) as HTMLElement
    if (!target) return

    const rect = target.getBoundingClientRect()
    const scrollY = window.scrollY
    const pad = 10
    const tooltipWidth = Math.min(310, window.innerWidth - 32)
    const tooltipHeight = 260

    target.scrollIntoView({ behavior: 'smooth', block: 'center' })

    // Wait for scroll to settle
    setTimeout(() => {
      const freshRect = target.getBoundingClientRect()
      const freshScrollY = window.scrollY

      setHighlightPos({
        top: freshRect.top + freshScrollY - pad,
        left: freshRect.left - pad,
        width: freshRect.width + pad * 2,
        height: freshRect.height + pad * 2,
      })

      let top = 0
      let left = freshRect.left + freshRect.width / 2 - tooltipWidth / 2

      if (currentStep.position === 'bottom') {
        top = freshRect.bottom + freshScrollY + pad + 10
      } else {
        top = freshRect.top + freshScrollY - tooltipHeight - pad - 10
        if (top < freshScrollY + 10) {
          top = freshRect.bottom + freshScrollY + pad + 10
        }
      }

      left = Math.max(16, Math.min(left, window.innerWidth - tooltipWidth - 16))
      top = Math.max(freshScrollY + 10, top)

      setTooltipPos({ top, left, width: tooltipWidth })
    }, 200)
  }, [currentStep])

  useEffect(() => {
    positionTooltip()
    window.addEventListener('resize', positionTooltip)
    return () => window.removeEventListener('resize', positionTooltip)
  }, [positionTooltip])

  function handleNext() {
    if (isLast) {
      onComplete()
    } else {
      setStep(s => s + 1)
    }
  }

  return (
    <>
      <div className="tour-overlay" onClick={onComplete} />

      <div
        className="tour-highlight"
        style={{
          top: highlightPos.top,
          left: highlightPos.left,
          width: highlightPos.width,
          height: highlightPos.height,
        }}
      />

      <div
        className="tour-tooltip"
        style={{
          top: tooltipPos.top,
          left: tooltipPos.left,
          width: tooltipPos.width,
        }}
        onClick={e => e.stopPropagation()}
      >
        <div className="tour-tooltip-header">
          <span className="tour-step-count">{step + 1} / {STEPS.length}</span>
          <button className="tour-skip" onClick={onComplete}>Skip tour</button>
        </div>
        <div className="tour-title">{currentStep.title}</div>
        <div className="tour-description">{currentStep.description}</div>
        <div className="tour-dots">
          {STEPS.map((_, i) => (
            <div key={i} className={`tour-dot ${i === step ? 'active' : ''} ${i < step ? 'done' : ''}`} />
          ))}
        </div>
        <div className="tour-actions">
          {step > 0 && (
            <button className="tour-btn-back" onClick={() => setStep(s => s - 1)}>← Back</button>
          )}
          <button className="tour-btn-next" onClick={handleNext}>
            {isLast ? 'Get started →' : 'Next →'}
          </button>
        </div>
      </div>
    </>
  )
}
