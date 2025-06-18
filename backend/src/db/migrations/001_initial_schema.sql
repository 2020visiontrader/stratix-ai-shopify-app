-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Create enum types
CREATE TYPE shop_status AS ENUM ('active', 'inactive', 'suspended');
CREATE TYPE content_type AS ENUM ('title', 'description', 'meta');
CREATE TYPE content_status AS ENUM ('pending', 'approved', 'rejected');
CREATE TYPE model_status AS ENUM ('active', 'inactive');
CREATE TYPE event_type AS ENUM (
  'APP_INSTALLED',
  'APP_UNINSTALLED',
  'PRODUCT_CREATED',
  'PRODUCT_UPDATED',
  'PRODUCT_DELETED',
  'ORDER_CREATED',
  'ORDER_UPDATED',
  'CUSTOMER_CREATED',
  'CUSTOMER_UPDATED'
);

-- Create shops table
CREATE TABLE shops (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  shop_domain VARCHAR(255) NOT NULL UNIQUE,
  access_token TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  plan VARCHAR(50) DEFAULT 'free',
  status shop_status DEFAULT 'active',
  settings JSONB DEFAULT '{}',
  features JSONB DEFAULT '{}',
  billing_charge_id VARCHAR(255),
  CONSTRAINT valid_shop_domain CHECK (shop_domain ~ '^[a-zA-Z0-9][a-zA-Z0-9-]*\.myshopify\.com$')
);

-- Create products table
CREATE TABLE products (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  shop_id UUID NOT NULL REFERENCES shops(id) ON DELETE CASCADE,
  product_id VARCHAR(255) NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  price DECIMAL(10,2),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  metadata JSONB DEFAULT '{}',
  UNIQUE(shop_id, product_id)
);

-- Create content_revisions table
CREATE TABLE content_revisions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  shop_id UUID NOT NULL REFERENCES shops(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  content_type content_type NOT NULL,
  original_content TEXT NOT NULL,
  optimized_content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  status content_status DEFAULT 'pending',
  metadata JSONB DEFAULT '{}'
);

-- Create performance_metrics table
CREATE TABLE performance_metrics (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  shop_id UUID NOT NULL REFERENCES shops(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  views INTEGER DEFAULT 0,
  sales INTEGER DEFAULT 0,
  revenue DECIMAL(10,2) DEFAULT 0,
  date DATE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  metadata JSONB DEFAULT '{}',
  UNIQUE(shop_id, product_id, date)
);

-- Create ai_models table
CREATE TABLE ai_models (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  version VARCHAR(50) NOT NULL,
  status model_status DEFAULT 'active',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  config JSONB DEFAULT '{}',
  UNIQUE(name, version)
);

-- Create usage_logs table
CREATE TABLE usage_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  shop_id UUID NOT NULL REFERENCES shops(id) ON DELETE CASCADE,
  model_id UUID NOT NULL REFERENCES ai_models(id) ON DELETE CASCADE,
  tokens_used INTEGER NOT NULL,
  cost DECIMAL(10,2) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  metadata JSONB DEFAULT '{}'
);

-- Create events table
CREATE TABLE events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  type event_type NOT NULL,
  brand_id UUID NOT NULL REFERENCES shops(id) ON DELETE CASCADE,
  payload JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create cache table
CREATE TABLE IF NOT EXISTS cache (
    key TEXT PRIMARY KEY,
    value JSONB NOT NULL,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Create indexes
CREATE INDEX idx_shops_domain ON shops(shop_domain);
CREATE INDEX idx_products_shop ON products(shop_id);
CREATE INDEX idx_products_shop_product ON products(shop_id, product_id);
CREATE INDEX idx_content_revisions_shop ON content_revisions(shop_id);
CREATE INDEX idx_content_revisions_product ON content_revisions(product_id);
CREATE INDEX idx_performance_metrics_shop ON performance_metrics(shop_id);
CREATE INDEX idx_performance_metrics_product ON performance_metrics(product_id);
CREATE INDEX idx_performance_metrics_date ON performance_metrics(date);
CREATE INDEX idx_usage_logs_shop ON usage_logs(shop_id);
CREATE INDEX idx_usage_logs_model ON usage_logs(model_id);
CREATE INDEX idx_events_brand ON events(brand_id);
CREATE INDEX idx_events_type ON events(type);
CREATE INDEX idx_cache_type ON cache(type);
CREATE INDEX idx_cache_expires ON cache(expires_at);
CREATE INDEX IF NOT EXISTS idx_cache_expires_at ON cache(expires_at);
CREATE INDEX IF NOT EXISTS idx_usage_logs_user_id ON usage_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_content_revisions_product_id ON content_revisions(product_id);
CREATE INDEX IF NOT EXISTS idx_social_posts_product_id ON social_posts(product_id);
CREATE INDEX IF NOT EXISTS idx_social_posts_status ON social_posts(status);
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON notifications(read);
CREATE INDEX IF NOT EXISTS idx_performance_metrics_product_id ON performance_metrics(product_id);
CREATE INDEX IF NOT EXISTS idx_performance_metrics_timestamp ON performance_metrics(timestamp);
CREATE INDEX IF NOT EXISTS idx_market_analysis_product_id ON market_analysis(product_id);
CREATE INDEX IF NOT EXISTS idx_analytics_reports_shop_id ON analytics_reports(shop_id);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Add updated_at triggers
CREATE TRIGGER update_shops_updated_at
  BEFORE UPDATE ON shops
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_products_updated_at
  BEFORE UPDATE ON products
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_ai_models_updated_at
  BEFORE UPDATE ON ai_models
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_cache_updated_at
  BEFORE UPDATE ON cache
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Create RLS policies
ALTER TABLE shops ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE content_revisions ENABLE ROW LEVEL SECURITY;
ALTER TABLE performance_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE usage_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE cache ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Shops are viewable by authenticated users"
  ON shops FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Shops are insertable by authenticated users"
  ON shops FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Shops are updatable by owner"
  ON shops FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Allow authenticated users to read cache"
    ON cache FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Allow authenticated users to write cache"
    ON cache FOR INSERT
    TO authenticated
    WITH CHECK (true);

CREATE POLICY "Allow users to read their own usage logs"
    ON usage_logs FOR SELECT
    TO authenticated
    USING (auth.uid() = user_id);

CREATE POLICY "Allow users to read their own content revisions"
    ON content_revisions FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Allow users to write content revisions"
    ON content_revisions FOR INSERT
    TO authenticated
    WITH CHECK (true);

CREATE POLICY "Allow users to read their own social posts"
    ON social_posts FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Allow users to write social posts"
    ON social_posts FOR INSERT
    TO authenticated
    WITH CHECK (true);

CREATE POLICY "Allow users to read their own notifications"
    ON notifications FOR SELECT
    TO authenticated
    USING (auth.uid() = user_id);

CREATE POLICY "Allow users to update their own notifications"
    ON notifications FOR UPDATE
    TO authenticated
    USING (auth.uid() = user_id);

CREATE POLICY "Allow users to read their own performance metrics"
    ON performance_metrics FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Allow users to write performance metrics"
    ON performance_metrics FOR INSERT
    TO authenticated
    WITH CHECK (true);

CREATE POLICY "Allow users to read their own market analysis"
    ON market_analysis FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Allow users to write market analysis"
    ON market_analysis FOR INSERT
    TO authenticated
    WITH CHECK (true);

CREATE POLICY "Allow users to read their own analytics reports"
    ON analytics_reports FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Allow users to write analytics reports"
    ON analytics_reports FOR INSERT
    TO authenticated
    WITH CHECK (true);

-- Create functions
CREATE OR REPLACE FUNCTION get_cache_stats()
RETURNS TABLE (
    total_entries BIGINT,
    expired_entries BIGINT,
    memory_usage BIGINT
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        COUNT(*)::BIGINT as total_entries,
        COUNT(*) FILTER (WHERE expires_at < NOW())::BIGINT as expired_entries,
        pg_total_relation_size('cache')::BIGINT as memory_usage
    FROM cache;
END;
$$ LANGUAGE plpgsql;

-- Create triggers
CREATE OR REPLACE FUNCTION cleanup_expired_cache()
RETURNS TRIGGER AS $$
BEGIN
    DELETE FROM cache WHERE expires_at < NOW();
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_cleanup_expired_cache
    AFTER INSERT ON cache
    EXECUTE FUNCTION cleanup_expired_cache(); 