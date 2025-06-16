import { Tab } from '@headlessui/react';
import React, { useEffect, useState } from 'react';
import { FeatureManager } from '../lib/core/FeatureManager';

interface FeatureTabProps {
  featureId: string;
  label?: string;
  description?: string;
  children: React.ReactNode;
  className?: string;
}

export const FeatureTab: React.FC<FeatureTabProps> = ({
  featureId,
  label,
  description,
  children,
  className = ''
}) => {
  const [enabled, setEnabled] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | undefined>();
  const [feature, setFeature] = useState<any>(null);

  useEffect(() => {
    const loadFeature = async () => {
      try {
        const featureManager = FeatureManager.getInstance();
        const feature = await featureManager.getFeature(featureId);
        if (feature) {
          setFeature(feature);
          setEnabled(feature.state.enabled);
        }
      } catch (error) {
        setError(error instanceof Error ? error.message : 'Failed to load feature');
      }
    };

    loadFeature();
  }, [featureId]);

  if (!feature || !enabled) {
    return null;
  }

  return (
    <Tab
      className={({ selected }) =>
        `w-full rounded-lg py-2.5 text-sm font-medium leading-5
        ${selected
          ? 'bg-purple-100 text-purple-700 shadow'
          : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
        }
        ${className}`
      }
    >
      <div className="flex flex-col">
        <span className="text-sm font-medium">
          {label || feature.name}
        </span>
        {(description || feature.description) && (
          <span className="text-xs text-gray-500">
            {description || feature.description}
          </span>
        )}
        {error && (
          <span className="text-xs text-red-500 mt-1">{error}</span>
        )}
      </div>
      {children}
    </Tab>
  );
}; 