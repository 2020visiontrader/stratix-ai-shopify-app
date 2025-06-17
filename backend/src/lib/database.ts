import { supabase } from './supabase';

// Database table accessors
export const database = {
  brands: {
    async getById(id: string) {
      return await supabase.from('brands').select('*').eq('id', id).single();
    },
    async update(id: string, data: any) {
      return await supabase.from('brands').update(data).eq('id', id);
    },
    async create(data: any) {
      return await supabase.from('brands').insert(data);
    }
  },
  
  brand_usage: {
    async getByBrandId(brandId: string) {
      return await supabase.from('brand_usage').select('*').eq('brand_id', brandId).single();
    },
    async update(brandId: string, data: any) {
      return await supabase.from('brand_usage').update(data).eq('brand_id', brandId);
    }
  },

  brand_configs: {
    async getByBrandId(brandId: string) {
      return await supabase.from('brand_configs').select('*').eq('brand_id', brandId).single();
    },
    async update(brandId: string, data: any) {
      return await supabase.from('brand_configs').update(data).eq('brand_id', brandId);
    }
  },

  brand_overages: {
    async delete(brandId: string) {
      return await supabase.from('brand_overages').delete().eq('brand_id', brandId);
    }
  },

  events: {
    async create(data: any) {
      return await supabase.from('events').insert(data);
    },
    async getByType(brandId: string, type: string) {
      return await supabase.from('events').select('*').eq('brand_id', brandId).eq('type', type);
    }
  },

  performance_uploads: {
    async create(data: any) {
      const result = await supabase.from('performance_uploads').insert(data).select();
      return result;
    }
  },

  performance_insights: {
    async create(data: any) {
      return await supabase.from('performance_insights').insert(data);
    }
  },

  shopify_shops: {
    async getByShopDomain(shopDomain: string) {
      return await supabase.from('shopify_shops').select('*').eq('shop_domain', shopDomain).single();
    },
    async getByBrandId(brandId: string) {
      return await supabase.from('shopify_shops').select('*').eq('brand_id', brandId).single();
    }
  }
};

export { database as db };
