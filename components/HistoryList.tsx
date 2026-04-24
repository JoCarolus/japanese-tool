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
  function handleSelect(item: Translation) {
    onSelect(item)
    // Scroll to top of page so result is visible
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

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
          const translationText = item.japanese_kanji || item.korean || item.chinese || ''
          return (
            <div key={idx} className="history-item" onClick={() => handleSelect(item)}>
              <div className="history-item-content">
                <div className="history-original">{item.input_text}</div>
                <div className="history-translation">
                  <span className="history-translation-text">{translationText}</span>
                  {translationText && <InlineCopyButton text={translationText} />}
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
