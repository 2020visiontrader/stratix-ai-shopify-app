import { supabase } from '../lib/supabase';
import { AppError } from '../utils/errorHandling';

export async function runMigrations(): Promise<void> {
  try {
    // Create shops table
    await supabase.rpc('create_shops_table', {
      sql: `
        CREATE TABLE IF NOT EXISTS shops (
          id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
          shop_domain TEXT NOT NULL UNIQUE,
          access_token TEXT NOT NULL,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          plan TEXT NOT NULL DEFAULT 'free',
          status TEXT NOT NULL DEFAULT 'active',
          CONSTRAINT valid_status CHECK (status IN ('active', 'inactive', 'suspended'))
        );
      `
    });

    // Create products table
    await supabase.rpc('create_products_table', {
      sql: `
        CREATE TABLE IF NOT EXISTS products (
          id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
          shop_id UUID NOT NULL REFERENCES shops(id) ON DELETE CASCADE,
          product_id TEXT NOT NULL,
          title TEXT NOT NULL,
          description TEXT,
          price DECIMAL(10,2) NOT NULL,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          UNIQUE(shop_id, product_id)
        );
      `
    });

    // Create content_revisions table
    await supabase.rpc('create_content_revisions_table', {
      sql: `
        CREATE TABLE IF NOT EXISTS content_revisions (
          id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
          shop_id UUID NOT NULL REFERENCES shops(id) ON DELETE CASCADE,
          product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
          content_type TEXT NOT NULL,
          original_content TEXT NOT NULL,
          optimized_content TEXT NOT NULL,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          status TEXT NOT NULL DEFAULT 'pending',
          CONSTRAINT valid_content_type CHECK (content_type IN ('title', 'description', 'meta')),
          CONSTRAINT valid_status CHECK (status IN ('pending', 'approved', 'rejected'))
        );
      `
    });

    // Create performance_metrics table
    await supabase.rpc('create_performance_metrics_table', {
      sql: `
        CREATE TABLE IF NOT EXISTS performance_metrics (
          id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
          shop_id UUID NOT NULL REFERENCES shops(id) ON DELETE CASCADE,
          product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
          views INTEGER NOT NULL DEFAULT 0,
          sales INTEGER NOT NULL DEFAULT 0,
          revenue DECIMAL(10,2) NOT NULL DEFAULT 0,
          date DATE NOT NULL,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          UNIQUE(shop_id, product_id, date)
        );
      `
    });

    // Create ai_models table
    await supabase.rpc('create_ai_models_table', {
      sql: `
        CREATE TABLE IF NOT EXISTS ai_models (
          id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
          name TEXT NOT NULL,
          version TEXT NOT NULL,
          status TEXT NOT NULL DEFAULT 'active',
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          CONSTRAINT valid_status CHECK (status IN ('active', 'inactive'))
        );
      `
    });

    // Create usage_logs table
    await supabase.rpc('create_usage_logs_table', {
      sql: `
        CREATE TABLE IF NOT EXISTS usage_logs (
          id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
          shop_id UUID NOT NULL REFERENCES shops(id) ON DELETE CASCADE,
          model_id UUID NOT NULL REFERENCES ai_models(id) ON DELETE CASCADE,
          tokens_used INTEGER NOT NULL,
          cost DECIMAL(10,2) NOT NULL,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
      `
    });

    // Create indexes
    await supabase.rpc('create_indexes', {
      sql: `
        CREATE INDEX IF NOT EXISTS idx_products_shop_id ON products(shop_id);
        CREATE INDEX IF NOT EXISTS idx_content_revisions_shop_id ON content_revisions(shop_id);
        CREATE INDEX IF NOT EXISTS idx_content_revisions_product_id ON content_revisions(product_id);
        CREATE INDEX IF NOT EXISTS idx_performance_metrics_shop_id ON performance_metrics(shop_id);
        CREATE INDEX IF NOT EXISTS idx_performance_metrics_product_id ON performance_metrics(product_id);
        CREATE INDEX IF NOT EXISTS idx_performance_metrics_date ON performance_metrics(date);
        CREATE INDEX IF NOT EXISTS idx_usage_logs_shop_id ON usage_logs(shop_id);
        CREATE INDEX IF NOT EXISTS idx_usage_logs_model_id ON usage_logs(model_id);
        CREATE INDEX IF NOT EXISTS idx_usage_logs_created_at ON usage_logs(created_at);
      `
    });

  } catch (error) {
    throw new AppError(
      `Failed to run database migrations: ${error instanceof Error ? error.message : 'Unknown error'}`,
      500,
      true
    );
  }
} 