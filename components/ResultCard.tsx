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
  const { isPlaying, usingFallback, speak, stop } = useAudioPlayer();

  const handleSpeak = () => {
    const text = result.japanese_kanji || result.korean || result.chinese || '';
    if (!text) return;

    const langCode = result.japanese_kanji
      ? 'ja-JP'
      : result.korean
      ? 'ko-KR'
      : 'zh-CN';

    speak(text, langCode);
  };

  const handleStop = () => {
    stop();
  };

  // Show a small indicator when using fallback
  const buttonText = () => {
    if (isPlaying) return '\u25a0 Stop';
    if (usingFallback) return '\u25b6 Play (Cloud)';
    return '\u25b6 Play Audio';
  };

  return (
    <div className="result-card">
      {/* ... rest of your JSX remains the same ... */}
      
      <div className="result-section result-japanese">
        {/* ... Japanese content ... */}
        
        <button
          className={'play-btn ' + (isPlaying ? 'playing' : '')}
          style={{ marginTop: 12 }}
          onClick={isPlaying ? handleStop : handleSpeak}
        >
          {buttonText()}
        </button>
        {usingFallback && isPlaying && (
          <div style={{ fontSize: '12px', marginTop: '4px', color: '#666' }}>
            Using cloud audio for reliability
          </div>
        )}
      </div>
      
      {/* ... rest of your component ... */}
    </div>
  );
}