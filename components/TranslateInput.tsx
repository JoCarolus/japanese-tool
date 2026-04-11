'use client'

import MicButton from '@/components/MicButton'

type Mode = 'en-to-jp' | 'jp-to-en' | 'check'

type Props = {
  input: string
  intended: string
  mode: Mode
  loading: boolean
  onInputChange: (val: string) => void
  onIntendedChange: (val: string) => void
  onModeChange: (mode: Mode) => void
  onTranslate: () => void
  onClear: () => void
}

export default function TranslateInput({
  input, intended, mode, loading,
  onInputChange, onIntendedChange, onTranslate, onClear,
}: Props) {

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      onTranslate()
    }
  }

  const placeholder =
    mode === 'en-to-jp' ? 'Type an English word, phrase, or sentence...' :
    mode === 'jp-to-en' ? 'Type or speak Japanese to translate...' :
    'Type or speak your Japanese attempt here...'

  const btnLabel = mode === 'check' ? 'Check my Japanese' : 'Translate'
  const showMic = mode === 'jp-to-en' || mode === 'check'

  function handleMicResult(displayText: string, _japaneseOnly: string) {
    onInputChange(displayText)
  }

  return (
    <div className="input-area">
      {/* No mode tabs here — handled by top-level tabs in page.tsx */}

      {mode === 'check' && (
        <div className="check-intended-block">
          <label className="check-intended-label">
            What were you trying to say? (in English)
          </label>
          <textarea
            value={intended}
            onChange={(e) => onIntendedChange(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="e.g. I am hungry"
            rows={2}
          />
        </div>
      )}

      <div className="input-with-mic">
        <textarea
          value={input}
          onChange={(e) => onInputChange(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          rows={3}
        />
        {showMic && (
          <div className="mic-btn-wrapper">
            <MicButton
              onResult={handleMicResult}
              language="ja-JP"
            />
          </div>
        )}
      </div>

      <div className="controls">
        <button
          className="btn-translate"
          onClick={onTranslate}
          disabled={loading}
        >
          {loading ? 'Working...' : btnLabel}
        </button>
        <button className="btn-clear" onClick={onClear}>Clear</button>
        <span className="hint">Enter to submit \u00b7 Shift+Enter for new line</span>
      </div>
    </div>
  )
}
