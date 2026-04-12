'use client'

import { useState } from 'react'
import { TranslationResult } from '@/lib/supabase'
import { useAudioPlayer } from '@/hooks/useAudioPlayer'

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
  const { isPlaying, speak, stop } = useAudioPlayer();

  const handleSpeak = async () => {
    const text = result.japanese_kanji || result.korean || result.chinese || '';
    if (!text) return;

    const langCode = result.japanese_kanji
      ? 'ja-JP'
      : result.korean
      ? 'ko-KR'
      : 'zh-CN';

    if (isPlaying) {
      stop();
    } else {
      await speak(text, langCode);
    }
  };

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
          className={'play-btn ' + (isPlaying ? 'playing' : '')}
          style={{ marginTop: 12 }}
          onClick={handleSpeak}
        >
          {isPlaying ? '\u25a0 Stop' : '\u25b6 Play Audio'}
        </button>
      </div>

      {/* Rest of your component (pronunciation, breakdown, structure, tips sections) */}
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
  );
}