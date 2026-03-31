'use client'

import { Translation, TranslationResult } from '@/lib/supabase'

type Props = {
  history: Translation[]
  onSelect: (result: TranslationResult) => void
  onClear: () => void
}

export default function HistoryList({ history, onSelect, onClear }: Props) {
  if (history.length === 0) return null

  return (
    <div className="history-section">
      <div className="history-header">
        <span className="history-title">Recent Translations</span>
        <button className="btn-clear-history" onClick={onClear}>
          Clear history
        </button>
      </div>
      <div className="history-list">
        {history.map((item) => {
          const { id, input_text, direction, created_at, ...result } = item
          return (
            <div
              key={item.id}
              className="history-item"
              onClick={() => onSelect(result)}
            >
              <span className="orig">{item.input_text}</span>
              <span className="jp-preview">{item.japanese_kanji}</span>
            </div>
          )
        })}
      </div>
    </div>
  )
}
