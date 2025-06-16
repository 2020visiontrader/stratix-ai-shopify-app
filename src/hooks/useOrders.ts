import { NetworkManager } from '@/lib/core/NetworkManager';
import { useCallback, useEffect, useState } from 'react';

interface Order {
  id: string;
  orderNumber: string;
  customer: {
    id: string;
    name: string;
    email: string;
  };
  items: OrderItem[];
  total: number;
  status: 'pending' | 'processing' | 'completed' | 'cancelled';
  paymentStatus: 'pending' | 'paid' | 'refunded';
  fulfillmentStatus: 'unfulfilled' | 'fulfilled' | 'partially_fulfilled';
  createdAt: string;
  updatedAt: string;
  metadata: Record<string, any>;
}

interface OrderItem {
  id: string;
  productId: string;
  variantId: string;
  title: string;
  quantity: number;
  price: number;
  total: number;
}

interface OrdersState {
  orders: Order[];
  loading: boolean;
  error: string | null;
  total: number;
  page: number;
  hasMore: boolean;
}

export const useOrders = () => {
  const [state, setState] = useState<OrdersState>({
    orders: [],
    loading: false,
    error: null,
    total: 0,
    page: 1,
    hasMore: true,
  });

  const fetchOrders = useCallback(async (params?: {
    page?: number;
    limit?: number;
    status?: string;
    paymentStatus?: string;
    fulfillmentStatus?: string;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
  }) => {
    setState(prev => ({ ...prev, loading: true, error: null }));
    try {
      const response = await NetworkManager.getInstance().get('/api/orders', { params });
      setState(prev => ({
        orders: params?.page === 1 ? response.data.orders : [...prev.orders, ...response.data.orders],
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
        error: 'Failed to fetch orders',
      }));
    }
  }, []);

  const updateOrderStatus = useCallback(async (id: string, status: Order['status']) => {
    try {
      const response = await NetworkManager.getInstance().patch(`/api/orders/${id}/status`, { status });
      setState(prev => ({
        ...prev,
        orders: prev.orders.map(o => o.id === id ? response.data : o),
      }));
      return response.data;
    } catch (error) {
      throw new Error('Failed to update order status');
    }
  }, []);

  const updatePaymentStatus = useCallback(async (id: string, status: Order['paymentStatus']) => {
    try {
      const response = await NetworkManager.getInstance().patch(`/api/orders/${id}/payment`, { status });
      setState(prev => ({
        ...prev,
        orders: prev.orders.map(o => o.id === id ? response.data : o),
      }));
      return response.data;
    } catch (error) {
      throw new Error('Failed to update payment status');
    }
  }, []);

  const updateFulfillmentStatus = useCallback(async (id: string, status: Order['fulfillmentStatus']) => {
    try {
      const response = await NetworkManager.getInstance().patch(`/api/orders/${id}/fulfillment`, { status });
      setState(prev => ({
        ...prev,
        orders: prev.orders.map(o => o.id === id ? response.data : o),
      }));
      return response.data;
    } catch (error) {
      throw new Error('Failed to update fulfillment status');
    }
  }, []);

  const cancelOrder = useCallback(async (id: string, reason?: string) => {
    try {
      const response = await NetworkManager.getInstance().post(`/api/orders/${id}/cancel`, { reason });
      setState(prev => ({
        ...prev,
        orders: prev.orders.map(o => o.id === id ? response.data : o),
      }));
      return response.data;
    } catch (error) {
      throw new Error('Failed to cancel order');
    }
  }, []);

  const loadMore = useCallback(() => {
    if (state.hasMore && !state.loading) {
      fetchOrders({ page: state.page + 1 });
    }
  }, [state.hasMore, state.loading, state.page, fetchOrders]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  return {
    ...state,
    fetchOrders,
    updateOrderStatus,
    updatePaymentStatus,
    updateFulfillmentStatus,
    cancelOrder,
    loadMore,
  };
}; 