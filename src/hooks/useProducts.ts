import { NetworkManager } from '@/lib/core/NetworkManager';
import { useCallback, useEffect, useState } from 'react';

interface Product {
  id: string;
  title: string;
  description: string;
  price: number;
  compareAtPrice?: number;
  inventory: number;
  status: 'active' | 'draft' | 'archived';
  images: string[];
  variants: ProductVariant[];
  tags: string[];
  metadata: Record<string, any>;
}

interface ProductVariant {
  id: string;
  title: string;
  price: number;
  compareAtPrice?: number;
  inventory: number;
  sku: string;
  barcode?: string;
}

interface ProductsState {
  products: Product[];
  loading: boolean;
  error: string | null;
  total: number;
  page: number;
  hasMore: boolean;
}

export const useProducts = () => {
  const [state, setState] = useState<ProductsState>({
    products: [],
    loading: false,
    error: null,
    total: 0,
    page: 1,
    hasMore: true,
  });

  const fetchProducts = useCallback(async (params?: {
    page?: number;
    limit?: number;
    query?: string;
    status?: string;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
  }) => {
    setState(prev => ({ ...prev, loading: true, error: null }));
    try {
      const response = await NetworkManager.getInstance().get('/api/products', { params });
      setState(prev => ({
        products: params?.page === 1 ? response.data.products : [...prev.products, ...response.data.products],
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
        error: 'Failed to fetch products',
      }));
    }
  }, []);

  const createProduct = useCallback(async (product: Omit<Product, 'id'>) => {
    try {
      const response = await NetworkManager.getInstance().post('/api/products', product);
      setState(prev => ({
        ...prev,
        products: [response.data, ...prev.products],
        total: prev.total + 1,
      }));
      return response.data;
    } catch (error) {
      throw new Error('Failed to create product');
    }
  }, []);

  const updateProduct = useCallback(async (id: string, updates: Partial<Product>) => {
    try {
      const response = await NetworkManager.getInstance().patch(`/api/products/${id}`, updates);
      setState(prev => ({
        ...prev,
        products: prev.products.map(p => p.id === id ? response.data : p),
      }));
      return response.data;
    } catch (error) {
      throw new Error('Failed to update product');
    }
  }, []);

  const deleteProduct = useCallback(async (id: string) => {
    try {
      await NetworkManager.getInstance().delete(`/api/products/${id}`);
      setState(prev => ({
        ...prev,
        products: prev.products.filter(p => p.id !== id),
        total: prev.total - 1,
      }));
    } catch (error) {
      throw new Error('Failed to delete product');
    }
  }, []);

  const bulkUpdateProducts = useCallback(async (updates: { id: string; updates: Partial<Product> }[]) => {
    try {
      const response = await NetworkManager.getInstance().patch('/api/products/bulk', { updates });
      setState(prev => ({
        ...prev,
        products: prev.products.map(p => {
          const update = updates.find(u => u.id === p.id);
          return update ? { ...p, ...update.updates } : p;
        }),
      }));
      return response.data;
    } catch (error) {
      throw new Error('Failed to bulk update products');
    }
  }, []);

  const loadMore = useCallback(() => {
    if (state.hasMore && !state.loading) {
      fetchProducts({ page: state.page + 1 });
    }
  }, [state.hasMore, state.loading, state.page, fetchProducts]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  return {
    ...state,
    fetchProducts,
    createProduct,
    updateProduct,
    deleteProduct,
    bulkUpdateProducts,
    loadMore,
  };
}; 