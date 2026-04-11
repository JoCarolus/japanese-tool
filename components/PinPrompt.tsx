'use client'

const PIN_PROMPT_KEY = 'trilingo-pin-prompt-shown'

type Props = {
  onSetPin: () => void
  onDismiss: () => void
}

export default function PinPrompt({ onSetPin, onDismiss }: Props) {
  function handleDismiss() {
    localStorage.setItem(PIN_PROMPT_KEY, 'true')
    onDismiss()
  }

  function handleSetPin() {
    localStorage.setItem(PIN_PROMPT_KEY, 'true')
    onSetPin()
  }

  return (
    <div className="audio-unlock-overlay">
      <div className="audio-unlock-card">
        <div style={{ fontSize: '2rem', marginBottom: 12 }}>🔐</div>
        <h2 className="audio-unlock-title">Set up a PIN</h2>
        <p className="audio-unlock-text">
          You're signed in! Set a 4-digit PIN so you can log in on your phone or any other device without needing your email.
        </p>
        <button
          className="btn-translate"
          style={{ width: '100%', marginTop: 16 }}
          onClick={handleSetPin}
        >
          Set up PIN →
        </button>
        <button className="auth-skip" style={{ marginTop: 10 }} onClick={handleDismiss}>
          Maybe later
        </button>
      </div>
    </div>
  )
}

export function shouldShowPinPrompt(): boolean {
  if (typeof window === 'undefined') return false
  return !localStorage.getItem(PIN_PROMPT_KEY)
}
