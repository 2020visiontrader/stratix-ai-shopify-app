import { FeatureManager } from '@/lib/core/FeatureManager';
import { useCallback, useEffect, useState } from 'react';

export interface FeatureState {
  enabled: boolean;
  loading: boolean;
  error: string | null;
}

export const useFeature = (featureId: string) => {
  const [state, setState] = useState<FeatureState>({
    enabled: false,
    loading: true,
    error: null,
  });

  const fetchFeatureState = useCallback(async () => {
    setState(prev => ({ ...prev, loading: true, error: null }));
    try {
      const feature = await FeatureManager.getInstance().getFeature(featureId);
      setState({
        enabled: feature.enabled,
        loading: false,
        error: null,
      });
    } catch (error) {
      setState(prev => ({
        ...prev,
        loading: false,
        error: 'Failed to fetch feature state',
      }));
    }
  }, [featureId]);

  const toggleFeature = useCallback(async () => {
    setState(prev => ({ ...prev, loading: true, error: null }));
    try {
      const newState = !state.enabled;
      await FeatureManager.getInstance().updateFeature(featureId, {
        enabled: newState,
      });
      setState(prev => ({
        ...prev,
        enabled: newState,
        loading: false,
      }));
    } catch (error) {
      setState(prev => ({
        ...prev,
        loading: false,
        error: 'Failed to toggle feature',
      }));
    }
  }, [featureId, state.enabled]);

  useEffect(() => {
    fetchFeatureState();
  }, [fetchFeatureState]);

  return {
    ...state,
    toggle: toggleFeature,
    refresh: fetchFeatureState,
  };
}; 