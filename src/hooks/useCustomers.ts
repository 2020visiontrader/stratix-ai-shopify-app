import { NetworkManager } from '@/lib/core/NetworkManager';
import { useCallback, useEffect, useState } from 'react';

interface Customer {
  id: string;
  name: string;
  email: string;
  phone?: string;
  totalOrders: number;
  totalSpent: number;
  lastOrderDate?: string;
  tags: string[];
  metadata: Record<string, any>;
}

interface CustomersState {
  customers: Customer[];
  loading: boolean;
  error: string | null;
  total: number;
  page: number;
  hasMore: boolean;
}

export const useCustomers = () => {
  const [state, setState] = useState<CustomersState>({
    customers: [],
    loading: false,
    error: null,
    total: 0,
    page: 1,
    hasMore: true,
  });

  const fetchCustomers = useCallback(async (params?: {
    page?: number;
    limit?: number;
    query?: string;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
  }) => {
    setState(prev => ({ ...prev, loading: true, error: null }));
    try {
      const response = await NetworkManager.getInstance().get('/api/customers', { params });
      setState(prev => ({
        customers: params?.page === 1 ? response.data.customers : [...prev.customers, ...response.data.customers],
        total: response.data.total,
        page: params?.page || 1,
        hasMore: response.data.hasMore,
        loading: false,
        error: null,
      }));
    } catch (error) {
      setState(prev => ({
        ...prev,
        loading: false,
        error: 'Failed to fetch customers',
      }));
    }
  }, []);

  const createCustomer = useCallback(async (customer: Omit<Customer, 'id' | 'totalOrders' | 'totalSpent'>) => {
    try {
      const response = await NetworkManager.getInstance().post('/api/customers', customer);
      setState(prev => ({
        ...prev,
        customers: [response.data, ...prev.customers],
        total: prev.total + 1,
      }));
      return response.data;
    } catch (error) {
      throw new Error('Failed to create customer');
    }
  }, []);

  const updateCustomer = useCallback(async (id: string, updates: Partial<Customer>) => {
    try {
      const response = await NetworkManager.getInstance().patch(`/api/customers/${id}`, updates);
      setState(prev => ({
        ...prev,
        customers: prev.customers.map(c => c.id === id ? response.data : c),
      }));
      return response.data;
    } catch (error) {
      throw new Error('Failed to update customer');
    }
  }, []);

  const deleteCustomer = useCallback(async (id: string) => {
    try {
      await NetworkManager.getInstance().delete(`/api/customers/${id}`);
      setState(prev => ({
        ...prev,
        customers: prev.customers.filter(c => c.id !== id),
        total: prev.total - 1,
      }));
    } catch (error) {
      throw new Error('Failed to delete customer');
    }
  }, []);

  const addCustomerTag = useCallback(async (id: string, tag: string) => {
    try {
      const response = await NetworkManager.getInstance().post(`/api/customers/${id}/tags`, { tag });
      setState(prev => ({
        ...prev,
        customers: prev.customers.map(c => c.id === id ? response.data : c),
      }));
      return response.data;
    } catch (error) {
      throw new Error('Failed to add customer tag');
    }
  }, []);

  const removeCustomerTag = useCallback(async (id: string, tag: string) => {
    try {
      const response = await NetworkManager.getInstance().delete(`/api/customers/${id}/tags/${tag}`);
      setState(prev => ({
        ...prev,
        customers: prev.customers.map(c => c.id === id ? response.data : c),
      }));
      return response.data;
    } catch (error) {
      throw new Error('Failed to remove customer tag');
    }
  }, []);

  const loadMore = useCallback(() => {
    if (state.hasMore && !state.loading) {
      fetchCustomers({ page: state.page + 1 });
    }
  }, [state.hasMore, state.loading, state.page, fetchCustomers]);

  useEffect(() => {
    fetchCustomers();
  }, [fetchCustomers]);

  return {
    ...state,
    fetchCustomers,
    createCustomer,
    updateCustomer,
    deleteCustomer,
    addCustomerTag,
    removeCustomerTag,
    loadMore,
  };
}; 