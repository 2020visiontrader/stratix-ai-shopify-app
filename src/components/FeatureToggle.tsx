import { Feature } from '@/lib/core/FeatureManager';
import { Switch } from '@headlessui/react';
import { ExclamationTriangleIcon, InformationCircleIcon } from '@heroicons/react/24/outline';
import React, { useState } from 'react';

interface FeatureToggleProps {
  feature: Feature;
  onToggle: (enabled: boolean) => void;
  showTooltip?: boolean;
  requireConfirmation?: boolean;
  onDependencyWarning?: (dependencies: string[]) => void;
}

export const FeatureToggle: React.FC<FeatureToggleProps> = ({
  feature,
  onToggle,
  showTooltip = true,
  requireConfirmation = false,
  onDependencyWarning
}) => {
  const [isHovered, setIsHovered] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [pendingToggle, setPendingToggle] = useState<boolean | null>(null);

  const handleToggle = (enabled: boolean) => {
    if (requireConfirmation) {
      setPendingToggle(enabled);
      setShowConfirmDialog(true);
    } else {
      onToggle(enabled);
    }
  };

  const handleConfirm = () => {
    if (pendingToggle !== null) {
      onToggle(pendingToggle);
      setShowConfirmDialog(false);
      setPendingToggle(null);
    }
  };

  const handleCancel = () => {
    setShowConfirmDialog(false);
    setPendingToggle(null);
  };

  const checkDependencies = () => {
    if (feature.config.dependencies && feature.config.dependencies.length > 0) {
      onDependencyWarning?.(feature.config.dependencies);
    }
  };

  return (
    <div className="bg-white shadow rounded-lg p-4">
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <div className="flex items-center">
            <h3 className="text-sm font-medium text-gray-900">{feature.name}</h3>
            {showTooltip && (
              <div
                className="relative ml-2"
                onMouseEnter={() => setIsHovered(true)}
                onMouseLeave={() => setIsHovered(false)}
              >
                <InformationCircleIcon className="h-4 w-4 text-gray-400" />
                {isHovered && (
                  <div className="absolute z-10 w-64 p-2 mt-1 text-xs text-gray-600 bg-white border border-gray-200 rounded-md shadow-lg">
                    {feature.description}
                    {feature.config.dependencies && feature.config.dependencies.length > 0 && (
                      <div className="mt-1 pt-1 border-t border-gray-100">
                        <p className="font-medium">Dependencies:</p>
                        <ul className="list-disc list-inside">
                          {feature.config.dependencies.map((dep) => (
                            <li key={dep}>{dep}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
          <p className="text-sm text-gray-500">{feature.description}</p>
          {feature.config.requiresAuth && (
            <p className="mt-1 text-xs text-purple-600">Requires authentication</p>
          )}
        </div>
        <div className="flex items-center space-x-4">
          <Switch
            checked={feature.state.enabled}
            onChange={handleToggle}
            disabled={feature.state.loading}
            className={`${
              feature.state.enabled ? 'bg-purple-600' : 'bg-gray-200'
            } relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2`}
          >
            <span
              className={`${
                feature.state.enabled ? 'translate-x-6' : 'translate-x-1'
              } inline-block h-4 w-4 transform rounded-full bg-white transition-transform`}
            />
          </Switch>
        </div>
      </div>

      {/* Loading State */}
      {feature.state.loading && (
        <div className="mt-2">
          <div className="animate-pulse h-2 bg-gray-200 rounded"></div>
        </div>
      )}

      {/* Confirmation Dialog */}
      {showConfirmDialog && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-sm w-full mx-4">
            <div className="flex items-center mb-4">
              <ExclamationTriangleIcon className="h-6 w-6 text-yellow-400 mr-2" />
              <h3 className="text-lg font-medium text-gray-900">Confirm Change</h3>
            </div>
            <p className="text-sm text-gray-500 mb-4">
              Are you sure you want to {pendingToggle ? 'enable' : 'disable'} this feature?
              {feature.config.dependencies && feature.config.dependencies.length > 0 && (
                <span className="block mt-2 text-yellow-600">
                  This feature has dependencies that may be affected.
                </span>
              )}
            </p>
            <div className="flex justify-end space-x-3">
              <button
                onClick={handleCancel}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirm}
                className="px-4 py-2 text-sm font-medium text-white bg-purple-600 hover:bg-purple-700 rounded-md"
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Footer */}
      <div className="mt-4 pt-3 border-t border-gray-100">
        <div className="flex justify-between items-center text-xs text-gray-400">
          <span>Version: {feature.metadata.version}</span>
          <span>Last updated: {new Date(feature.metadata.updated).toLocaleDateString()}</span>
        </div>
      </div>
    </div>
  );
}; 