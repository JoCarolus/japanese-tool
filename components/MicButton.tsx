'use client'

import { useEffect, useState } from 'react'
import { useSpeechInput } from '@/lib/useSpeechInput'

type Props = {
  onResult: (displayText: string, japaneseOnly: string) => void
  language?: string
}

export default function MicButton({ onResult, language = 'ja-JP' }: Props) {
  const [mounted, setMounted] = useState(false)
  const [converting, setConverting] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  async function handleTranscript(japanese: string) {
    // Show Japanese immediately while we fetch romaji
    onResult(japanese, japanese)
    setConverting(true)

    try {
      const res = await fetch('/api/romaji', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ japanese }),
      })
      const data = await res.json()

      if (data.romaji) {
        // Update display to show romaji + Japanese
        onResult(`${data.romaji} (${japanese})`, japanese)
      }
    } catch {
      // Keep Japanese only if romaji fetch fails
    } finally {
      setConverting(false)
    }
  }

  const { listening, supported, toggle } = useSpeechInput({
    onResult: handleTranscript,
    language,
  })

  if (!mounted || !supported) return null

  return (
    <button
      type="button"
      className={`mic-btn ${listening ? 'listening' : ''} ${converting ? 'converting' : ''}`}
      onClick={toggle}
      title={listening ? 'Stop listening' : 'Speak in Japanese'}
    >
      {listening ? (
        <span className="mic-wave">
          <span></span><span></span><span></span>
        </span>
      ) : converting ? (
        <span className="mic-converting">...</span>
      ) : (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 1a4 4 0 0 1 4 4v7a4 4 0 0 1-8 0V5a4 4 0 0 1 4-4zm0 2a2 2 0 0 0-2 2v7a2 2 0 0 0 4 0V5a2 2 0 0 0-2-2zm7 8a1 1 0 0 1 1 1 8 8 0 0 1-7 7.938V22h2a1 1 0 0 1 0 2H9a1 1 0 0 1 0-2h2v-2.062A8 8 0 0 1 4 12a1 1 0 0 1 2 0 6 6 0 0 0 12 0 1 1 0 0 1 1-1z"/>
        </svg>
      )}
    </button>
  )
}
