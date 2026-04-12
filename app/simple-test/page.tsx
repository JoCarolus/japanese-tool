// app/simple-test/page.tsx
'use client'

import { useState, useRef, useEffect } from 'react'

export default function SimpleTest() {
  const [isPlaying, setIsPlaying] = useState(false)
  const [error, setError] = useState('')
  const [logs, setLogs] = useState<string[]>([])
  const [isMounted, setIsMounted] = useState(false)
  const audioRef = useRef<HTMLAudioElement | null>(null)

  // Force component to mount on client side
  useEffect(() => {
    setIsMounted(true)
    addLog('✅ Page loaded successfully on mobile')
  }, [])

  const addLog = (msg: string) => {
    console.log(msg)
    setLogs(prev => [...prev, `${new Date().toLocaleTimeString()}: ${msg}`])
  }

  const playAudio = async (text: string, lang: string) => {
    addLog(`🔵 Button clicked: text="${text}", lang=${lang}`)
    setError('')
    
    try {
      const url = `/api/tts?text=${encodeURIComponent(text)}&lang=${lang}`
      addLog(`📡 Fetching: ${url}`)
      
      const response = await fetch(url)
      addLog(`📡 Response status: ${response.status}`)
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`)
      }
      
      const blob = await response.blob()
      addLog(`📦 Audio blob size: ${blob.size} bytes`)
      
      const audioUrl = URL.createObjectURL(blob)
      
      if (audioRef.current) {
        audioRef.current.pause()
        audioRef.current = null
      }
      
      const audio = new Audio(audioUrl)
      audioRef.current = audio
      
      audio.onplay = () => {
        addLog(`🔊 Audio started playing`)
        setIsPlaying(true)
      }
      
      audio.onended = () => {
        addLog(`🔇 Audio ended`)
        setIsPlaying(false)
        URL.revokeObjectURL(audioUrl)
      }
      
      audio.onerror = (e) => {
        addLog(`❌ Audio error: ${e}`)
        setIsPlaying(false)
        setError('Audio playback failed')
      }
      
      addLog(`▶️ Calling audio.play()...`)
      await audio.play()
      addLog(`✅ audio.play() succeeded`)
      
    } catch (err) {
      const errMsg = err instanceof Error ? err.message : String(err)
      addLog(`❌ Error: ${errMsg}`)
      setError(errMsg)
      setIsPlaying(false)
    }
  }

  const stopAudio = () => {
    addLog(`🛑 Stop called`)
    if (audioRef.current) {
      audioRef.current.pause()
      audioRef.current = null
    }
    setIsPlaying(false)
  }

  // Don't render until mounted on client
  if (!isMounted) {
    return <div style={{ padding: 20 }}>Loading...</div>
  }

  return (
    <div style={{ padding: 20, fontFamily: 'sans-serif', maxWidth: 600, margin: '0 auto' }}>
      <h1>🔊 Simple Audio Test</h1>
      <p>This page tests the TTS API directly without any complex components.</p>
      
      <div style={{ background: '#f0f0f0', padding: 15, borderRadius: 8, margin: '20px 0', maxHeight: 300, overflow: 'auto', fontSize: 12 }}>
        <strong>Logs:</strong><br />
        {logs.length === 0 ? 'Click a button below...' : logs.map((log, i) => (
          <div key={i} style={{ borderTop: '1px solid #ddd', padding: '4px 0', fontFamily: 'monospace' }}>{log}</div>
        ))}
      </div>
      
      {error && (
        <div style={{ background: '#ffebee', padding: 10, borderRadius: 8, margin: '10px 0', color: '#c62828' }}>
          ❌ Error: {error}
        </div>
      )}
      
      <div style={{ display: 'flex', flexDirection: 'column', gap: 15, marginTop: 20 }}>
        <button 
          onClick={() => playAudio('こんにちは', 'ja-JP')}
          style={{ padding: '15px', fontSize: 18, backgroundColor: '#4CAF50', color: 'white', border: 'none', borderRadius: 8 }}
        >
          🇯🇵 Japanese: こんにちは
        </button>
        
        <button 
          onClick={() => playAudio('안녕하세요', 'ko-KR')}
          style={{ padding: '15px', fontSize: 18, backgroundColor: '#2196F3', color: 'white', border: 'none', borderRadius: 8 }}
        >
          🇰🇷 Korean: 안녕하세요
        </button>
        
        <button 
          onClick={() => playAudio('你好', 'zh-CN')}
          style={{ padding: '15px', fontSize: 18, backgroundColor: '#FF9800', color: 'white', border: 'none', borderRadius: 8 }}
        >
          🇨🇳 Chinese: 你好
        </button>
        
        {isPlaying && (
          <button 
            onClick={stopAudio}
            style={{ padding: '15px', fontSize: 18, backgroundColor: '#f44336', color: 'white', border: 'none', borderRadius: 8 }}
          >
            ■ Stop
          </button>
        )}
      </div>
    </div>
  )
}