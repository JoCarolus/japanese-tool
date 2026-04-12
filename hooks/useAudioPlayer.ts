// hooks/useAudioPlayer.ts - Debug version
import { useState, useRef, useCallback } from 'react';

export function useAudioPlayer() {
  const [isPlaying, setIsPlaying] = useState(false);
  const [usingFallback, setUsingFallback] = useState(true);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const currentUrlRef = useRef<string | null>(null);

  const stop = useCallback(() => {
    console.log('[AudioHook] stop() called');
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
    setIsPlaying(false);
  }, []);

  const speak = useCallback(async (text: string, langCode: string) => {
    console.log('[AudioHook] speak() called with:', { text, langCode });
    
    if (!text) {
      console.log('[AudioHook] No text provided');
      return;
    }
    
    // Stop current playback first
    stop();
    
    try {
      // Create new audio element each time (simpler for debugging)
      if (audioRef.current) {
        console.log('[AudioHook] Cleaning up old audio element');
        audioRef.current = null;
      }
      
      // Revoke old URL
      if (currentUrlRef.current) {
        URL.revokeObjectURL(currentUrlRef.current);
        currentUrlRef.current = null;
      }
      
      console.log('[AudioHook] Fetching audio from API...');
      const response = await fetch(`/api/tts?text=${encodeURIComponent(text)}&lang=${langCode}`);
      
      console.log('[AudioHook] API response status:', response.status);
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`TTS failed: ${response.status} - ${errorText}`);
      }
      
      const blob = await response.blob();
      console.log('[AudioHook] Audio blob size:', blob.size);
      
      const url = URL.createObjectURL(blob);
      currentUrlRef.current = url;
      
      const audio = new Audio(url);
      audioRef.current = audio;
      
      audio.onplay = () => {
        console.log('[AudioHook] onplay event - audio started');
        setIsPlaying(true);
      };
      
      audio.onended = () => {
        console.log('[AudioHook] onended event - audio finished');
        setIsPlaying(false);
        if (currentUrlRef.current) {
          URL.revokeObjectURL(currentUrlRef.current);
          currentUrlRef.current = null;
        }
      };
      
      audio.onerror = (e) => {
        console.error('[AudioHook] onerror event:', e);
        setIsPlaying(false);
      };
      
      console.log('[AudioHook] Calling audio.play()...');
      const playPromise = audio.play();
      
      if (playPromise !== undefined) {
        await playPromise;
        console.log('[AudioHook] audio.play() resolved successfully');
      }
      
    } catch (error) {
      console.error('[AudioHook] Error in speak():', error);
      setIsPlaying(false);
    }
  }, [stop]);

  return {
    isPlaying,
    usingFallback,
    speak,
    stop,
  };
}