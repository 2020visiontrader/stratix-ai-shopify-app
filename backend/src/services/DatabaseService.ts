import { supabase } from '../lib/supabase';
import {
    DatabaseResult,
    QueryParams
} from '../types/database';
import { AppError } from '../utils/errorHandling';

export class DatabaseService {
  private static instance: DatabaseService;

  private constructor() {}

  public static getInstance(): DatabaseService {
    if (!DatabaseService.instance) {
      DatabaseService.instance = new DatabaseService();
    }
    return DatabaseService.instance;
  }

  private buildQuery(
    table: string,
    params: QueryParams
  ) {
    let query = supabase.from(table).select();

    // Apply filters
    if (params.filters) {
      params.filters.forEach(filter => {
        query = query.filter(filter.field, filter.operator, filter.value);
      });
    }

    // Apply search
    if (params.search && params.searchFields) {
      const searchConditions = params.searchFields.map(field => 
        `${field}.ilike.%${params.search}%`
      );
      query = query.or(searchConditions.join(','));
    }

    // Apply pagination
    if (params.pagination) {
      const { page, limit, orderBy, orderDirection } = params.pagination;
      const start = (page - 1) * limit;
      const end = start + limit - 1;

      query = query.range(start, end);

      if (orderBy) {
        query = query.order(orderBy, { ascending: orderDirection === 'asc' });
      }
    }

    return query;
  }

  public async create<T>(
    table: string,
    data: Partial<T>
  ): Promise<DatabaseResult<T>> {
    try {
      const { data: result, error } = await supabase
        .from(table)
        .insert(data)
        .select()
        .single();

      if (error) throw error;

      return {
        data: result as T,
        error: null
      };
    } catch (error) {
      return {
        data: null,
        error: new AppError(
          `Failed to create record in ${table}`,
          500,
          error instanceof Error ? error.message : undefined
        )
      };
    }
  }

  public async update<T>(
    table: string,
    id: string,
    data: Partial<T>
  ): Promise<DatabaseResult<T>> {
    try {
      const { data: result, error } = await supabase
        .from(table)
        .update(data)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      return {
        data: result as T,
        error: null
      };
    } catch (error) {
      return {
        data: null,
        error: new AppError(
          `Failed to update record in ${table}`,
          500,
          error instanceof Error ? error.message : undefined
        )
      };
    }
  }

  public async delete(
    table: string,
    id: string
  ): Promise<DatabaseResult<void>> {
    try {
      const { error } = await supabase
        .from(table)
        .delete()
        .eq('id', id);

      if (error) throw error;

      return {
        data: null,
        error: null
      };
    } catch (error) {
      return {
        data: null,
        error: new AppError(
          `Failed to delete record from ${table}`,
          500,
          error instanceof Error ? error.message : undefined
        )
      };
    }
  }

  public async getById<T>(
    table: string,
    id: string
  ): Promise<DatabaseResult<T>> {
    try {
      const { data, error } = await supabase
        .from(table)
        .select()
        .eq('id', id)
        .single();

      if (error) throw error;

      return {
        data: data as T,
        error: null
      };
    } catch (error) {
      return {
        data: null,
        error: new AppError(
          `Failed to fetch record from ${table}`,
          500,
          error instanceof Error ? error.message : undefined
        )
      };
    }
  }

  public async list<T>(
    table: string,
    params: QueryParams = {}
  ): Promise<DatabaseResult<T[]>> {
    try {
      const query = this.buildQuery(table, params);
      const { data, error } = await query;

      if (error) throw error;

      return {
        data: data as T[],
        error: null
      };
    } catch (error) {
      return {
        data: null,
        error: new AppError(
          `Failed to list records from ${table}`,
          500,
          error instanceof Error ? error.message : undefined
        )
      };
    }
  }

  public async count(
    table: string,
    params: Omit<QueryParams, 'pagination'> = {}
  ): Promise<DatabaseResult<number>> {
    try {
      const query = this.buildQuery(table, { ...params, pagination: undefined });
      const { count, error } = await query.count();

      if (error) throw error;

      return {
        data: count || 0,
        error: null
      };
    } catch (error) {
      return {
        data: null,
        error: new AppError(
          `Failed to count records in ${table}`,
          500,
          error instanceof Error ? error.message : undefined
        )
      };
    }
  }
} 