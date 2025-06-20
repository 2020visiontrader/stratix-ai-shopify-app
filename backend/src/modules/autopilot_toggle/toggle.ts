// Manual vs Autopilot Toggle - TypeScript implementation
// Stores the toggle state in Supabase for persistence.

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_ANON_KEY!);

export async function setAutopilot(userId: string, enabled: boolean): Promise<void> {
  const { error } = await supabase.from('settings').upsert([
    { user_id: userId, autopilot_enabled: enabled, updated_at: new Date().toISOString() },
  ], { onConflict: 'user_id' });
  if (error) throw new Error('Failed to set autopilot: ' + error.message);
}

export async function isAutopilot(userId: string): Promise<boolean> {
  const { data, error } = await supabase.from('settings').select('autopilot_enabled').eq('user_id', userId).single();
  if (error) throw new Error('Failed to fetch autopilot state: ' + error.message);
  return !!data?.autopilot_enabled;
} 