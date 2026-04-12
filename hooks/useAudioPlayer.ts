import { useState, useRef, useCallback } from 'react';

export function useAudioPlayer() {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const preFetchedUrlRef = useRef<string | null>(null);
  const preFetchedTextRef = useRef<string>('');

  const stop = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
    setIsPlaying(false);
  }, []);

  const preFetchAudio = useCallback(async (text: string, langCode: string) => {
    if (preFetchedTextRef.current === text && preFetchedUrlRef.current) {
      return preFetchedUrlRef.current;
    }
    
    setIsLoading(true);
    try {
      if (preFetchedUrlRef.current) {
        URL.revokeObjectURL(preFetchedUrlRef.current);
      }
      
      const response = await fetch(`/api/tts?text=${encodeURIComponent(text)}&lang=${langCode}`);
      if (!response.ok) throw new Error('TTS failed');
      
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      preFetchedUrlRef.current = url;
      preFetchedTextRef.current = text;
      
      return url;
    } catch (error) {
      console.error('Pre-fetch error:', error);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const playPreFetched = useCallback(async () => {
    if (!preFetchedUrlRef.current) {
      return false;
    }
    
    stop();
    
    try {
      const audio = new Audio(preFetchedUrlRef.current);
      audioRef.current = audio;
      
      audio.onplay = () => setIsPlaying(true);
      audio.onended = () => setIsPlaying(false);
      audio.onerror = () => setIsPlaying(false);
      
      await audio.play();
      return true;
    } catch (error) {
      console.error('Play error:', error);
      setIsPlaying(false);
      return false;
    }
  }, [stop]);

  const speak = useCallback(async (text: string, langCode: string) => {
    if (!text || isPlaying) return;
    await preFetchAudio(text, langCode);
    await playPreFetched();
  }, [isPlaying, preFetchAudio, playPreFetched]);

  return {
    isPlaying,
    isLoading,
    usingFallback: true,
    speak,
    stop,
  };
}