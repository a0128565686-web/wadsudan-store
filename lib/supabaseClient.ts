// lib/supabaseClient.ts
import { createBrowserClient } from '@supabase/ssr'

// اقرأ متغيرات البيئة من Next.js
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables')
}

// إنشاء عميل Supabase للمتصفح
export const supabase = createBrowserClient(supabaseUrl, supabaseAnonKey)
