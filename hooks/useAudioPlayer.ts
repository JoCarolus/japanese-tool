// hooks/useAudioPlayer.ts
import { useState, useRef, useCallback } from 'react';

export function useAudioPlayer() {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const stop = useCallback(() => {
    console.log('🛑 stop() called');
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      audioRef.current = null;
    }
    setIsPlaying(false);
  }, []);

  const speak = useCallback(async (text: string, langCode: string) => {
    console.log('📢 speak() called with:', { text, langCode, isPlaying });
    
    if (!text) {
      console.log('❌ No text provided');
      return;
    }
    
    if (isPlaying) {
      console.log('⚠️ Already playing, skipping');
      return;
    }
    
    setIsLoading(true);
    console.log('⏳ Loading started');
    
    try {
      // Stop any existing playback
      if (audioRef.current) {
        console.log('🔇 Stopping existing playback');
        audioRef.current.pause();
        audioRef.current = null;
      }
      
      const url = `/api/tts?text=${encodeURIComponent(text)}&lang=${langCode}`;
      console.log('📡 Fetching URL:', url);
      
      // Fetch the audio
      const response = await fetch(url);
      console.log('📡 Response status:', response.status);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ TTS API error:', response.status, errorText);
        throw new Error(`TTS failed: ${response.status}`);
      }
      
      const blob = await response.blob();
      console.log('📦 Audio blob size:', blob.size, 'bytes');
      
      const audioUrl = URL.createObjectURL(blob);
      console.log('🔗 Created object URL:', audioUrl);
      
      // Create and play audio
      const audio = new Audio(audioUrl);
      audioRef.current = audio;
      
      audio.onplay = () => {
        console.log('🔊 Audio onplay event - started playing');
        setIsPlaying(true);
        setIsLoading(false);
      };
      
      audio.onended = () => {
        console.log('🔇 Audio onended event - finished');
        setIsPlaying(false);
        URL.revokeObjectURL(audioUrl);
        audioRef.current = null;
      };
      
      audio.onerror = (e) => {
        console.error('❌ Audio onerror event:', e);
        setIsPlaying(false);
        setIsLoading(false);
        URL.revokeObjectURL(audioUrl);
        audioRef.current = null;
      };
      
      console.log('▶️ Calling audio.play()...');
      await audio.play();
      console.log('✅ audio.play() completed successfully');
      
    } catch (error) {
      console.error('❌ Audio error in catch block:', error);
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