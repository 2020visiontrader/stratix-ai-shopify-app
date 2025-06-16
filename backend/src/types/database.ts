export interface DatabaseConfig {
  supabaseUrl: string;
  supabaseKey: string;
  schema: string;
}

export interface Shop {
  id: string;
  shop_domain: string;
  access_token: string;
  created_at: string;
  updated_at: string;
  plan: string;
  status: 'active' | 'inactive' | 'suspended';
}

export interface Product {
  id: string;
  shop_id: string;
  product_id: string;
  title: string;
  description: string;
  price: number;
  created_at: string;
  updated_at: string;
}

export interface ContentRevision {
  id: string;
  shop_id: string;
  product_id: string;
  content_type: 'title' | 'description' | 'meta';
  original_content: string;
  optimized_content: string;
  created_at: string;
  status: 'pending' | 'approved' | 'rejected';
}

export interface PerformanceMetrics {
  id: string;
  shop_id: string;
  product_id: string;
  views: number;
  sales: number;
  revenue: number;
  date: string;
}

export interface AIModel {
  id: string;
  name: string;
  version: string;
  status: 'active' | 'inactive';
  created_at: string;
  updated_at: string;
}

export interface UsageLog {
  id: string;
  shop_id: string;
  model_id: string;
  tokens_used: number;
  cost: number;
  created_at: string;
}

export interface DatabaseError extends Error {
  code: string;
  details?: string;
  hint?: string;
}

export interface DatabaseResult<T> {
  data: T | null;
  error: DatabaseError | null;
}

export interface PaginationParams {
  page: number;
  limit: number;
  orderBy?: string;
  orderDirection?: 'asc' | 'desc';
}

export interface FilterParams {
  field: string;
  operator: 'eq' | 'neq' | 'gt' | 'gte' | 'lt' | 'lte' | 'like' | 'ilike' | 'in';
  value: any;
}

export interface QueryParams {
  pagination?: PaginationParams;
  filters?: FilterParams[];
  search?: string;
  searchFields?: string[];
} 