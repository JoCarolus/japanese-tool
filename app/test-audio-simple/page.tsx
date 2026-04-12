// app/test-audio-simple/page.tsx
'use client';

import { useState } from 'react';

export default function SimpleAudioTest() {
  const [isPlaying, setIsPlaying] = useState(false);
  const [error, setError] = useState('');

  const playAudio = async (text: string, lang: string) => {
    setError('');
    setIsPlaying(true);
    
    try {
      const response = await fetch(`/api/tts?text=${encodeURIComponent(text)}&lang=${lang}`);
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const audio = new Audio(url);
      
      audio.onended = () => {
        URL.revokeObjectURL(url);
        setIsPlaying(false);
      };
      
      audio.onerror = (e) => {
        console.error('Audio error:', e);
        setError('Playback failed');
        setIsPlaying(false);
      };
      
      await audio.play();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      setIsPlaying(false);
    }
  };

  return (
    <div style={{ padding: 20, fontFamily: 'sans-serif' }}>
      <h1>Simple Audio Test</h1>
      <p>This bypasses Web Speech and uses only Azure TTS</p>
      
      <div style={{ display: 'flex', gap: 10, marginTop: 20, flexWrap: 'wrap' }}>
        <button 
          onClick={() => playAudio('こんにちは', 'ja-JP')}
          style={{ padding: '10px 20px', fontSize: 16 }}
          disabled={isPlaying}
        >
          🇯🇵 Japanese: こんにちは
        </button>
        
        <button 
          onClick={() => playAudio('안녕하세요', 'ko-KR')}
          style={{ padding: '10px 20px', fontSize: 16 }}
          disabled={isPlaying}
        >
          🇰🇷 Korean: 안녕하세요
        </button>
        
        <button 
          onClick={() => playAudio('你好', 'zh-CN')}
          style={{ padding: '10px 20px', fontSize: 16 }}
          disabled={isPlaying}
        >
          🇨🇳 Chinese: 你好
        </button>
      </div>
      
      {isPlaying && <p>🔊 Playing...</p>}
      {error && <p style={{ color: 'red' }}>❌ Error: {error}</p>}
      
      <hr style={{ margin: '20px 0' }} />
      <h3>Instructions:</h3>
      <ol>
        <li>Test these buttons on your mobile device</li>
        <li>If they work, the problem is in your ResultCard/Flashcard components</li>
        <li>If they don't work, the problem is mobile browser restrictions</li>
      </ol>
    </div>
  );
}