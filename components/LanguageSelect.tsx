'use client'

import ThemeToggle from '@/components/ThemeToggle'

type Language = 'japanese' | 'korean' | 'chinese'

type Props = {
  onSelect: (lang: Language) => void
  theme: 'light' | 'dark'
  onToggleTheme: () => void
}

const LANGUAGES = [
  {
    id: 'japanese' as Language,
    name: 'Japanese',
    script: '\u65e5\u672c\u8a9e',
    desc: 'Hiragana, Katakana & Kanji',
  },
  {
    id: 'korean' as Language,
    name: 'Korean',
    script: '\ud55c\uad6d\uc5b4',
    desc: 'Hangul alphabet',
  },
  {
    id: 'chinese' as Language,
    name: 'Chinese',
    script: '\u4e2d\u6587',
    desc: 'Mandarin & characters',
  },
]

export default function LanguageSelect({ onSelect, theme, onToggleTheme }: Props) {
  return (
    <div className="lang-select-screen">
      <div style={{ position: 'absolute', top: 16, right: 16 }}>
        <ThemeToggle theme={theme} onToggle={onToggleTheme} />
      </div>

      <div className="lang-select-header">
        <div className="lang-select-logo">\uD83C\uDF0F</div>
        <h1 className="lang-select-title">
          Learn a <span>Language</span>
        </h1>
        <p className="lang-select-subtitle">
          Translate, check your writing, practise conversations, and learn the alphabet.
        </p>
      </div>

      <div className="lang-grid">
        {LANGUAGES.map(lang => (
          <button
            key={lang.id}
            className="lang-card"
            onClick={() => onSelect(lang.id)}
          >
            <div className="lang-card-script">{lang.script}</div>
            <div className="lang-card-name">{lang.name}</div>
            <div className="lang-card-desc">{lang.desc}</div>
          </button>
        ))}
      </div>
    </div>
  )
}
