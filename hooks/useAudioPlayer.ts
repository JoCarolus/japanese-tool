// hooks/useAudioPlayer.ts - Mobile-friendly version
import { useState, useRef, useCallback } from 'react';

export function useAudioPlayer() {
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const currentUrlRef = useRef<string | null>(null);

  const stop = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      // Don't null out the audio element - reuse it
    }
    setIsPlaying(false);
  }, []);

  const speak = useCallback(async (text: string, langCode: string) => {
    if (!text) return;
    
    // Stop current playback first
    stop();
    
    try {
      // Reuse existing audio element or create new one
      if (!audioRef.current) {
        audioRef.current = new Audio();
      }
      
      const audio = audioRef.current;
      
      // Revoke old URL to prevent memory leaks
      if (currentUrlRef.current) {
        URL.revokeObjectURL(currentUrlRef.current);
        currentUrlRef.current = null;
      }
      
      // Clear any pending events
      audio.onended = null;
      audio.onerror = null;
      audio.onplay = null;
      
      // Set up event handlers BEFORE setting src
      audio.onplay = () => {
        console.log('Audio started playing');
        setIsPlaying(true);
      };
      
      audio.onended = () => {
        console.log('Audio ended');
        setIsPlaying(false);
      };
      
      audio.onerror = (e) => {
        console.error('Audio error:', e);
        setIsPlaying(false);
      };
      
      // Fetch and set new audio
      const response = await fetch(`/api/tts?text=${encodeURIComponent(text)}&lang=${langCode}`);
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`TTS failed: ${response.status} - ${errorText}`);
      }
      
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      currentUrlRef.current = url;
      
      // IMPORTANT: Set src and play in the same synchronous flow
      audio.src = url;
      
      // Mobile browsers need play() to be directly in the click handler chain
      // But since we have async fetch, we need to handle this carefully
      const playPromise = audio.play();
      
      if (playPromise !== undefined) {
        playPromise.catch(error => {
          console.error('Play failed:', error);
          // This often happens on mobile if not user-initiated
          if (error.name === 'NotAllowedError') {
            console.log('Autoplay prevented - user interaction required');
          }
          setIsPlaying(false);
        });
      }
      
    } catch (error) {
      console.error('Audio setup error:', error);
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