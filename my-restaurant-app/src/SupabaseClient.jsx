import { createClient } from '@supabase/supabase-js'

// 1. Double-check these names against your .env file EXACTLY
// Usually, there is an underscore: VITE_SUPABASE_API_URL
const supabaseUrl = import.meta.env.VITE_SUPABASE_API_URL
const supabaseKey = import.meta.env.VITE_SUPABASE_PUBLIC_KEY

// 2. Add this "Safety Check" to see the error clearly in the console
if (!supabaseUrl || !supabaseKey) {
  console.error("Missing Supabase Environment Variables! Check your .env file naming.");
}

export const supabase = createClient(supabaseUrl, supabaseKey)