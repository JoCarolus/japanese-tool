'use client'

import ThemeToggle from '@/components/ThemeToggle'

type Language = 'japanese' | 'korean' | 'chinese'

type Props = {
  onSelect: (lang: Language) => void
  theme: 'light' | 'dark'
  onToggleTheme: () => void
}

const LANGUAGES = [
  { id: 'japanese' as Language, name: 'Japanese', script: '日本語', desc: 'Hiragana, Katakana & Kanji' },
  { id: 'korean' as Language, name: 'Korean', script: '한국어', desc: 'Hangul alphabet' },
  { id: 'chinese' as Language, name: 'Chinese', script: '中文', desc: 'Mandarin & characters' },
]

export default function LanguageSelect({ onSelect, theme, onToggleTheme }: Props) {
  return (
    <div className="lang-select-screen">
      <div style={{ position: 'absolute', top: 16, right: 16 }}>
        <ThemeToggle theme={theme} onToggle={onToggleTheme} />
      </div>

      <div className="lang-select-header">
        <img
          src="/icon-512.png"
          alt="Trilingo"
          className="lang-select-logo-img"
        />
        <h1 className="lang-select-title">
          Tri<span>lingo</span>
        </h1>
        <p className="lang-select-subtitle">
          Learn Japanese, Korean, and Chinese — translate, check your writing, practise conversations, and master the alphabet.
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
            <div className="lang-card-text">
              <div className="lang-card-name">{lang.name}</div>
              <div className="lang-card-desc">{lang.desc}</div>
            </div>
          </button>
        ))}
      </div>
    </div>
  )
}
