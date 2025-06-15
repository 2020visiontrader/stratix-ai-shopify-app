import { ShopifyShop } from '../lib/supabase';

declare global {
  namespace Express {
    interface Request {
      shopDomain?: string;
      shop?: ShopifyShop;
    }
  }
} 