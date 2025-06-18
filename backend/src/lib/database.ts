import { z } from 'zod';
import { DatabaseError } from '../utils/errors';
import { supabase } from './supabase';

// Database Schema Validation
const BrandSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  shop_domain: z.string(),
  plan: z.enum(['free', 'essential', 'growth', 'enterprise']),
  billing_active: z.boolean(),
  billing_charge_id: z.string().optional(),
  trial_start_date: z.date(),
  settings: z.record(z.unknown()),
  features: z.record(z.boolean()),
  created_at: z.date(),
  updated_at: z.date()
});

const ShopSchema = z.object({
  id: z.string().uuid(),
  brand_id: z.string().uuid(),
  shop_domain: z.string(),
  access_token: z.string(),
  status: z.enum(['active', 'inactive', 'suspended']),
  created_at: z.date(),
  updated_at: z.date()
});

// Database table accessors with proper error handling and validation
export const database = {
  brands: {
    async getById(id: string) {
      try {
        const { data, error } = await supabase
          .from('brands')
          .select('*')
          .eq('id', id)
          .single();

        if (error) throw new DatabaseError('Failed to fetch brand', error);
        return BrandSchema.parse(data);
      } catch (error) {
        throw new DatabaseError('Brand validation failed', error);
      }
    },

    async update(id: string, data: Partial<z.infer<typeof BrandSchema>>) {
      try {
        const { data: result, error } = await supabase
          .from('brands')
          .update({
            ...data,
            updated_at: new Date()
          })
          .eq('id', id)
          .select()
          .single();

        if (error) throw new DatabaseError('Failed to update brand', error);
        return BrandSchema.parse(result);
      } catch (error) {
        throw new DatabaseError('Brand update failed', error);
      }
    },

    async create(data: Omit<z.infer<typeof BrandSchema>, 'id' | 'created_at' | 'updated_at'>) {
      try {
        const { data: result, error } = await supabase
          .from('brands')
          .insert({
            ...data,
            created_at: new Date(),
            updated_at: new Date()
          })
          .select()
          .single();

        if (error) throw new DatabaseError('Failed to create brand', error);
        return BrandSchema.parse(result);
      } catch (error) {
        throw new DatabaseError('Brand creation failed', error);
      }
    }
  },

  shops: {
    async getByShopDomain(shopDomain: string) {
      try {
        const { data, error } = await supabase
          .from('shops')
          .select('*')
          .eq('shop_domain', shopDomain)
          .single();

        if (error) throw new DatabaseError('Failed to fetch shop', error);
        return ShopSchema.parse(data);
      } catch (error) {
        throw new DatabaseError('Shop validation failed', error);
      }
    },

    async getByBrandId(brandId: string) {
      try {
        const { data, error } = await supabase
          .from('shops')
          .select('*')
          .eq('brand_id', brandId)
          .single();

        if (error) throw new DatabaseError('Failed to fetch shop', error);
        return ShopSchema.parse(data);
      } catch (error) {
        throw new DatabaseError('Shop validation failed', error);
      }
    },

    async update(shopDomain: string, data: Partial<z.infer<typeof ShopSchema>>) {
      try {
        const { data: result, error } = await supabase
          .from('shops')
          .update({
            ...data,
            updated_at: new Date()
          })
          .eq('shop_domain', shopDomain)
          .select()
          .single();

        if (error) throw new DatabaseError('Failed to update shop', error);
        return ShopSchema.parse(result);
      } catch (error) {
        throw new DatabaseError('Shop update failed', error);
      }
    },

    async create(data: Omit<z.infer<typeof ShopSchema>, 'id' | 'created_at' | 'updated_at'>) {
      try {
        const { data: result, error } = await supabase
          .from('shops')
          .insert({
            ...data,
            created_at: new Date(),
            updated_at: new Date()
          })
          .select()
          .single();

        if (error) throw new DatabaseError('Failed to create shop', error);
        return ShopSchema.parse(result);
      } catch (error) {
        throw new DatabaseError('Shop creation failed', error);
      }
    }
  },

  events: {
    async create(data: {
      type: string;
      brand_id: string;
      payload: Record<string, unknown>;
    }) {
      try {
        const { data: result, error } = await supabase
          .from('events')
          .insert({
            ...data,
            created_at: new Date()
          })
          .select()
          .single();

        if (error) throw new DatabaseError('Failed to create event', error);
        return result;
      } catch (error) {
        throw new DatabaseError('Event creation failed', error);
      }
    }
  }
};

export { database as db };
