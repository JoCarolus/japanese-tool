// hooks/useAudioPlayer.ts - Final working version
import { useState, useRef, useCallback } from 'react';

export function useAudioPlayer() {
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const currentUrlRef = useRef<string | null>(null);

  const stop = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
    setIsPlaying(false);
  }, []);

  const speak = useCallback(async (text: string, langCode: string) => {
    if (!text) return;
    
    // Stop current playback first
    stop();
    
    try {
      // Clean up old URL
      if (currentUrlRef.current) {
        URL.revokeObjectURL(currentUrlRef.current);
        currentUrlRef.current = null;
      }
      
      // Fetch audio from your working API
      const response = await fetch(`/api/tts?text=${encodeURIComponent(text)}&lang=${langCode}`);
      
      if (!response.ok) {
        throw new Error(`TTS failed: ${response.status}`);
      }
      
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      currentUrlRef.current = url;
      
      const audio = new Audio(url);
      audioRef.current = audio;
      
      audio.onplay = () => setIsPlaying(true);
      audio.onended = () => {
        setIsPlaying(false);
        if (currentUrlRef.current) {
          URL.revokeObjectURL(currentUrlRef.current);
          currentUrlRef.current = null;
        }
      };
      audio.onerror = () => setIsPlaying(false);
      
      await audio.play();
      
    } catch (error) {
      console.error('Audio playback error:', error);
      setIsPlaying(false);
    }
  }, [stop]);

  return {
    isPlaying,
    usingFallback: true,
    speak,
    stop,
  };
}