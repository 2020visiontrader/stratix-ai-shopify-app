import { supabase } from '../lib/supabase';
import {
    DatabaseResult,
    QueryParams
} from '../types/database';
import { AppError } from '../utils/errorHandling';

export class DatabaseService {
  private static instance: DatabaseService;

  constructor() {}

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
      params.filters.forEach((filter: any) => {
        query = query.filter(filter.field, filter.operator, filter.value);
      });
    }

    // Apply search
    if (params.search && params.searchFields) {
      const searchConditions = params.searchFields.map((field: any) => 
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
          true,
          error instanceof Error ? error.message : 'Unknown error'
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
          true,
          error instanceof Error ? error.message : 'Unknown error'
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
          true,
          error instanceof Error ? error.message : 'Unknown error'
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
          true,
          error instanceof Error ? error.message : 'Unknown error'
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
          true,
          error instanceof Error ? error.message : 'Unknown error'
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
      const { count, error } = await supabase
        .from(table)
        .select('*', { count: 'exact', head: true });

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
          true,
          error instanceof Error ? error.message : 'Unknown error'
        )
      };
    }
  }

  async getUserById(userId: string): Promise<any> {
    // Mock implementation
    return {
      id: userId,
      email: 'user@example.com',
      name: 'Test User',
      shopDomain: 'test-shop.myshopify.com',
      plan: 'free',
    };
  }

  async getUserNotifications(userId: string, options: any): Promise<any[]> {
    // Mock implementation
    return [];
  }

  async markNotificationAsRead(notificationId: string): Promise<void> {
    // Mock implementation
    console.log('Marking notification as read:', notificationId);
  }

  async disconnect(): Promise<void> {
    // Mock implementation
    console.log('Database disconnected');
  }

  async cleanupExpiredData(): Promise<void> {
    // Mock implementation
    console.log('Cleaning up expired data');
  }

  async healthCheck(): Promise<{ connected: boolean; latency?: number }> {
    try {
      const start = Date.now();
      // Simple query to test connection
      const { data, error } = await supabase.from('__health_check__').select('1').limit(1);
      const latency = Date.now() - start;
      
      return {
        connected: !error,
        latency
      };
    } catch (error) {
      return {
        connected: false
      };
    }
  }

  async getUserByEmail(email: string): Promise<any> {
    // Mock implementation
    return {
      id: 'mock-user-id',
      email,
      name: email.split('@')[0],
      shopDomain: 'mock-shop.myshopify.com',
      plan: 'free',
      role: 'user',
      createdAt: new Date(),
      updatedAt: new Date(),
    };
  }

  async createUser(userData: any): Promise<any> {
    // Mock implementation
    const user = {
      id: Date.now().toString(),
      ...userData,
      role: 'user',
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    console.log('Created user:', user);
    return user;
  }
}