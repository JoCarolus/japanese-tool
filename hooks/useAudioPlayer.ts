// hooks/useAudioPlayer.ts
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
    
    await new Promise(resolve => setTimeout(resolve, 50));
    
    setIsLoading(true);
    
    try {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
      
      const response = await fetch(`/api/tts?text=${encodeURIComponent(text)}&lang=${langCode}`);
      
      if (!response.ok) {
        throw new Error(`TTS failed: ${response.status}`);
      }
      
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      
      const audio = new Audio(url);
      audioRef.current = audio;
      
      audio.onplay = () => {
        setIsPlaying(true);
        setIsLoading(false);
      };
      
      audio.onended = () => {
        setIsPlaying(false);
        URL.revokeObjectURL(url);
        audioRef.current = null;
      };
      
      audio.onerror = () => {
        setIsPlaying(false);
        setIsLoading(false);
        URL.revokeObjectURL(url);
        audioRef.current = null;
      };
      
      await audio.play();
      
    } catch (error) {
      console.error('Audio error:', error);
      setIsPlaying(false);
      setIsLoading(false);
    }
  }, [isPlaying]);

  return {
    isPlaying,
    isLoading,
    usingFallback: true,
    speak,
    stop,
  };
}