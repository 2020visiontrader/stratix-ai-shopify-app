-- Enable necessary extensions
create extension if not exists "uuid-ossp";
create extension if not exists "pgcrypto";

-- Brands table
create table if not exists brands (
    id uuid primary key default uuid_generate_v4(),
    name text not null,
    industry text not null,
    target_audience jsonb not null default '[]',
    brand_voice jsonb not null default '{}',
    visual_identity jsonb not null default '{}',
    marketing_strategy jsonb not null default '{}',
    conversion_goals jsonb not null default '{}',
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
    trial_start_date timestamp with time zone,
    billing_active boolean default false,
    billing_charge_id text,
    plan text default 'essential'
);

-- Brand analyses table
create table if not exists brand_analyses (
    id uuid primary key default uuid_generate_v4(),
    brand_id uuid references brands(id) on delete cascade,
    analysis_type text not null,
    content text not null,
    results jsonb not null,
    confidence float not null default 0.0,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- A/B tests table
create table if not exists ab_tests (
    id uuid primary key default uuid_generate_v4(),
    brand_id uuid references brands(id) on delete cascade,
    name text not null,
    description text,
    status text not null default 'draft',
    original_content text not null,
    variants jsonb not null,
    metrics jsonb not null default '{"original": {}, "variants": {}}',
    winner_id uuid,
    metrics jsonb not null,
    winner_id text,
    start_date timestamp with time zone,
    end_date timestamp with time zone,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Content optimizations table
create table if not exists content_optimizations (
    id uuid primary key default uuid_generate_v4(),
    brand_id uuid references brands(id) on delete cascade,
    content_type text not null,
    original_content text not null,
    optimized_content text not null,
    performance_metrics jsonb,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Brand frameworks table
create table if not exists brand_frameworks (
    id uuid primary key default uuid_generate_v4(),
    name text not null,
    description text not null,
    source text not null,
    category text not null,
    framework_data jsonb not null,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Users table
create table if not exists users (
    id uuid primary key default uuid_generate_v4(),
    email text unique not null,
    full_name text,
    role text not null,
    preferences jsonb default '{}'::jsonb,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- User brand access table
create table if not exists user_brand_access (
    user_id uuid references users(id) on delete cascade,
    brand_id uuid references brands(id) on delete cascade,
    access_level text not null,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    primary key (user_id, brand_id)
);

-- Create updated_at trigger function
create or replace function update_updated_at_column()
returns trigger as $$
begin
    new.updated_at = timezone('utc'::text, now());
    return new;
end;
$$ language plpgsql;

-- Create triggers for updated_at
create trigger update_brands_updated_at
    before update on brands
    for each row
    execute function update_updated_at_column();

create trigger update_ab_tests_updated_at
    before update on ab_tests
    for each row
    execute function update_updated_at_column();

-- Create indexes
create index if not exists idx_brands_name on brands(name);
create index if not exists idx_ab_tests_brand_id on ab_tests(brand_id);
create index if not exists idx_brand_analyses_brand_id on brand_analyses(brand_id);
create index if not exists idx_content_optimizations_brand_id on content_optimizations(brand_id);
create index if not exists idx_users_email on users(email);

-- Create RLS policies
alter table brands enable row level security;
alter table brand_analyses enable row level security;
alter table ab_tests enable row level security;
alter table content_optimizations enable row level security;
alter table users enable row level security;
alter table user_brand_access enable row level security;

-- Create policies
create policy "Users can view their brands"
    on brands for select
    using (
        auth.uid() in (
            select user_id from user_brand_access where brand_id = brands.id
        )
    );

create policy "Users can edit their brands"
    on brands for update
    using (
        auth.uid() in (
            select user_id from user_brand_access 
            where brand_id = brands.id and access_level = 'admin'
        )
    );

-- Add more policies as needed

-- Create Shopify shops table
create table if not exists shopify_shops (
    id uuid primary key default uuid_generate_v4(),
    brand_id uuid not null references brands(id) on delete cascade,
    shop_domain varchar(255) not null unique,
    store_name varchar(255) not null,
    shop_owner varchar(255) not null,
    email varchar(255) not null,
    plan varchar(50) not null,
    access_token text,
    access_scope text,
    installed_at timestamp with time zone default timezone('utc'::text, now()) not null,
    uninstalled_at timestamp with time zone,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create Shopify webhooks table
create table if not exists shopify_webhooks (
    id uuid primary key default uuid_generate_v4(),
    shop_id uuid not null references shopify_shops(id) on delete cascade,
    topic varchar(100) not null,
    address text not null,
    format varchar(50) default 'json',
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
    unique(shop_id, topic)
);

-- Create Shopify product sync table
create table if not exists shopify_products (
    id uuid primary key default uuid_generate_v4(),
    shop_id uuid not null references shopify_shops(id) on delete cascade,
    product_id bigint not null,
    title varchar(255) not null,
    description text,
    product_type varchar(255),
    vendor varchar(255),
    handle varchar(255),
    status varchar(50),
    variants jsonb,
    options jsonb,
    images jsonb,
    synced_at timestamp with time zone default timezone('utc'::text, now()) not null,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
    unique(shop_id, product_id)
);

-- Create content versions table
create table if not exists content_versions (
    id uuid primary key default uuid_generate_v4(),
    content_id uuid not null,
    version integer not null,
    content text not null,
    metadata jsonb not null default '{}',
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
    unique(content_id, version)
);

-- Create content schedules table
create table if not exists content_schedules (
    id uuid primary key default uuid_generate_v4(),
    content_id uuid not null,
    version_id uuid not null references content_versions(id) on delete cascade,
    publish_at timestamp with time zone not null,
    unpublish_at timestamp with time zone,
    channels jsonb not null default '[]',
    status varchar(50) not null default 'scheduled',
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create content distributions table
create table if not exists content_distributions (
    id uuid primary key default uuid_generate_v4(),
    content_id uuid not null,
    version_id uuid not null references content_versions(id) on delete cascade,
    channel varchar(50) not null,
    status varchar(50) not null default 'pending',
    metrics jsonb not null default '{"impressions": 0, "engagements": 0, "clicks": 0, "conversions": 0}',
    published_at timestamp with time zone,
    error text,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create indexes
create index if not exists idx_shopify_shops_brand_id on shopify_shops(brand_id);
create index if not exists idx_shopify_shops_domain on shopify_shops(shop_domain);
create index if not exists idx_shopify_webhooks_shop_id on shopify_webhooks(shop_id);
create index if not exists idx_shopify_products_shop_id on shopify_products(shop_id);
create index if not exists idx_shopify_products_product_id on shopify_products(product_id);

-- Create update triggers
create trigger update_shopify_shops_updated_at
    before update on shopify_shops
    for each row
    execute function update_updated_at_column();

create trigger update_shopify_webhooks_updated_at
    before update on shopify_webhooks
    for each row
    execute function update_updated_at_column();

create trigger update_shopify_products_updated_at
    before update on shopify_products
    for each row
    execute function update_updated_at_column();

create trigger update_brand_analyses_updated_at
    before update on brand_analyses
    for each row
    execute function update_updated_at_column();

create trigger update_content_versions_updated_at
    before update on content_versions
    for each row
    execute function update_updated_at_column();

create trigger update_content_schedules_updated_at
    before update on content_schedules
    for each row
    execute function update_updated_at_column();

create trigger update_content_distributions_updated_at
    before update on content_distributions
    for each row
    execute function update_updated_at_column();

create trigger update_content_optimizations_updated_at
    before update on content_optimizations
    for each row
    execute function update_updated_at_column();

-- Test trials table
create table if not exists test_trials (
    id uuid primary key default uuid_generate_v4(),
    test_id uuid references ab_tests(id) on delete cascade,
    variant_id text not null,
    simulation_result jsonb not null,
    timestamp timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create indexes
create index test_trials_test_id_idx on test_trials(test_id);
create index test_trials_variant_id_idx on test_trials(variant_id);
create index test_trials_timestamp_idx on test_trials(timestamp);

-- Create content backups table
create table if not exists content_backups (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    shop_id UUID NOT NULL REFERENCES shopify_shops(id),
    content_type TEXT NOT NULL CHECK (content_type IN ('product', 'collection', 'page')),
    resource_id TEXT NOT NULL,
    original_content JSONB NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(shop_id, content_type, resource_id)
);

-- Create indexes
create index content_backups_shop_id_idx ON content_backups(shop_id);
create index content_backups_content_type_idx ON content_backups(content_type);
create index content_backups_resource_id_idx ON content_backups(resource_id);

-- Create brand usage table
create table if not exists brand_usage (
    id uuid primary key default uuid_generate_v4(),
    brand_id uuid references brands(id) on delete cascade,
    ai_tokens_used bigint default 0,
    storage_used_gb float default 0,
    stores_connected integer default 0,
    visitors_this_month integer default 0,
    variants_tested integer default 0,
    last_updated timestamp with time zone default timezone('utc'::text, now()) not null,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create brand overages table
create table if not exists brand_overages (
    id uuid primary key default uuid_generate_v4(),
    brand_id uuid references brands(id) on delete cascade,
    feature text not null,
    current_usage float not null,
    limit_value float not null,
    timestamp timestamp with time zone default timezone('utc'::text, now()) not null,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create indexes
create index brand_usage_brand_id_idx on brand_usage(brand_id);
create index brand_overages_brand_id_idx on brand_overages(brand_id);
create index brand_overages_feature_idx on brand_overages(feature);

-- Create trigger for brand_usage
create trigger update_brand_usage_updated_at
    before update on brand_usage
    for each row
    execute function update_updated_at_column();

-- Update brand_configs table
alter table brand_configs add column if not exists trial_reminder_sent boolean default false;
alter table brand_configs add column if not exists lockout_override boolean default false;
alter table brand_configs add column if not exists feature_locks jsonb default '{
  "ad_generator": false,
  "autopilot": false,
  "rewrite_approvals": false,
  "pdf_uploads": false,
  "bulk_operations": false,
  "advanced_analytics": false,
  "content_generation": false
}'::jsonb; 