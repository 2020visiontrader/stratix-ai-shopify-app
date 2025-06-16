export interface BrandDNA {
  id: string;
  brand_id: string;
  name?: string;
  brand_voice: {
    tone: string;
    personality: string[];
    communication_style: string;
  };
  target_audience: {
    demographics: string[];
    psychographics: string[];
    pain_points: string[];
  };
  visual_identity: {
    primary_colors: string[];
    secondary_colors: string[];
    fonts: string[];
  };
  content_strategy: {
    themes: string[];
    messaging_pillars: string[];
    content_types: string[];
  };
  positioning: {
    market_position: string;
    value_proposition: string;
    differentiators: string[];
  };
  tone_preferences?: {
    preferred_words: string[];
  };
  created_at: Date;
  updated_at: Date;
}

export interface Database {
  public: {
    Tables: {
      brands: {
        Row: BrandDNA;
        Insert: Omit<BrandDNA, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<BrandDNA, 'id' | 'created_at' | 'updated_at'>>;
      };
      evolution_logs: {
        Row: {
          id: string;
          brand_id: string;
          timestamp: string;
          type: string;
          trigger: any;
          changes: any;
          metrics: any;
        };
        Insert: Omit<Database['public']['Tables']['evolution_logs']['Row'], 'id'>;
        Update: Partial<Database['public']['Tables']['evolution_logs']['Insert']>;
      };
    };
  };
}
