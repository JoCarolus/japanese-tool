'use client'

import MicButton from '@/components/MicButton'

type Mode = 'en-to-lang' | 'lang-to-en' | 'check'

type Props = {
  input: string
  intended: string
  mode: Mode
  language: string
  loading: boolean
  onInputChange: (val: string) => void
  onIntendedChange: (val: string) => void
  onModeChange: (mode: Mode) => void
  onTranslate: () => void
  onClear: () => void
}

const LANG_CODES: Record<string, string> = {
  japanese: 'ja-JP',
  korean: 'ko-KR',
  chinese: 'zh-CN',
}

export default function TranslateInput({
  input, intended, mode, language, loading,
  onInputChange, onIntendedChange, onTranslate, onClear,
}: Props) {

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      onTranslate()
    }
  }

  const placeholder =
    mode === 'en-to-lang' ? 'Type an English word, phrase, or sentence...' :
    mode === 'lang-to-en' ? 'Type or speak to translate...' :
    'Type or speak your attempt here...'

  const btnLabel = mode === 'check' ? 'Check my writing' : 'Translate'
  const showMic = mode === 'lang-to-en' || mode === 'check'
  const micLang = LANG_CODES[language] || 'ja-JP'

  function handleMicResult(displayText: string) {
    onInputChange(displayText)
  }

  return (
    <div className="input-area">
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
              onResult={(displayText) => handleMicResult(displayText)}
              language={micLang}
            />
          </div>
        )}
      </div>

      <div className="controls">
        <button className="btn-translate" onClick={onTranslate} disabled={loading}>
          {loading ? 'Working...' : btnLabel}
        </button>
        <button className="btn-clear" onClick={onClear}>Clear</button>
        <span className="hint">Enter to submit \u00b7 Shift+Enter for new line</span>
      </div>
    </div>
  )
}
