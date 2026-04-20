'use client'

import { useState } from 'react'
import { TranslationResult } from '@/lib/supabase'
import { useAudioPlayer } from '@/hooks/useAudioPlayer'

type Props = {
  result: TranslationResult
  targetLanguage?: 'japanese' | 'korean' | 'chinese'
}

function InlineCopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false)
  function handleCopy() {
    if (!text) return
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    })
  }
  return (
    <button className="inline-copy-btn" onClick={handleCopy} disabled={!text}>
      {copied ? '✓' : 'Copy'}
    </button>
  )
}

export default function ResultCard({ result, targetLanguage }: Props) {
  const { isPlaying, isLoading, speak, stop } = useAudioPlayer();

  // Determine which language is being displayed
  const getDisplayLanguage = () => {
    if (targetLanguage === 'korean') return 'Korean'
    if (targetLanguage === 'chinese') return 'Chinese'
    if (targetLanguage === 'japanese') return 'Japanese'
    // Fallback to detection from result
    if (result.korean) return 'Korean'
    if (result.chinese) return 'Chinese'
    return 'Japanese'
  }

  // Get the main translation text
  const getMainText = () => {
    if (targetLanguage === 'korean') return result.korean || ''
    if (targetLanguage === 'chinese') return result.chinese || ''
    return result.japanese_kanji || result.korean || result.chinese || ''
  }

  const handlePlay = async () => {
    // Use targetLanguage prop directly — never detect from characters
    // Japanese kanji and Chinese characters share the same Unicode range
    const langCode =
      targetLanguage === 'korean' ? 'ko-KR' :
      targetLanguage === 'chinese' ? 'zh-CN' :
      'ja-JP';

    const text =
      targetLanguage === 'korean' ? (result.korean || result.japanese_kanji || '') :
      targetLanguage === 'chinese' ? (result.chinese || result.japanese_kanji || '') :
      (result.japanese_kanji || result.japanese_kana || '');

    if (!text) return;
    await speak(text, langCode);
  };

  const handleStop = () => {
    stop();
  };

  // SVG Icons
  const PlayIcon = () => (
    <svg width="12" height="14" viewBox="0 0 24 24" fill="currentColor" style={{ marginRight: 6, marginBottom: -1 }}>
      <polygon points="5,3 19,12 5,21" />
    </svg>
  )

  const StopIcon = () => (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" style={{ marginRight: 6, marginBottom: -1 }}>
      <rect x="4" y="4" width="16" height="16" rx="2" />
    </svg>
  )

  const mainText = getMainText()
  const displayLanguage = getDisplayLanguage()

  return (
    <div className="result-card">
      <div className="result-section">
        <div className="section-label">English</div>
        <div className="english-text">{result.english}</div>
      </div>

      <div className="result-section result-japanese">
        <div className="section-label">{displayLanguage}</div>
        <div className="japanese-block">
          <div className="japanese-line">
            <div className="japanese-kanji">{mainText || '—'}</div>
            <InlineCopyButton text={mainText} />
          </div>

          {(result.japanese_kana || result.japanese_romaji) && (
            <>
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
            </>
          )}
        </div>

        <button
          className={'play-btn ' + (isPlaying ? 'playing' : '')}
          style={{ marginTop: 12 }}
          onClick={isPlaying ? handleStop : handlePlay}
          disabled={isLoading || !mainText}
        >
          {isLoading ? (
            '⏳ Loading...'
          ) : isPlaying ? (
            <>
              <StopIcon />
              Stop
            </>
          ) : (
            <>
              <PlayIcon />
              Play Audio
            </>
          )}
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

      {result.breakdown && result.breakdown.length > 0 && (
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
  );
}