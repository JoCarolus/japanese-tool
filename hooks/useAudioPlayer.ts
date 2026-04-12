// hooks/useAudioPlayer.ts
import { useState, useRef, useCallback } from 'react';

export function useAudioPlayer() {
  const [isPlaying, setIsPlaying] = useState(false);
  const [usingFallback, setUsingFallback] = useState(false);
  const [forceFallback, setForceFallback] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const currentUtteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  const webSpeechFailedRef = useRef(false);

  // Check if Web Speech API is likely to work on this device
  const isWebSpeechReliable = useCallback(() => {
    // If we've already detected failure, always use fallback
    if (webSpeechFailedRef.current) return false;
    
    // Chrome on Android has a known bug with SpeechSynthesis
    const isAndroidChrome = /Android.*Chrome/.test(navigator.userAgent);
    const isChrome = /Chrome/.test(navigator.userAgent);
    const versionMatch = navigator.userAgent.match(/Chrome\/(\d+)/);
    const chromeVersion = versionMatch ? parseInt(versionMatch[1]) : 0;
    
    // Bug exists in Chrome 130-138 on Android
    if (isAndroidChrome && chromeVersion >= 130 && chromeVersion <= 138) {
      return false;
    }
    
    // Also check if it's Samsung Internet (has similar issues)
    const isSamsung = /SamsungBrowser/.test(navigator.userAgent);
    if (isSamsung) return false;
    
    // Check if it's iOS Safari (works well)
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
    if (isIOS) return true;
    
    return 'speechSynthesis' in window;
  }, []);

  const tryWebSpeech = useCallback((text: string, langCode: string): Promise<boolean> => {
    return new Promise((resolve) => {
      // If forceFallback is true, skip Web Speech entirely
      if (forceFallback || !isWebSpeechReliable() || !window.speechSynthesis) {
        resolve(false);
        return;
      }

      // Cancel any ongoing speech
      window.speechSynthesis.cancel();
      
      // Small delay to ensure cancel is processed
      setTimeout(() => {
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = langCode;
        utterance.rate = 0.85;
        
        let resolved = false;
        let timeoutId: NodeJS.Timeout;
        
        utterance.onstart = () => {
          if (!resolved) {
            resolved = true;
            clearTimeout(timeoutId);
            setIsPlaying(true);
            resolve(true);
          }
        };
        
        utterance.onend = () => {
          setIsPlaying(false);
          // Reset on successful completion
          webSpeechFailedRef.current = false;
        };
        
        utterance.onerror = (event) => {
          console.warn('WebSpeech error:', event);
          setIsPlaying(false);
          if (!resolved) {
            resolved = true;
            clearTimeout(timeoutId);
            webSpeechFailedRef.current = true;
            resolve(false);
          }
        };
        
        // Shorter timeout - if it doesn't start in 1 second, fallback
        timeoutId = setTimeout(() => {
          if (!resolved) {
            console.warn('WebSpeech timeout - using fallback');
            window.speechSynthesis.cancel();
            resolved = true;
            webSpeechFailedRef.current = true;
            setForceFallback(true);
            resolve(false);
          }
        }, 1000);
        
        currentUtteranceRef.current = utterance;
        
        try {
          window.speechSynthesis.speak(utterance);
        } catch (e) {
          console.error('WebSpeech exception:', e);
          clearTimeout(timeoutId);
          webSpeechFailedRef.current = true;
          setForceFallback(true);
          resolve(false);
        }
      }, 50);
    });
  }, [isWebSpeechReliable, forceFallback]);

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
    
    // If we're already forcing fallback, skip Web Speech
    if (forceFallback) {
      await playFallbackAudio(text, langCode);
      return;
    }
    
    // Try Web Speech first
    const webSpeechSuccess = await tryWebSpeech(text, langCode);
    
    // If Web Speech fails or is unreliable, use fallback
    if (!webSpeechSuccess) {
      await playFallbackAudio(text, langCode);
    }
  }, [tryWebSpeech, playFallbackAudio, forceFallback]);

  const stop = useCallback(() => {
    return new Promise<void>((resolve) => {
      // Stop Web Speech
      if (window.speechSynthesis) {
        try {
          window.speechSynthesis.cancel();
        } catch (e) {
          console.warn('Error canceling speech:', e);
        }
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