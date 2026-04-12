'use client'

import { useState, useEffect } from 'react'
import { TranslationResult } from '@/lib/supabase'
import { useAudioPlayer } from '@/hooks/useAudioPlayer'

type Props = {
  result: TranslationResult
}

function InlineCopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false)
  function handleCopy() {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    })
  }
  return (
    <button className="inline-copy-btn" onClick={handleCopy}>
      {copied ? '\u2713' : 'Copy'}
    </button>
  )
}

export default function ResultCard({ result }: Props) {
  const { isPlaying, usingFallback, speak, stop } = useAudioPlayer();
  const [audioReady, setAudioReady] = useState(false);
  const [debugLog, setDebugLog] = useState<string[]>([]);

  const addDebugLog = (message: string) => {
    console.log(message);
    setDebugLog(prev => [...prev, `${new Date().toLocaleTimeString()}: ${message}`]);
  };

  // Create a silent audio context on first user tap
  const initAudio = async () => {
    addDebugLog('initAudio called, audioReady: ' + audioReady);
    if (audioReady) return;
    
    try {
      const silentAudio = new Audio();
      silentAudio.volume = 0;
      addDebugLog('Created silent audio, attempting to play...');
      await silentAudio.play();
      addDebugLog('Silent audio played successfully');
      silentAudio.pause();
      setAudioReady(true);
      addDebugLog('Audio context initialized successfully');
    } catch (e) {
      addDebugLog('Audio init error: ' + (e instanceof Error ? e.message : String(e)));
    }
  };

  const handleSpeak = async () => {
    addDebugLog('handleSpeak called, audioReady: ' + audioReady + ', isPlaying: ' + isPlaying);
    
    if (!audioReady) {
      addDebugLog('Audio not ready, initializing...');
      await initAudio();
      addDebugLog('After init, calling handleSpeak again');
      setTimeout(() => handleSpeak(), 100);
      return;
    }
    
    const text = result.japanese_kanji || result.korean || result.chinese || '';
    addDebugLog('Text to speak: "' + text + '"');
    
    if (!text) {
      addDebugLog('No text to speak');
      return;
    }

    const langCode = result.japanese_kanji
      ? 'ja-JP'
      : result.korean
      ? 'ko-KR'
      : 'zh-CN';
    
    addDebugLog('Language code: ' + langCode);
    addDebugLog('Calling speak() function...');
    
    try {
      await speak(text, langCode);
      addDebugLog('speak() completed successfully');
    } catch (error) {
      addDebugLog('speak() error: ' + (error instanceof Error ? error.message : String(error)));
    }
  };

  const handleStop = () => {
    addDebugLog('handleStop called');
    stop();
  };

  const buttonText = () => {
    if (isPlaying) return '\u25a0 Stop';
    if (usingFallback) return '\u25b6 Play (Cloud)';
    return '\u25b6 Play Audio';
  };

  return (
    <div className="result-card">
      {/* Debug Panel - Shows on mobile */}
      <div style={{ 
        background: '#f0f0f0', 
        padding: '8px', 
        margin: '8px', 
        fontSize: '10px', 
        fontFamily: 'monospace',
        borderRadius: '4px',
        maxHeight: '150px',
        overflow: 'auto'
      }}>
        <div style={{ fontWeight: 'bold', marginBottom: '4px' }}>Debug Log:</div>
        {debugLog.slice(-5).map((log, i) => (
          <div key={i} style={{ borderTop: '1px solid #ddd', padding: '2px 0' }}>{log}</div>
        ))}
      </div>

      <div className="result-section">
        <div className="section-label">English</div>
        <div className="english-text">{result.english}</div>
      </div>

      <div className="result-section result-japanese">
        <div className="section-label">Japanese</div>
        <div className="japanese-block">
          <div className="japanese-line">
            <div className="japanese-kanji">{result.japanese_kanji}</div>
            <InlineCopyButton text={result.japanese_kanji} />
          </div>

          {result.japanese_kana && (
            <div className="japanese-line">
              <div className="japanese-kana">Reading: {result.japanese_kana}</div>
              <InlineCopyButton text={result.japanese_kana} />
            </div>
          )}

          {result.japanese_romaji && (
            <div className="japanese-line">
              <div className="japanese-romaji">Romaji: {result.japanese_romaji}</div>
              <InlineCopyButton text={result.japanese_romaji} />
            </div>
          )}
        </div>

        <button
          className={'play-btn ' + (isPlaying ? 'playing' : '')}
          style={{ marginTop: 12 }}
          onClick={isPlaying ? handleStop : handleSpeak}
        >
          {buttonText()}
        </button>
        {usingFallback && isPlaying && (
          <div style={{ fontSize: '12px', marginTop: '4px', color: '#666' }}>
            Using cloud audio for reliability
          </div>
        )}
      </div>

      {/* Rest of your component - keep the same */}
      {(result.syllable_breakdown || result.pitch_accent || result.pronunciation_tips) && (
        <div className="result-section result-pronunciation">
          <div className="section-label">Pronunciation</div>
          {result.syllable_breakdown && (
            <div className="pronunciation-block">
              <div className="pronunciation-label">Syllable breakdown</div>
              <div className="syllable-text">{result.syllable_breakdown}</div>
            </div>
          )}
          {result.pitch_accent && (
            <div className="pronunciation-block">
              <div className="pronunciation-label">Pitch accent</div>
              <div className="structure-content">{result.pitch_accent}</div>
            </div>
          )}
          {result.pronunciation_tips && (
            <div className="pronunciation-block">
              <div className="pronunciation-label">Tips for English speakers</div>
              <div className="structure-content">{result.pronunciation_tips}</div>
            </div>
          )}
        </div>
      )}

      {result.breakdown?.length > 0 && (
        <div className="result-section result-breakdown">
          <div className="section-label">Word Breakdown</div>
          <table className="breakdown-table">
            <thead>
              <tr>
                <th>Word</th>
                <th>Reading</th>
                <th>Meaning</th>
                <th>Role</th>
              </tr>
            </thead>
            <tbody>
              {result.breakdown.map((row, i) => (
                <tr key={i}>
                  <td className="jp">{row.word}</td>
                  <td className="reading">{row.reading}</td>
                  <td className="meaning">{row.meaning}</td>
                  <td className="role">{row.role}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {result.structure && (
        <div className="result-section result-structure">
          <div className="section-label">Sentence Structure</div>
          <div
            className="structure-content"
            dangerouslySetInnerHTML={{ __html: result.structure }}
          />
        </div>
      )}

      {result.tips && (
        <div className="result-section result-tips">
          <div className="section-label">Usage Tips</div>
          <div
            className="structure-content"
            dangerouslySetInnerHTML={{ __html: result.tips }}
          />
        </div>
      )}
    </div>
  );
}