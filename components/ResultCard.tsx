'use client'

import { useState, useEffect, useRef } from 'react'
import { TranslationResult } from '@/lib/supabase'

type Props = {
  result: TranslationResult
}

function InlineCopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false)
  function handleCopy() {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    })
  }
  return (
    <button className="inline-copy-btn" onClick={handleCopy}>
      {copied ? '\u2713' : 'Copy'}
    </button>
  )
}

export default function ResultCard({ result }: Props) {
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

  function getVoice(langCode: string) {
    const voices = voicesRef.current.length
      ? voicesRef.current
      : window.speechSynthesis.getVoices()
    return voices.find(v => v.lang.startsWith(langCode)) || null
  }

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

  const handleSpeak = () => {
    if (!window.speechSynthesis) return
    
    // Initialize audio on first user interaction
    if (!audioInitialized) {
      initAudio()
      setTimeout(handleSpeak, 100)
      return
    }
    
    window.speechSynthesis.cancel()

    const text = result.japanese_kanji || result.korean || result.chinese || ''
    if (!text) return

    const langCode = result.japanese_kanji
      ? 'ja-JP'
      : result.korean
      ? 'ko-KR'
      : 'zh-CN'

    const langPrefix = result.japanese_kanji
      ? 'ja'
      : result.korean
      ? 'ko'
      : 'zh'

    const utterance = new SpeechSynthesisUtterance(text)
    utterance.lang = langCode
    utterance.rate = 0.85

    const voice = getVoice(langPrefix)
    if (voice) utterance.voice = voice

    utterance.onstart = () => setSpeaking(true)
    utterance.onend = () => setSpeaking(false)
    utterance.onerror = () => setSpeaking(false)

    // REMOVED: setSpeaking(true) - this was causing race conditions
    window.speechSynthesis.speak(utterance)
  }

  const handleStop = () => {
    window.speechSynthesis.cancel()
    setSpeaking(false)
  }

  return (
    <div className="result-card">

      <div className="result-section">
        <div className="section-label">English</div>
        <div className="english-text">{result.english}</div>
      </div>

      <div className="result-section result-japanese">
        <div className="section-label">Japanese</div>
        <div className="japanese-block">

          <div className="japanese-line">
            <div className="japanese-kanji">{result.japanese_kanji}</div>
            <InlineCopyButton text={result.japanese_kanji} />
          </div>

          {result.japanese_kana && (
            <div className="japanese-line">
              <div className="japanese-kana">Reading: {result.japanese_kana}</div>
              <InlineCopyButton text={result.japanese_kana} />
            </div>
          )}

          {result.japanese_romaji && (
            <div className="japanese-line">
              <div className="japanese-romaji">Romaji: {result.japanese_romaji}</div>
              <InlineCopyButton text={result.japanese_romaji} />
            </div>
          )}

        </div>

        <button
          className={'play-btn ' + (speaking ? 'playing' : '')}
          style={{ marginTop: 12 }}
          onClick={speaking ? handleStop : handleSpeak}
        >
          {speaking ? '\u25a0 Stop' : '\u25b6 Play Audio'}
        </button>
      </div>

      {(result.syllable_breakdown || result.pitch_accent || result.pronunciation_tips) && (
        <div className="result-section result-pronunciation">
          <div className="section-label">Pronunciation</div>
          {result.syllable_breakdown && (
            <div className="pronunciation-block">
              <div className="pronunciation-label">Syllable breakdown</div>
              <div className="syllable-text">{result.syllable_breakdown}</div>
            </div>
          )}
          {result.pitch_accent && (
            <div className="pronunciation-block">
              <div className="pronunciation-label">Pitch accent</div>
              <div className="structure-content">{result.pitch_accent}</div>
            </div>
          )}
          {result.pronunciation_tips && (
            <div className="pronunciation-block">
              <div className="pronunciation-label">Tips for English speakers</div>
              <div className="structure-content">{result.pronunciation_tips}</div>
            </div>
          )}
        </div>
      )}

      {result.breakdown?.length > 0 && (
        <div className="result-section result-breakdown">
          <div className="section-label">Word Breakdown</div>
          <table className="breakdown-table">
            <thead>
              <tr>
                <th>Word</th>
                <th>Reading</th>
                <th>Meaning</th>
                <th>Role</th>
              </tr>
            </thead>
            <tbody>
              {result.breakdown.map((row, i) => (
                <tr key={i}>
                  <td className="jp">{row.word}</td>
                  <td className="reading">{row.reading}</td>
                  <td className="meaning">{row.meaning}</td>
                  <td className="role">{row.role}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {result.structure && (
        <div className="result-section result-structure">
          <div className="section-label">Sentence Structure</div>
          <div
            className="structure-content"
            dangerouslySetInnerHTML={{ __html: result.structure }}
          />
        </div>
      )}

      {result.tips && (
        <div className="result-section result-tips">
          <div className="section-label">Usage Tips</div>
          <div
            className="structure-content"
            dangerouslySetInnerHTML={{ __html: result.tips }}
          />
        </div>
      )}
    </div>
  )
}