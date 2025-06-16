import { useState, useCallback, useEffect } from 'react';
import { NetworkManager } from '@/lib/core/NetworkManager';

interface SettingsState {
  settings: Record<string, any>;
  loading: boolean;
  error: string | null;
}

export const useSettings = () => {
  const [state, setState] = useState<SettingsState>({
    settings: {},
    loading: true,
    error: null,
  });

  const fetchSettings = useCallback(async () => {
    setState(prev => ({ ...prev, loading: true, error: null }));
    try {
      const response = await NetworkManager.getInstance().get('/api/settings');
      setState({
        settings: response.data,
        loading: false,
        error: null,
      });
    } catch (error) {
      setState(prev => ({
        ...prev,
        loading: false,
        error: 'Failed to fetch settings',
      }));
    }
  }, []);

  const updateSettings = useCallback(async (newSettings: Record<string, any>) => {
    setState(prev => ({ ...prev, loading: true, error: null }));
    try {
      const response = await NetworkManager.getInstance().patch('/api/settings', newSettings);
      setState(prev => ({
        ...prev,
        settings: response.data,
        loading: false,
      }));
    } catch (error) {
      setState(prev => ({
        ...prev,
        loading: false,
        error: 'Failed to update settings',
      }));
    }
  }, []);

  const resetSettings = useCallback(async () => {
    setState(prev => ({ ...prev, loading: true, error: null }));
    try {
      const response = await NetworkManager.getInstance().post('/api/settings/reset');
      setState({
        settings: response.data,
        loading: false,
        error: null,
      });
    } catch (error) {
      setState(prev => ({
        ...prev,
        loading: false,
        error: 'Failed to reset settings',
      }));
    }
  }, []);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  return {
    ...state,
    updateSettings,
    resetSettings,
    refresh: fetchSettings,
  };
}; 