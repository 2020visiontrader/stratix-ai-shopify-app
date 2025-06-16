import { useFeature } from '@/hooks/useFeature';
import { ChevronDownIcon, ChevronUpIcon, ExclamationCircleIcon } from '@heroicons/react/24/outline';
import React, { useState } from 'react';

interface FeatureSectionProps {
  featureId: string;
  title: string;
  description: string;
  children?: React.ReactNode;
  onRefresh?: () => Promise<void>;
  showMetrics?: boolean;
  showActions?: boolean;
}

export const FeatureSection: React.FC<FeatureSectionProps> = ({
  featureId,
  title,
  description,
  children,
  onRefresh,
  showMetrics = false,
  showActions = true
}) => {
  const { features } = useFeature();
  const [isExpanded, setIsExpanded] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [metrics, setMetrics] = useState<any>(null);

  const feature = features.sections.find(f => f.id === featureId);

  const handleRefresh = async () => {
    if (!onRefresh) return;
    
    try {
      setIsRefreshing(true);
      setError(null);
      await onRefresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to refresh');
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleExpand = () => {
    setIsExpanded(!isExpanded);
  };

  if (!feature || !feature.state.enabled) {
    return null;
  }

  return (
    <div className="bg-white shadow rounded-lg overflow-hidden">
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <div className="flex items-center">
              <h3 className="text-lg font-medium text-gray-900">{title}</h3>
              <span className={`ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                feature.state.loading ? 'bg-yellow-100 text-yellow-800' :
                feature.state.enabled ? 'bg-green-100 text-green-800' :
                'bg-gray-100 text-gray-800'
              }`}>
                {feature.state.loading ? 'Loading...' :
                 feature.state.enabled ? 'Enabled' :
                 'Disabled'}
              </span>
            </div>
            <p className="mt-1 text-sm text-gray-500">{description}</p>
          </div>
          
          <div className="flex items-center space-x-4">
            {showActions && (
              <>
                <button
                  onClick={handleRefresh}
                  disabled={isRefreshing}
                  className={`inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md ${
                    isRefreshing
                      ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                      : 'text-purple-700 bg-purple-100 hover:bg-purple-200'
                  } focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500`}
                >
                  {isRefreshing ? 'Refreshing...' : 'Refresh'}
                </button>
                <button
                  onClick={handleExpand}
                  className="text-gray-400 hover:text-gray-500"
                >
                  {isExpanded ? (
                    <ChevronUpIcon className="h-5 w-5" />
                  ) : (
                    <ChevronDownIcon className="h-5 w-5" />
                  )}
                </button>
              </>
            )}
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mt-2 flex items-center text-sm text-red-600">
            <ExclamationCircleIcon className="h-5 w-5 mr-2" />
            {error}
          </div>
        )}

        {/* Metrics */}
        {showMetrics && metrics && (
          <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-3">
            {Object.entries(metrics).map(([key, value]) => (
              <div key={key} className="bg-gray-50 rounded-lg p-3">
                <dt className="text-xs font-medium text-gray-500 uppercase">{key}</dt>
                <dd className="mt-1 text-lg font-semibold text-gray-900">{value}</dd>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Content */}
      {isExpanded && (
        <div className="px-6 py-4">
          {feature.state.loading ? (
            <div className="animate-pulse space-y-4">
              <div className="h-4 bg-gray-200 rounded w-3/4"></div>
              <div className="h-4 bg-gray-200 rounded"></div>
              <div className="h-4 bg-gray-200 rounded w-5/6"></div>
            </div>
          ) : (
            <div className="space-y-4">
              {children}
            </div>
          )}
        </div>
      )}

      {/* Footer */}
      {showActions && (
        <div className="px-6 py-3 bg-gray-50 border-t border-gray-200">
          <div className="flex justify-between items-center">
            <div className="text-sm text-gray-500">
              Last updated: {new Date(feature.metadata.updated).toLocaleString()}
            </div>
            <div className="text-xs text-gray-400">
              Version: {feature.metadata.version}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}; 