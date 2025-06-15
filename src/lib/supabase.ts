import { createClient } from '@supabase/supabase-js';
import { databaseConfig } from '../config';
import { BrandDNA } from '../types';
import { Database } from '../types/database';

if (!databaseConfig.supabaseUrl || !databaseConfig.supabaseKey) {
  throw new Error('Missing Supabase configuration');
}

const supabaseUrl = process.env.REACT_APP_SUPABASE_URL!;
const supabaseKey = process.env.REACT_APP_SUPABASE_ANON_KEY!;

export const db = createClient<Database>(supabaseUrl, supabaseKey);

interface ContentOptimization {
  brand_id: string;
  content_type: string;
  original_content: string;
  optimized_content: string;
  performance_metrics: {
    expected_improvement: number;
    confidence: number;
    improvements: string[];
    seo_suggestions: string[];
  };
}

interface BrandAnalysis {
  id?: string;
  brand_id: string;
  analysis_type: string;
  content: string;
  results: any;
  confidence: number;
  created_at?: Date;
  updated_at?: Date;
}

interface ABTest {
  brand_id: string;
  name: string;
  description?: string;
  status: 'draft' | 'running' | 'completed' | 'stopped';
  original_content: string;
  variants: {
    id: string;
    content: string;
    rationale: string;
  }[];
  metrics: {
    original: {
      impressions: number;
      clicks: number;
      conversions: number;
      revenue: number;
    };
    variants: Record<string, {
      impressions: number;
      clicks: number;
      conversions: number;
      revenue: number;
    }>;
  };
  winner_id?: string;
  start_date?: Date;
  end_date?: Date;
}

interface ContentVersion {
  id: string;
  content_id: string;
  version: number;
  content: string;
  metadata: {
    author: string;
    changes: string[];
    approval_status: 'pending' | 'approved' | 'rejected';
    approved_by?: string;
    approved_at?: Date;
  };
  created_at: Date;
  updated_at: Date;
}

interface ContentSchedule {
  id: string;
  content_id: string;
  version_id: string;
  publish_at: Date;
  unpublish_at?: Date;
  channels: string[];
  status: 'scheduled' | 'published' | 'completed' | 'cancelled';
}

interface ContentDistribution {
  id: string;
  content_id: string;
  version_id: string;
  channel: string;
  status: 'pending' | 'published' | 'failed';
  metrics: {
    impressions: number;
    engagements: number;
    clicks: number;
    conversions: number;
  };
  published_at?: Date;
  error?: string;
}

interface ShopifyShop {
  id: string;
  brand_id: string;
  shop_domain: string;
  store_name: string;
  shop_owner: string;
  email: string;
  plan: string;
  access_token?: string;
  access_scope?: string;
  installed_at: Date;
  uninstalled_at?: Date;
  created_at: Date;
  updated_at: Date;
}

interface ShopifyWebhook {
  id: string;
  shop_id: string;
  topic: string;
  address: string;
  format: 'json' | 'xml';
  created_at: Date;
  updated_at: Date;
}

interface ShopifyProduct {
  id: string;
  shop_id: string;
  product_id: number;
  title: string;
  description?: string;
  product_type?: string;
  vendor?: string;
  handle?: string;
  status?: string;
  variants: any[];
  options: any[];
  images: any[];
  synced_at: Date;
  created_at: Date;
  updated_at: Date;
}

interface TestTrial {
  test_id: string;
  variant_id: string;
  simulation_result: {
    metrics: {
      conversion_potential: number;
      tone_alignment: number;
      brand_dna_match: number;
      overall_score: number;
    };
    analysis: string;
    confidence: number;
  };
  timestamp: Date;
}

interface Framework {
  id?: string;
  name: string;
  description: string;
  source: string;
  category: 'optimization' | 'testing' | 'cta' | 'landing_page';
  framework_data: {
    steps: string[];
    principles: string[];
    examples: string[];
    metrics: string[];
    industry_fit?: string[];
    brand_tier?: 'budget' | 'mid' | 'premium';
  };
  created_at?: Date;
}

export interface StoreRevision {
  id: string;
  brand_id: string;
  content_type: 'product' | 'collection' | 'page';
  original_content: {
    title?: string;
    description?: string;
    body_html?: string;
    meta_title?: string;
    meta_description?: string;
  };
  optimized_content: {
    title?: string;
    description?: string;
    body_html?: string;
    meta_title?: string;
    meta_description?: string;
  };
  status: 'pending' | 'approved' | 'rejected' | 'deployed' | 'reverted';
  created_at: string;
  updated_at: string;
}

interface BrandConfig {
  id?: string;
  brand_id: string;
  name: string;
  tone: string;
  target_audience: string[];
  value_propositions: string[];
  openai_key?: string;
  preferred_ctas: string[];
  autopilot: boolean;
  feature_locks: {
    autopilot: boolean;
    bulk_operations: boolean;
    advanced_analytics: boolean;
  };
  trial_reminder_sent: boolean;
  created_at?: Date;
  updated_at?: Date;
}

interface Event {
  id?: string;
  type: string;
  brand_id: string;
  payload: any;
  created_at?: Date;
}

export interface ContentBackup {
  id: string;
  shop_id: string;
  content_type: 'product' | 'collection' | 'page';
  resource_id: string;
  original_content: Record<string, any>;
  created_at: string;
}

interface BrandUsage {
  id: string;
  brand_id: string;
  ai_tokens_used: number;
  storage_used_gb: number;
  stores_connected: number;
  visitors_this_month: number;
  variants_tested: number;
  last_updated: Date;
  created_at: Date;
  updated_at: Date;
}

interface BrandOverage {
  id: string;
  brand_id: string;
  feature: string;
  current_usage: number;
  limit_value: number;
  timestamp: Date;
  created_at: Date;
}

interface PerformanceUpload {
  id?: string;
  brand_id: string;
  raw_data: any[];
  metrics_summary: {
    total_impressions: number;
    total_clicks: number;
    total_spend: number;
    total_conversions: number;
    average_ctr: number;
    average_cpc: number;
    average_roas: number;
    average_cpm: number;
  };
  upload_date: Date;
  created_at?: Date;
}

interface PerformanceInsight {
  id?: string;
  brand_id: string;
  upload_id: string;
  top_performers: {
    by_roas: any[];
    by_ctr: any[];
    by_conversion: any[];
  };
  weak_performers: {
    by_roas: any[];
    by_ctr: any[];
    by_conversion: any[];
  };
  recommendations: Array<{
    type: string;
    message: string;
    metric: string;
    current: number;
    target: number;
  }>;
  created_at: Date;
}

interface BrandInsight {
  id?: string;
  brand_id: string;
  insights_type: string;
  data: any;
  created_at: Date;
}

interface BrandModelData {
  id?: string;
  brand_id: string;
  data: any;
  created_at?: Date;
  updated_at?: Date;
}

export const db: Database = {
  brands: {
    create: async (data: Omit<BrandDNA, 'id' | 'created_at' | 'updated_at'>) => {
      const { data: brand, error } = await db
        .from('brands')
        .insert(data)
        .select()
        .single();
      
      if (error) throw error;
      return { data: brand };
    },
    update: async (id: string, data: Partial<BrandDNA>) => {
      const { data: brand, error } = await db
        .from('brands')
        .update(data)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return { data: brand };
    },
    delete: async (id: string) => {
      const { data: brand, error } = await db
        .from('brands')
        .delete()
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return { data: brand };
    },
    getById: async (id: string) => {
      const { data: brand, error } = await db
        .from('brands')
        .select('*')
        .eq('id', id)
        .single();
      
      if (error) throw error;
      return { data: brand };
    },
    list: async () => {
      const { data: brands, error } = await db
        .from('brands')
        .select('*');
      
      if (error) throw error;
      return { data: brands };
    }
  },
  
  content_optimizations: {
    create: async (data: ContentOptimization) => {
      return await db.from('content_optimizations').insert(data).select().single();
    },
    getByBrandId: async (brandId: string) => {
      return await db.from('content_optimizations').select('*').eq('brand_id', brandId);
    }
  },
  
  analyses: {
    create: async (data: BrandAnalysis) => {
      return await db.from('brand_analyses').insert(data).select().single();
    },
    getByBrandId: async (brandId: string) => {
      return await db.from('brand_analyses')
        .select('*')
        .eq('brand_id', brandId)
        .order('created_at', { ascending: false });
    }
  },
  
  tests: {
    create: async (data: ABTest) => {
      return await db.from('ab_tests').insert(data).select().single();
    },
    update: async (id: string, data: Partial<ABTest>) => {
      return await db.from('ab_tests').update(data).eq('id', id).select().single();
    },
    getById: async (id: string) => {
      return await db.from('ab_tests').select('*').eq('id', id).single();
    },
    getByBrandId: async (brandId: string) => {
      return await db.from('ab_tests')
        .select('*')
        .eq('brand_id', brandId)
        .order('created_at', { ascending: false });
    }
  },

  content_versions: {
    create: async (data: Omit<ContentVersion, 'id' | 'created_at' | 'updated_at'>) => {
      return await db.from('content_versions').insert(data).select().single();
    },
    update: async (id: string, data: Partial<ContentVersion>) => {
      return await db.from('content_versions').update(data).eq('id', id).select().single();
    },
    getById: async (id: string) => {
      return await db.from('content_versions').select('*').eq('id', id).single();
    },
    getByContentId: async (contentId: string) => {
      return await db.from('content_versions')
        .select('*')
        .eq('content_id', contentId)
        .order('version', { ascending: false });
    },
    getLatestVersion: async (contentId: string) => {
      return await db.from('content_versions')
        .select('*')
        .eq('content_id', contentId)
        .order('version', { ascending: false })
        .limit(1)
        .single();
    }
  },

  content_schedules: {
    create: async (data: Omit<ContentSchedule, 'id'>) => {
      return await db.from('content_schedules').insert(data).select().single();
    },
    update: async (id: string, data: Partial<ContentSchedule>) => {
      return await db.from('content_schedules').update(data).eq('id', id).select().single();
    },
    getById: async (id: string) => {
      return await db.from('content_schedules').select('*').eq('id', id).single();
    },
    getByContentId: async (contentId: string) => {
      return await db.from('content_schedules')
        .select('*')
        .eq('content_id', contentId)
        .order('publish_at', { ascending: true });
    },
    getPendingSchedules: async () => {
      return await db.from('content_schedules')
        .select('*')
        .eq('status', 'scheduled')
        .gte('publish_at', new Date().toISOString())
        .order('publish_at', { ascending: true });
    }
  },

  content_distributions: {
    create: async (data: Omit<ContentDistribution, 'id'>) => {
      return await db.from('content_distributions').insert(data).select().single();
    },
    update: async (id: string, data: Partial<ContentDistribution>) => {
      return await db.from('content_distributions').update(data).eq('id', id).select().single();
    },
    getById: async (id: string) => {
      return await db.from('content_distributions').select('*').eq('id', id).single();
    },
    getByContentId: async (contentId: string) => {
      return await db.from('content_distributions')
        .select('*')
        .eq('content_id', contentId)
        .order('created_at', { ascending: false });
    },
    updateMetrics: async (id: string, metrics: Partial<ContentDistribution['metrics']>) => {
      const { data: current } = await db
        .from('content_distributions')
        .select('metrics')
        .eq('id', id)
        .single();

      return await db.from('content_distributions').update({
        metrics: { ...current?.metrics, ...metrics }
      }).eq('id', id).select().single();
    }
  },

  shopify_shops: {
    create: async (data: Omit<ShopifyShop, 'id' | 'created_at' | 'updated_at' | 'installed_at'>) => {
      return await db.from('shopify_shops').insert({
        ...data,
        installed_at: new Date()
      }).select().single();
    },
    update: async (id: string, data: Partial<ShopifyShop>) => {
      return await db.from('shopify_shops').update(data).eq('id', id).select().single();
    },
    getById: async (id: string) => {
      return await db.from('shopify_shops').select('*').eq('id', id).single();
    },
    getByShopDomain: async (shopDomain: string) => {
      return await db.from('shopify_shops').select('*').eq('shop_domain', shopDomain).single();
    },
    markUninstalled: async (shopDomain: string) => {
      return await db.from('shopify_shops')
        .update({ uninstalled_at: new Date() })
        .eq('shop_domain', shopDomain)
        .select()
        .single();
    },
    getByBrandId: async (brandId: string) => {
      return await db.from('shopify_shops')
        .select('*')
        .eq('brand_id', brandId);
    }
  },

  shopify_webhooks: {
    create: async (data: Omit<ShopifyWebhook, 'id' | 'created_at' | 'updated_at'>) => {
      return await db.from('shopify_webhooks').insert(data).select().single();
    },
    delete: async (id: string) => {
      return await db.from('shopify_webhooks').delete().eq('id', id);
    },
    getByShopId: async (shopId: string) => {
      return await db.from('shopify_webhooks').select('*').eq('shop_id', shopId);
    },
    getByShopAndTopic: async (shopId: string, topic: string) => {
      return await db.from('shopify_webhooks')
        .select('*')
        .eq('shop_id', shopId)
        .eq('topic', topic)
        .single();
    }
  },

  shopify_products: {
    create: async (data: Omit<ShopifyProduct, 'id' | 'created_at' | 'updated_at' | 'synced_at'>) => {
      return await db.from('shopify_products').insert({
        ...data,
        synced_at: new Date()
      }).select().single();
    },
    update: async (id: string, data: Partial<ShopifyProduct>) => {
      return await db.from('shopify_products').update({
        ...data,
        synced_at: new Date()
      }).eq('id', id).select().single();
    },
    getById: async (id: string) => {
      return await db.from('shopify_products').select('*').eq('id', id).single();
    },
    getByShopAndProductId: async (shopId: string, productId: number) => {
      return await db.from('shopify_products')
        .select('*')
        .eq('shop_id', shopId)
        .eq('product_id', productId)
        .single();
    },
    listByShop: async (shopId: string) => {
      return await db.from('shopify_products')
        .select('*')
        .eq('shop_id', shopId)
        .order('synced_at', { ascending: false });
    },
    deleteByShopAndProductId: async (shopId: string, productId: number) => {
      return await db.from('shopify_products')
        .delete()
        .eq('shop_id', shopId)
        .eq('product_id', productId);
    }
  },

  test_trials: {
    create: async (data: Omit<TestTrial, 'id'>) => {
      return await db.from('test_trials').insert(data).select().single();
    },
    getByTestId: async (testId: string) => {
      return await db.from('test_trials')
        .select('*')
        .eq('test_id', testId)
        .order('timestamp', { ascending: false });
    },
    getByVariantId: async (testId: string, variantId: string) => {
      return await db.from('test_trials')
        .select('*')
        .eq('test_id', testId)
        .eq('variant_id', variantId)
        .order('timestamp', { ascending: false });
    }
  },

  brand_analyses: {
    create: async (data: Omit<BrandAnalysis, 'id' | 'created_at' | 'updated_at'>) => {
      return await db.from('brand_analyses').insert(data).select().single();
    },
    update: async (id: string, data: Partial<BrandAnalysis>) => {
      return await db.from('brand_analyses').update(data).eq('id', id).select().single();
    },
    getById: async (id: string) => {
      return await db.from('brand_analyses').select('*').eq('id', id).single();
    },
    getByBrandId: async (brandId: string) => {
      return await db.from('brand_analyses')
        .select('*')
        .eq('brand_id', brandId)
        .order('created_at', { ascending: false });
    },
    getByType: async (brandId: string, type: string) => {
      return await db.from('brand_analyses')
        .select('*')
        .eq('brand_id', brandId)
        .eq('analysis_type', type)
        .order('created_at', { ascending: false });
    }
  },

  brand_frameworks: {
    create: async (data: Omit<Framework, 'id' | 'created_at'>) => {
      return await db.from('brand_frameworks').insert(data).select().single();
    },
    update: async (id: string, data: Partial<Framework>) => {
      return await db.from('brand_frameworks').update(data).eq('id', id).select().single();
    },
    getById: async (id: string) => {
      return await db.from('brand_frameworks').select('*').eq('id', id).single();
    },
    list: async () => {
      return await db.from('brand_frameworks').select('*');
    },
    getByCategory: async (category: Framework['category']) => {
      return await db.from('brand_frameworks')
        .select('*')
        .eq('category', category);
    },
    search: async (searchTerms: { categories?: string[]; keywords?: string[] }) => {
      let query = db.from('brand_frameworks').select('*');
      
      if (searchTerms.categories?.length) {
        query = query.in('category', searchTerms.categories);
      }
      
      if (searchTerms.keywords?.length) {
        const keywordConditions = searchTerms.keywords.map(keyword => 
          `framework_data->>'principles' ilike '%${keyword}%' or ` +
          `description ilike '%${keyword}%'`
        ).join(' or ');
        
        query = query.or(keywordConditions);
      }
      
      return await query;
    }
  },

  store_revisions: {
    create: async (data: Omit<StoreRevision, 'id' | 'created_at' | 'updated_at'>) => {
      return await db.from('store_revisions').insert(data).select().single();
    },
    update: async (id: string, data: Partial<StoreRevision>) => {
      return await db.from('store_revisions').update(data).eq('id', id).select().single();
    },
    getById: async (id: string) => {
      return await db.from('store_revisions').select('*').eq('id', id).single();
    },
    getByBrandId: async (brandId: string) => {
      return await db.from('store_revisions')
        .select('*')
        .eq('brand_id', brandId)
        .order('created_at', { ascending: false });
    },
    getByStatus: async (brandId: string, status: StoreRevision['status']) => {
      return await supabase.from('store_revisions')
        .select('*')
        .eq('brand_id', brandId)
        .eq('status', status)
        .order('created_at', { ascending: false });
    }
  },

  brand_configs: {
    create: async (data: Omit<BrandConfig, 'id' | 'created_at' | 'updated_at'>) => {
      return await supabase.from('brand_configs').insert(data).select().single();
    },
    update: async (id: string, data: Partial<BrandConfig>) => {
      return await supabase.from('brand_configs').update(data).eq('id', id).select().single();
    },
    getById: async (id: string) => {
      return await supabase.from('brand_configs').select('*').eq('id', id).single();
    },
    getByBrandId: async (brandId: string) => {
      return await supabase.from('brand_configs')
        .select('*')
        .eq('brand_id', brandId)
        .single();
    }
  },

  events: {
    create: async (data: Omit<Event, 'id' | 'created_at'>) => {
      return await supabase.from('events').insert(data).select().single();
    },
    getByBrandId: async (brandId: string) => {
      return await supabase.from('events')
        .select('*')
        .eq('brand_id', brandId)
        .order('created_at', { ascending: false });
    },
    getByType: async (brandId: string, type: string) => {
      return await supabase.from('events')
        .select('*')
        .eq('brand_id', brandId)
        .eq('type', type)
        .order('created_at', { ascending: false });
    }
  },

  content_backups: {
    create: (backup: Omit<ContentBackup, 'id' | 'created_at'>) => 
      supabase.from('content_backups').insert(backup).select().single(),
    
    getLatest: (shopId: string, contentType: ContentBackup['content_type'], resourceId: string) =>
      supabase.from('content_backups')
        .select()
        .eq('shop_id', shopId)
        .eq('content_type', contentType)
        .eq('resource_id', resourceId)
        .order('created_at', { ascending: false })
        .limit(1)
        .single(),

    delete: (id: string) =>
      supabase.from('content_backups').delete().eq('id', id)
  },

  brand_usage: {
    create: async (data: Omit<BrandUsage, 'id' | 'created_at' | 'updated_at'>) => {
      return await supabase.from('brand_usage').insert(data).select().single();
    },
    update: async (id: string, data: Partial<BrandUsage>) => {
      return await supabase.from('brand_usage').update(data).eq('id', id).select().single();
    },
    getByBrandId: async (brandId: string) => {
      return await supabase.from('brand_usage')
        .select('*')
        .eq('brand_id', brandId)
        .single();
    }
  },

  brand_overages: {
    create: async (data: Omit<BrandOverage, 'id' | 'created_at'>) => {
      return await supabase.from('brand_overages').insert(data);
    },
    getByFeature: async (brandId: string, feature: string) => {
      return await supabase
        .from('brand_overages')
        .select('*')
        .eq('brand_id', brandId)
        .eq('feature', feature);
    },
    delete: async (brandId: string) => {
      return await supabase
        .from('brand_overages')
        .delete()
        .eq('brand_id', brandId);
    }
  },

  auth: {
    getUser: async (token: string) => {
      const { data, error } = await supabase.auth.getUser(token);
      return { data, error };
    }
  },

  users: {
    getRole: async (userId: string) => {
      const { data, error } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', userId)
        .single();
      return { data, error };
    }
  },

  performance_uploads: {
    create: async (data: Omit<PerformanceUpload, 'id' | 'created_at'>) => {
      return await supabase.from('performance_uploads').insert(data).select().single();
    },
    getByBrandId: async (brandId: string) => {
      return await supabase.from('performance_uploads')
        .select('*')
        .eq('brand_id', brandId)
        .order('upload_date', { ascending: false });
    },
    getById: async (id: string) => {
      return await supabase.from('performance_uploads').select('*').eq('id', id).single();
    }
  },

  performance_insights: {
    create: async (data: Omit<PerformanceInsight, 'id'>) => {
      return await supabase.from('performance_insights').insert(data).select().single();
    },
    getByUploadId: async (uploadId: string) => {
      return await supabase.from('performance_insights')
        .select('*')
        .eq('upload_id', uploadId)
        .single();
    },
    getByBrandId: async (brandId: string) => {
      return await supabase.from('performance_insights')
        .select('*')
        .eq('brand_id', brandId)
        .order('created_at', { ascending: false });
    }
  },

  brand_insights: {
    create: async (data: Omit<BrandInsight, 'id'>) => {
      return await supabase.from('brand_insights').insert(data).select().single();
    },
    getByBrandId: async (brandId: string) => {
      return await supabase.from('brand_insights')
        .select('*')
        .eq('brand_id', brandId)
        .order('created_at', { ascending: false });
    },
    getByType: async (brandId: string, type: string) => {
      return await supabase.from('brand_insights')
        .select('*')
        .eq('brand_id', brandId)
        .eq('insights_type', type)
        .order('created_at', { ascending: false });
    }
  },

  brand_models: {
    create: async (data: Omit<BrandModelData, 'id' | 'updated_at'>) => {
      return await supabase.from('brand_models').insert(data).select().single();
    },
    update: async (brandId: string, data: Partial<BrandModelData>) => {
      return await supabase.from('brand_models')
        .update(data)
        .eq('brand_id', brandId)
        .select()
        .single();
    },
    getByBrandId: async (brandId: string) => {
      return await supabase.from('brand_models')
        .select('*')
        .eq('brand_id', brandId)
        .single();
    }
  }
} as const; 