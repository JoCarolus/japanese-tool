'use client'

import { useState } from 'react'
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
      {copied ? '✓' : 'Copy'}
    </button>
  )
}

export default function ResultCard({ result }: Props) {
  const [speaking, setSpeaking] = useState(false)

  const handleSpeak = () => {
    if (!window.speechSynthesis) return
    window.speechSynthesis.cancel()
    const utterance = new SpeechSynthesisUtterance(result.japanese_kanji)
    utterance.lang = 'ja-JP'
    utterance.rate = 0.85
    const voices = window.speechSynthesis.getVoices()
    const japaneseVoice = voices.find(v => v.lang.startsWith('ja'))
    if (japaneseVoice) utterance.voice = japaneseVoice
    utterance.onstart = () => setSpeaking(true)
    utterance.onend = () => setSpeaking(false)
    utterance.onerror = () => setSpeaking(false)
    window.speechSynthesis.speak(utterance)
  }

  const handleStop = () => {
    window.speechSynthesis.cancel()
    setSpeaking(false)
  }

  return (
    <div className="result-card">

      {/* English */}
      <div className="result-section">
        <div className="section-label">English</div>
        <div className="english-text">{result.english}</div>
      </div>

      {/* Japanese */}
      <div className="result-section result-japanese">
        <div className="section-label">Japanese</div>
        <div className="japanese-block">

          {/* Kanji line */}
          <div className="japanese-line">
            <div className="japanese-kanji">{result.japanese_kanji}</div>
            <InlineCopyButton text={result.japanese_kanji} />
          </div>

          {/* Kana line */}
          {result.japanese_kana && (
            <div className="japanese-line">
              <div className="japanese-kana">Reading: {result.japanese_kana}</div>
              <InlineCopyButton text={result.japanese_kana} />
            </div>
          )}

          {/* Romaji line */}
          {result.japanese_romaji && (
            <div className="japanese-line">
              <div className="japanese-romaji">Romaji: {result.japanese_romaji}</div>
              <InlineCopyButton text={result.japanese_romaji} />
            </div>
          )}

        </div>

        {/* Audio button on its own line below */}
        <button
          className={`play-btn ${speaking ? 'playing' : ''}`}
          style={{ marginTop: 12 }}
          onClick={speaking ? handleStop : handleSpeak}
        >
          {speaking ? '■ Stop' : '▶ Play Audio'}
        </button>
      </div>

      {/* Pronunciation */}
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

      {/* Word Breakdown */}
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

      {/* Sentence Structure */}
      {result.structure && (
        <div className="result-section result-structure">
          <div className="section-label">Sentence Structure</div>
          <div
            className="structure-content"
            dangerouslySetInnerHTML={{ __html: result.structure }}
          />
        </div>
      )}

      {/* Usage Tips */}
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
