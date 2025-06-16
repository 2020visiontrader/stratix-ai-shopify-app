import React, { createContext, useContext, useEffect, useState } from 'react';
import { FeatureManager } from '../lib/core/FeatureManager';

interface FeatureContextType {
  features: Map<string, any>;
  isFeatureEnabled: (featureId: string) => boolean;
  isFeatureVisible: (featureId: string) => boolean;
  toggleFeature: (featureId: string, enabled: boolean) => Promise<void>;
  showFeature: (featureId: string, visible: boolean) => Promise<void>;
  loading: boolean;
  error: string | undefined;
}

const FeatureContext = createContext<FeatureContextType | undefined>(undefined);

export const useFeature = () => {
  const context = useContext(FeatureContext);
  if (!context) {
    throw new Error('useFeature must be used within a FeatureProvider');
  }
  return context;
};

interface FeatureProviderProps {
  children: React.ReactNode;
}

export const FeatureProvider: React.FC<FeatureProviderProps> = ({ children }) => {
  const [features, setFeatures] = useState<Map<string, any>>(new Map());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | undefined>();

  useEffect(() => {
    const initializeFeatures = async () => {
      try {
        const featureManager = FeatureManager.getInstance();
        await featureManager.initialize();
        const allFeatures = await featureManager.getAllFeatures();
        setFeatures(new Map(allFeatures.map(f => [f.id, f])));
      } catch (error) {
        setError(error instanceof Error ? error.message : 'Failed to initialize features');
      } finally {
        setLoading(false);
      }
    };

    initializeFeatures();
  }, []);

  const isFeatureEnabled = (featureId: string): boolean => {
    const feature = features.get(featureId);
    return feature?.state.enabled || false;
  };

  const isFeatureVisible = (featureId: string): boolean => {
    const feature = features.get(featureId);
    return feature?.state.visible || false;
  };

  const toggleFeature = async (featureId: string, enabled: boolean): Promise<void> => {
    try {
      const featureManager = FeatureManager.getInstance();
      const updatedFeature = await featureManager.toggleFeature(
        featureId,
        enabled,
        'User toggled feature'
      );
      setFeatures(prev => new Map(prev).set(featureId, updatedFeature));
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to toggle feature');
      throw error;
    }
  };

  const showFeature = async (featureId: string, visible: boolean): Promise<void> => {
    try {
      const featureManager = FeatureManager.getInstance();
      const updatedFeature = await featureManager.showFeature(
        featureId,
        visible,
        'User changed feature visibility'
      );
      setFeatures(prev => new Map(prev).set(featureId, updatedFeature));
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to change feature visibility');
      throw error;
    }
  };

  const value: FeatureContextType = {
    features,
    isFeatureEnabled,
    isFeatureVisible,
    toggleFeature,
    showFeature,
    loading,
    error
  };

  return (
    <FeatureContext.Provider value={value}>
      {children}
    </FeatureContext.Provider>
  );
}; 