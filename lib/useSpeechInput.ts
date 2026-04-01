'use client'

import { useState, useRef, useCallback } from 'react'

type UseSpeechInputOptions = {
  onResult: (text: string) => void
  language?: string
}

export function useSpeechInput({ onResult, language = 'ja-JP' }: UseSpeechInputOptions) {
  const [listening, setListening] = useState(false)
  const [supported, setSupported] = useState(true)
  const recognitionRef = useRef<any>(null)

  const start = useCallback(() => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition

    if (!SpeechRecognition) {
      setSupported(false)
      return
    }

    if (recognitionRef.current) {
      recognitionRef.current.stop()
    }

    const recognition = new SpeechRecognition()
    recognition.lang = language
    recognition.continuous = false
    recognition.interimResults = false
    recognition.maxAlternatives = 1

    recognition.onstart = () => setListening(true)

    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript
      onResult(transcript)
    }

    recognition.onerror = () => {
      setListening(false)
    }

    recognition.onend = () => {
      setListening(false)
    }

    recognitionRef.current = recognition
    recognition.start()
  }, [onResult, language])

  const stop = useCallback(() => {
    if (recognitionRef.current) {
      recognitionRef.current.stop()
    }
    setListening(false)
  }, [])

  const toggle = useCallback(() => {
    if (listening) {
      stop()
    } else {
      start()
    }
  }, [listening, start, stop])

  return { listening, supported, toggle }
}
