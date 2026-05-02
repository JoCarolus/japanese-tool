'use client'

import { useState, useEffect } from 'react'

const SPEED_KEY = 'trilingo-tts-speed'

const SPEEDS = [
  { label: 'Normal', value: '0%' },
  { label: 'Slow', value: '-25%' },
  { label: 'Slower', value: '-50%' },
]

export default function SpeedToggle() {
  const [speed, setSpeed] = useState('0%')

  useEffect(() => {
    const saved = localStorage.getItem(SPEED_KEY)
    if (saved) setSpeed(saved)
  }, [])

  function handleChange(value: string) {
    setSpeed(value)
    localStorage.setItem(SPEED_KEY, value)
  }

  return (
    <div className="speed-toggle" title="Audio playback speed">
      <span className="speed-label">Speed</span>
      <div className="speed-options">
        {SPEEDS.map(s => (
          <button
            key={s.value}
            className={`speed-btn ${speed === s.value ? 'active' : ''}`}
            onClick={() => handleChange(s.value)}
          >
            {s.label}
          </button>
        ))}
      </div>
    </div>
  )
}
