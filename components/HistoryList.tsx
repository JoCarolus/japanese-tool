'use client'

import { useState } from 'react'
import { Translation } from '@/lib/supabase'

type Props = {
  history: Translation[]
  onSelect: (result: any) => void
  onClear: () => void
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

export default function HistoryList({ history, onSelect, onClear }: Props) {
  if (history.length === 0) {
    return (
      <div className="history-section">
        <div className="history-header">
          <div className="history-title">Recent Translations</div>
        </div>
        <div style={{ textAlign: 'center', padding: '20px', color: 'var(--text-muted)' }}>
          No translations yet. Try translating something!
        </div>
      </div>
    )
  }

  return (
    <div className="history-section">
      <div className="history-header">
        <div className="history-title">Recent Translations</div>
        <button className="btn-clear-history" onClick={onClear}>
          Clear all
        </button>
      </div>
      <div className="history-list">
        {history.map((item, idx) => {
          // Get the translation text based on what's available
          const translationText = item.japanese_kanji || item.korean || item.chinese || ''
          
          return (
            <div key={idx} className="history-item" onClick={() => onSelect(item)}>
              <div className="history-item-content">
                <div className="history-original">{item.input_text}</div>
                <div className="history-translation">
                  <span className="history-translation-text">{translationText}</span>
                  <InlineCopyButton text={translationText} />
                </div>
              </div>
              <div className="history-arrow">→</div>
            </div>
          )
        })}
      </div>
    </div>
  )
}