import { createClient } from '@supabase/supabase-js'

export type BreakdownItem = {
  word: string
  reading: string
  meaning: string
  role: string
}

export type Translation = {
  id: string
  user_id?: string
  language?: string
  input_text: string
  direction: string
  english: string
  chinese?: string          // Optional - only for Chinese translations
  korean?: string           // Optional - only for Korean translations
  japanese_kanji: string
  japanese_kana?: string    // Optional - may be empty for Korean/Chinese
  japanese_romaji?: string  // Optional - may be empty for some translations
  syllable_breakdown?: string
  pitch_accent?: string
  pronunciation_tips?: string
  breakdown?: BreakdownItem[]
  structure?: string
  tips?: string
  created_at: string
}

export type TranslationResult = Omit<Translation, 'id' | 'created_at' | 'input_text' | 'direction' | 'user_id' | 'language'>

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)