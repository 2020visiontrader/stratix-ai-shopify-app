import { SupabaseClient } from '@supabase/supabase-js';

export interface EvolutionLog {
  id: string;
  brand_id: string;
  timestamp: Date;
  type: 'CONTENT_CHANGE' | 'STRATEGY_UPDATE' | 'PROMPT_PERFORMANCE' | 'MODEL_ADJUSTMENT';
  trigger: {
    source: string;
    action: string;
    metadata: Record<string, any>;
  };
  changes: {
    before: Record<string, any>;
    after: Record<string, any>;
    impact_areas: string[];
  };
  metrics?: {
    performance_delta?: number;
    confidence_score?: number;
    sample_size?: number;
  };
  context?: {
    tier: string;
    autopilot: boolean;
    features_enabled: string[];
  };
}

export interface TonePreferences {
  primary: string;
  secondary: string[];
  avoid: string[];
  style_guide: {
    voice: string;
    personality: string[];
    language_level: string;
    formality: number;
  };
}

export interface BrandDNA {
  id: string;
  name: string;
  owner_id: string;
  created_at: Date;
  updated_at: Date;
  tone_preferences: TonePreferences;
  target_audience: {
    demographics: Record<string, any>;
    psychographics: Record<string, any>;
    pain_points: string[];
  };
  brand_voice: {
    personality: string[];
    values: string[];
    mission: string;
  };
  visual_identity: {
    colors: string[];
    typography: string[];
    imagery_style: string[];
  };
  marketing_strategy: {
    channels: string[];
    goals: string[];
    kpis: string[];
  };
  conversion_goals: {
    primary: string;
    secondary: string[];
    metrics: Record<string, any>;
  };
  tone_monitoring: {
    last_deviation?: {
      timestamp: Date;
      content_type: string;
      analysis: {
        issues: string[];
        metrics: Record<string, number>;
      };
    };
  };
}

export interface UserProfile {
  id: string;
  first_name: string;
  last_name: string;
  photo_url?: string;
  created_at: Date;
  updated_at: Date;
}

export interface Database {
  public: {
    Tables: {
      user_profiles: {
        Row: UserProfile;
        Insert: Omit<UserProfile, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<UserProfile>;
      };
      brands: {
        Row: BrandDNA;
        Insert: Omit<BrandDNA, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<BrandDNA>;
      };
      evolution_logs: {
        Row: EvolutionLog;
        Insert: Omit<EvolutionLog, 'id'>;
        Update: Partial<EvolutionLog>;
      };
    };
  };
  brands: {
    create: (data: Omit<BrandDNA, 'id' | 'created_at' | 'updated_at'>) => Promise<{ data: BrandDNA | null }>;
    update: (id: string, data: Partial<BrandDNA>) => Promise<{ data: BrandDNA | null }>;
    delete: (id: string) => Promise<{ data: BrandDNA | null }>;
    getById: (id: string) => Promise<{ data: BrandDNA | null }>;
    list: () => Promise<{ data: BrandDNA[] | null }>;
  };
  evolution_logs: {
    create: (data: Omit<EvolutionLog, 'id'>) => Promise<{ data: EvolutionLog | null }>;
    getByBrandId: (brandId: string) => Promise<{ data: EvolutionLog[] | null }>;
    getByType: (brandId: string, type: EvolutionLog['type']) => Promise<{ data: EvolutionLog[] | null }>;
    getByDateRange: (brandId: string, startDate: Date, endDate: Date) => Promise<{ data: EvolutionLog[] | null }>;
    getLatest: (brandId: string, limit?: number) => Promise<{ data: EvolutionLog[] | null }>;
  };
}

export type SupabaseDB = SupabaseClient<Database>; 