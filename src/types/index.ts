export interface BrandDNA {
  id: string;
  name: string;
  industry: string;
  target_audience: string[];
  brand_voice: {
    tone: string;
    style: string;
    keywords: string[];
  };
  visual_identity: {
    colors: string[];
    typography: string[];
    imagery: string[];
  };
  marketing_strategy: {
    objectives: string[];
    channels: string[];
    key_messages: string[];
  };
  conversion_goals: {
    primary: string;
    secondary: string[];
    metrics: {
      name: string;
      target: number;
      unit: string;
    }[];
  };
  created_at: Date;
  updated_at: Date;
}

export interface AIAnalysisResult {
  brandVoice: {
    tone: string;
    style: string;
    keywords: string[];
  };
  targetAudience: string[];
  marketingStrategy: {
    objectives: string[];
    channels: string[];
    keyMessages: string[];
  };
  visualIdentity: {
    colors: string[];
    typography: string[];
    imagery: string[];
  };
  confidence: number;
  suggestions: string[];
  warnings: string[];
}

export interface DatabaseError {
  code: string;
  message: string;
  details?: string;
}

export interface DatabaseResponse<T> {
  data: T | null;
  error: DatabaseError | null;
}

export interface ExtractedBrandData {
  rawText: string;
  sections: {
    title: string;
    content: string;
    confidence: number;
    relevance: number;
  }[];
  metadata: {
    documentType: string;
    processingDate: Date;
    wordCount: number;
    keyPhrases: string[];
  };
}

export interface OpenAIConfig {
  model: string;
  temperature: number;
  maxTokens: number;
  topP: number;
  frequencyPenalty: number;
  presencePenalty: number;
}

export interface DatabaseConfig {
  supabaseUrl: string;
  supabaseKey: string;
  schema: string;
} 