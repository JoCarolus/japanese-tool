// hooks/useAudioPlayer.ts
import { useState, useRef, useCallback } from 'react';

export function useAudioPlayer() {
  const [isPlaying, setIsPlaying] = useState(false);
  const [usingFallback, setUsingFallback] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const currentUtteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  // Check if Web Speech API is likely to work on this device
  const isWebSpeechReliable = useCallback(() => {
    // Chrome on Android has a known bug with SpeechSynthesis
    const isAndroidChrome = /Android.*Chrome/.test(navigator.userAgent);
    const isChrome = /Chrome/.test(navigator.userAgent);
    const versionMatch = navigator.userAgent.match(/Chrome\/(\d+)/);
    const chromeVersion = versionMatch ? parseInt(versionMatch[1]) : 0;
    
    // Bug exists in Chrome 130-138 on Android
    if (isAndroidChrome && chromeVersion >= 130 && chromeVersion <= 138) {
      return false;
    }
    
    return 'speechSynthesis' in window;
  }, []);

  const tryWebSpeech = useCallback((text: string, langCode: string): Promise<boolean> => {
    return new Promise((resolve) => {
      if (!isWebSpeechReliable() || !window.speechSynthesis) {
        resolve(false);
        return;
      }

      // Cancel any ongoing speech
      window.speechSynthesis.cancel();
      
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = langCode;
      utterance.rate = 0.85;
      
      let resolved = false;
      
      utterance.onstart = () => {
        if (!resolved) {
          resolved = true;
          setIsPlaying(true);
          resolve(true);
        }
      };
      
      utterance.onend = () => {
        setIsPlaying(false);
      };
      
      utterance.onerror = (event) => {
        console.warn('WebSpeech error:', event);
        setIsPlaying(false);
        if (!resolved) {
          resolved = true;
          resolve(false);
        }
      };
      
      // Set a timeout - if it doesn't start in 2 seconds, fallback
      setTimeout(() => {
        if (!resolved) {
          window.speechSynthesis.cancel();
          resolved = true;
          resolve(false);
        }
      }, 2000);
      
      currentUtteranceRef.current = utterance;
      window.speechSynthesis.speak(utterance);
    });
  }, [isWebSpeechReliable]);

  const playFallbackAudio = useCallback((text: string, langCode: string): Promise<void> => {
    return new Promise((resolve, reject) => {
      // Create audio element
      const audio = new Audio();
      audioRef.current = audio;
      
      // Call your TTS API endpoint
      audio.src = `/api/tts?text=${encodeURIComponent(text)}&lang=${langCode}`;
      
      audio.oncanplaythrough = () => {
        setUsingFallback(true);
        audio.play().catch(reject);
      };
      
      audio.onplaying = () => {
        setIsPlaying(true);
        resolve();
      };
      
      audio.onended = () => {
        setIsPlaying(false);
        setUsingFallback(false);
        resolve();
      };
      
      audio.onerror = (e) => {
        console.error('Fallback audio error:', e);
        setIsPlaying(false);
        setUsingFallback(false);
        reject(e);
      };
      
      audio.load();
    });
  }, []);

  const speak = useCallback(async (text: string, langCode: string) => {
    if (!text) return;
    
    // Stop any current playback
    await stop();
    
    // Try Web Speech first
    const webSpeechSuccess = await tryWebSpeech(text, langCode);
    
    // If Web Speech fails or is unreliable, use fallback
    if (!webSpeechSuccess) {
      await playFallbackAudio(text, langCode);
    }
  }, [tryWebSpeech, playFallbackAudio]);

  const stop = useCallback(() => {
    return new Promise<void>((resolve) => {
      // Stop Web Speech
      if (window.speechSynthesis) {
        window.speechSynthesis.cancel();
        if (currentUtteranceRef.current) {
          currentUtteranceRef.current.onend = null;
          currentUtteranceRef.current = null;
        }
      }
      
      // Stop fallback audio
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
        audioRef.current = null;
      }
      
      setIsPlaying(false);
      setUsingFallback(false);
      resolve();
    });
  }, []);

  return {
    isPlaying,
    usingFallback,
    speak,
    stop,
  };
}