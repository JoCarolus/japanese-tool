'use client'

import { AlphabetCard } from '@/lib/alphabetData'
import { useAudioPlayer } from '@/hooks/useAudioPlayer'

type Props = {
  cards: AlphabetCard[]
  language: string
}

export default function Flashcard({ cards, language }: Props) {
  const [index, setIndex] = useState(0)
  const [flipped, setFlipped] = useState(false)
  const { isPlaying, speak, stop } = useAudioPlayer();

  const card = cards[index]

  // Map language to language code
  const getLangCode = () => {
    switch(language) {
      case 'japanese': return 'ja-JP';
      case 'korean': return 'ko-KR';
      case 'chinese': return 'zh-CN';
      default: return 'ja-JP';
    }
  };

  function handleSpeak() {
    if (isPlaying) {
      stop();
    } else {
      speak(card.char, getLangCode());
    }
  }

  // ... rest of your component logic ...

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* ... flashcard content ... */}
      
      <div className="flashcard-nav">
        {/* ... navigation buttons ... */}
        
        <button
          className="flashcard-audio-btn"
          onClick={(e) => { 
            e.stopPropagation(); 
            handleSpeak();
          }}
        >
          {isPlaying ? '\u25a0 Stop' : '\u25b6 Play'}
        </button>
        
        {/* ... rest of navigation ... */}
      </div>
    </div>
  );
}