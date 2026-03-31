'use client'

import { useState, useEffect, useCallback } from 'react'

type Step = {
  target: string
  title: string
  description: string
  position: 'top' | 'bottom'
  tab?: 'en-to-jp' | 'check' | 'converse'
}

const STEPS: Step[] = [
  {
    target: '.top-tabs',
    title: 'Four ways to learn',
    description: 'EN → JP and JP → EN translate for you. Check lets you test your own Japanese writing. Converse lets you have a full practice conversation with a bot.',
    position: 'bottom',
  },
  {
    target: 'textarea',
    title: 'Type anything here',
    description: 'Enter a word, phrase, or full sentence. We\'ve pre-filled "Hello" so you can see what a result looks like.',
    position: 'bottom',
  },
  {
    target: '.btn-translate',
    title: 'Translate',
    description: 'Hit Translate to get your full breakdown. On desktop you can also press Ctrl+Enter.',
    position: 'top',
  },
  {
    target: '.result-japanese',
    title: 'Japanese output',
    description: 'You get the Japanese written out, how to read it in hiragana, and the romaji pronunciation. Use Copy or Play Audio to hear it spoken aloud.',
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
    description: 'Each word in the sentence is listed separately. Word shows the Japanese character as it\'s written. Reading shows how to pronounce it in hiragana. Meaning is the English translation of that individual word. The Reading column is most useful when the Word column contains kanji, because kanji don\'t tell you their pronunciation on their own.',
    position: 'top',
  },
  {
    target: '.result-structure',
    title: 'Sentence structure',
    description: 'Japanese grammar works very differently to English. This section explains the word order, any connector words (called particles), the verb form, and how formal or casual the sentence is.',
    position: 'top',
  },
  {
    target: '.result-tips',
    title: 'Usage tips',
    description: 'Practical friendly advice on when to use the phrase, easy mistakes to avoid, and related expressions to help you learn more.',
    position: 'top',
  },
  {
    target: '.btn-clear',
    title: 'Clear and start fresh',
    description: 'Hit Clear to wipe the example and start translating your own words. Your history is saved automatically at the bottom of the page.',
    position: 'top',
  },
]

type Props = {
  onComplete: () => void
}

export default function TutorialTour({ onComplete }: Props) {
  const [step, setStep] = useState(0)
  const [tooltipPos, setTooltipPos] = useState({ top: 0, left: 0, width: 300 })
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
    const tooltipHeight = 240

    target.scrollIntoView({ behavior: 'smooth', block: 'center' })

    setHighlightPos({
      top: rect.top + scrollY - pad,
      left: rect.left - pad,
      width: rect.width + pad * 2,
      height: rect.height + pad * 2,
    })

    let top = 0
    let left = rect.left + rect.width / 2 - tooltipWidth / 2

    if (currentStep.position === 'bottom') {
      top = rect.bottom + scrollY + pad + 10
    } else {
      top = rect.top + scrollY - tooltipHeight - pad - 10
    }

    left = Math.max(16, Math.min(left, window.innerWidth - tooltipWidth - 16))
    top = Math.max(scrollY + 16, top)

    setTooltipPos({ top, left, width: tooltipWidth })
  }, [currentStep])

  useEffect(() => {
    const t = setTimeout(positionTooltip, 100)
    window.addEventListener('resize', positionTooltip)
    return () => { clearTimeout(t); window.removeEventListener('resize', positionTooltip) }
  }, [positionTooltip])

  return (
    <>
      <div className="tour-overlay" onClick={onComplete} />
      <div className="tour-highlight" style={highlightPos} />
      <div
        className="tour-tooltip"
        style={{ top: tooltipPos.top, left: tooltipPos.left, width: tooltipPos.width }}
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
          <button className="tour-btn-next" onClick={() => isLast ? onComplete() : setStep(s => s + 1)}>
            {isLast ? 'Get started →' : 'Next →'}
          </button>
        </div>
      </div>
    </>
  )
}
