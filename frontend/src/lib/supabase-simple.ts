import { AppError } from '@/utils/errorHandling';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export interface DatabaseRecord {
  id: string;
  created_at: string;
  updated_at: string;
}

export class SupabaseClient {
  private static instance: SupabaseClient;

  private constructor() {}

  public static getInstance(): SupabaseClient {
    if (!SupabaseClient.instance) {
      SupabaseClient.instance = new SupabaseClient();
    }
    return SupabaseClient.instance;
  }

  public async insert<T extends DatabaseRecord>(
    table: string,
    data: Omit<T, 'id' | 'created_at' | 'updated_at'>
  ): Promise<T> {
    try {
      const { data: result, error } = await supabase
        .from(table)
        .insert(data)
        .select()
        .single();

      if (error) throw error;
      return result as T;
    } catch (error) {
      throw new AppError(
        `Failed to insert into ${table}`,
        500,
        error instanceof Error ? error.message : undefined
      );
    }
  }

  public async update<T extends DatabaseRecord>(
    table: string,
    id: string,
    data: Partial<Omit<T, 'id' | 'created_at' | 'updated_at'>>
  ): Promise<T> {
    try {
      const { data: result, error } = await supabase
        .from(table)
        .update(data)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return result as T;
    } catch (error) {
      throw new AppError(
        `Failed to update ${table}`,
        500,
        error instanceof Error ? error.message : undefined
      );
    }
  }

  public async delete(table: string, id: string): Promise<void> {
    try {
      const { error } = await supabase
        .from(table)
        .delete()
        .eq('id', id);

      if (error) throw error;
    } catch (error) {
      throw new AppError(
        `Failed to delete from ${table}`,
        500,
        error instanceof Error ? error.message : undefined
      );
    }
  }

  public async getById<T extends DatabaseRecord>(
    table: string,
    id: string
  ): Promise<T> {
    try {
      const { data, error } = await supabase
        .from(table)
        .select()
        .eq('id', id)
        .single();

      if (error) throw error;
      return data as T;
    } catch (error) {
      throw new AppError(
        `Failed to fetch from ${table}`,
        500,
        error instanceof Error ? error.message : undefined
      );
    }
  }

  public async list<T extends DatabaseRecord>(
    table: string,
    options: {
      limit?: number;
      offset?: number;
      orderBy?: { column: string; ascending?: boolean };
    } = {}
  ): Promise<T[]> {
    try {
      let query = supabase.from(table).select();

      if (options.limit) {
        query = query.limit(options.limit);
      }

      if (options.offset) {
        query = query.range(options.offset, options.offset + (options.limit || 10) - 1);
      }

      if (options.orderBy) {
        query = query.order(options.orderBy.column, {
          ascending: options.orderBy.ascending ?? true,
        });
      }

      const { data, error } = await query;

      if (error) throw error;
      return data as T[];
    } catch (error) {
      throw new AppError(
        `Failed to list from ${table}`,
        500,
        error instanceof Error ? error.message : undefined
      );
    }
  }
}
