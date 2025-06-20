// Insights Dashboard - TypeScript implementation
// Aggregates real metrics from logs or analytics (e.g., Supabase table 'logs').

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_ANON_KEY!);

export interface InsightsMetrics {
  totalGenerations: number;
  totalConversions: number;
  conversionRate: string;
}

export async function getInsightsMetrics(): Promise<InsightsMetrics> {
  // Fetch logs from Supabase
  const { data: logs, error } = await supabase.from('logs').select('*');
  if (error) throw new Error('Failed to fetch logs: ' + error.message);
  const totalGenerations = logs.filter((entry: any) => entry.event === 'content_generated').length;
  const totalConversions = logs.filter((entry: any) => entry.event === 'conversion').length;
  const conversionRate = totalGenerations ? ((totalConversions / totalGenerations) * 100).toFixed(2) + '%' : '0%';
  return { totalGenerations, totalConversions, conversionRate };
}
