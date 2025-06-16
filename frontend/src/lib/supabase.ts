import { createClient } from '@supabase/supabase-js';

// Simple Supabase client setup
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-key';

export const supabase = createClient(supabaseUrl, supabaseKey);

// Export as db for compatibility with existing code
export const db = supabase;

export default supabase;