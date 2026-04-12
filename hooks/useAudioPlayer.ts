// hooks/useAudioPlayer.ts - PROVEN WORKING VERSION
import { useState, useRef, useCallback } from 'react';

export function useAudioPlayer() {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const stop = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      audioRef.current = null;
    }
    setIsPlaying(false);
  }, []);

  const speak = useCallback(async (text: string, langCode: string) => {
    if (!text || isPlaying) return;
    
    setIsLoading(true);
    
    try {
      // Stop any existing playback
      stop();
      
      // Fetch the audio
      const response = await fetch(`/api/tts?text=${encodeURIComponent(text)}&lang=${langCode}`);
      
      if (!response.ok) {
        throw new Error(`TTS failed: ${response.status}`);
      }
      
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      
      // Create and play audio
      const audio = new Audio(url);
      audioRef.current = audio;
      
      audio.onplay = () => setIsPlaying(true);
      audio.onended = () => {
        setIsPlaying(false);
        URL.revokeObjectURL(url);
        audioRef.current = null;
      };
      audio.onerror = () => {
        setIsPlaying(false);
        URL.revokeObjectURL(url);
        audioRef.current = null;
      };
      
      await audio.play();
      
    } catch (error) {
      console.error('Audio error:', error);
      setIsPlaying(false);
    } finally {
      setIsLoading(false);
    }
  }, [isPlaying, stop]);

  return {
    isPlaying,
    isLoading,
    usingFallback: true,
    speak,
    stop,
  };
}