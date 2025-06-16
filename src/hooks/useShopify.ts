import { NetworkManager } from '@/lib/core/NetworkManager';
import { useCallback, useEffect, useState } from 'react';

interface ShopifyState {
  shop: {
    name: string;
    domain: string;
    plan: string;
  } | null;
  loading: boolean;
  error: string | null;
}

export const useShopify = () => {
  const [state, setState] = useState<ShopifyState>({
    shop: null,
    loading: true,
    error: null,
  });

  const fetchShopData = useCallback(async () => {
    setState(prev => ({ ...prev, loading: true, error: null }));
    try {
      const response = await NetworkManager.getInstance().get('/api/shopify/shop');
      setState({
        shop: response.data,
        loading: false,
        error: null,
      });
    } catch (error) {
      setState(prev => ({
        ...prev,
        loading: false,
        error: 'Failed to fetch shop data',
      }));
    }
  }, []);

  const fetchProducts = useCallback(async (params?: {
    limit?: number;
    page?: number;
    query?: string;
  }) => {
    try {
      const response = await NetworkManager.getInstance().get('/api/shopify/products', {
        params,
      });
      return response.data;
    } catch (error) {
      throw new Error('Failed to fetch products');
    }
  }, []);

  const fetchOrders = useCallback(async (params?: {
    limit?: number;
    page?: number;
    status?: string;
  }) => {
    try {
      const response = await NetworkManager.getInstance().get('/api/shopify/orders', {
        params,
      });
      return response.data;
    } catch (error) {
      throw new Error('Failed to fetch orders');
    }
  }, []);

  const fetchCustomers = useCallback(async (params?: {
    limit?: number;
    page?: number;
    query?: string;
  }) => {
    try {
      const response = await NetworkManager.getInstance().get('/api/shopify/customers', {
        params,
      });
      return response.data;
    } catch (error) {
      throw new Error('Failed to fetch customers');
    }
  }, []);

  const updateShopSettings = useCallback(async (settings: Record<string, any>) => {
    try {
      const response = await NetworkManager.getInstance().patch('/api/shopify/settings', settings);
      return response.data;
    } catch (error) {
      throw new Error('Failed to update shop settings');
    }
  }, []);

  useEffect(() => {
    fetchShopData();
  }, [fetchShopData]);

  return {
    ...state,
    fetchProducts,
    fetchOrders,
    fetchCustomers,
    updateShopSettings,
    refresh: fetchShopData,
  };
}; 