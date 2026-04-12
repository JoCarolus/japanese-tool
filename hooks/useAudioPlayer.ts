// hooks/useAudioPlayer.ts - Mobile-friendly with pre-fetch
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

  // Pre-fetch audio URL without playing
  const preFetchAudio = useCallback(async (text: string, langCode: string) => {
    // Don't re-fetch if already have this text
    if (preFetchedTextRef.current === text && preFetchedUrlRef.current) {
      console.log('Using cached audio URL');
      return preFetchedUrlRef.current;
    }
    
    setIsLoading(true);
    try {
      // Clean up old URL
      if (preFetchedUrlRef.current) {
        URL.revokeObjectURL(preFetchedUrlRef.current);
      }
      
      const response = await fetch(`/api/tts?text=${encodeURIComponent(text)}&lang=${langCode}`);
      if (!response.ok) throw new Error('TTS failed');
      
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      preFetchedUrlRef.current = url;
      preFetchedTextRef.current = text;
      
      console.log('Pre-fetched audio URL:', url);
      return url;
    } catch (error) {
      console.error('Pre-fetch error:', error);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Play pre-fetched audio immediately (no delay!)
  const playPreFetched = useCallback(async () => {
    if (!preFetchedUrlRef.current) {
      console.error('No pre-fetched audio available');
      return false;
    }
    
    stop();
    
    try {
      const audio = new Audio(preFetchedUrlRef.current);
      audioRef.current = audio;
      
      audio.onplay = () => setIsPlaying(true);
      audio.onended = () => {
        setIsPlaying(false);
        // Don't revoke URL - keep for potential replay
      };
      audio.onerror = () => setIsPlaying(false);
      
      // This play() call happens immediately with no await delay
      await audio.play();
      console.log('Playing pre-fetched audio');
      return true;
    } catch (error) {
      console.error('Play error:', error);
      setIsPlaying(false);
      return false;
    }
  }, [stop]);

  const speak = useCallback(async (text: string, langCode: string) => {
    if (!text || isPlaying) return;
    
    // First, pre-fetch the audio
    await preFetchAudio(text, langCode);
    
    // Then play it immediately
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