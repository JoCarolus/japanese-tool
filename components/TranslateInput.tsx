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
  onInputChange, onIntendedChange, onModeChange, onTranslate, onClear,
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

  // When mic returns result, store display text in input
  // but we need to track the Japanese-only version for sending
  function handleMicResult(displayText: string, _japaneseOnly: string) {
    onInputChange(displayText)
  }

  return (
    <div className="input-area">
      <div className="mode-tabs">
        <button
          className={`mode-tab ${mode === 'en-to-jp' ? 'active' : ''}`}
          onClick={() => onModeChange('en-to-jp')}
        >
          EN → JP
        </button>
        <button
          className={`mode-tab ${mode === 'jp-to-en' ? 'active' : ''}`}
          onClick={() => onModeChange('jp-to-en')}
        >
          JP → EN
        </button>
        <button
          className={`mode-tab ${mode === 'check' ? 'active' : ''}`}
          onClick={() => onModeChange('check')}
        >
          Check
        </button>
      </div>

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
        <span className="hint">Enter to submit · Shift+Enter for new line</span>
      </div>
    </div>
  )
}
