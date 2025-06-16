import { useSecurity } from '@/hooks/useSecurity';
import { ExclamationTriangleIcon, ShieldCheckIcon } from '@heroicons/react/24/outline';
import React from 'react';

export const SecurityStatus: React.FC = () => {
  const { securityStatus, checkSecurity } = useSecurity();

  return (
    <div className="bg-white shadow rounded-lg p-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          {securityStatus.isSecure ? (
            <ShieldCheckIcon className="h-6 w-6 text-green-500" />
          ) : (
            <ExclamationTriangleIcon className="h-6 w-6 text-red-500" />
          )}
          <div className="ml-3">
            <h3 className="text-sm font-medium text-gray-900">
              Security Status
            </h3>
            <p className="text-sm text-gray-500">
              Last checked: {new Date(securityStatus.lastCheck).toLocaleString()}
            </p>
          </div>
        </div>
        <button
          onClick={() => checkSecurity()}
          className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md text-purple-700 bg-purple-100 hover:bg-purple-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
        >
          Check Now
        </button>
      </div>
      {securityStatus.issues.length > 0 && (
        <div className="mt-4">
          <h4 className="text-sm font-medium text-gray-900">Issues Found:</h4>
          <ul className="mt-2 space-y-2">
            {securityStatus.issues.map((issue, index) => (
              <li key={index} className="text-sm text-red-600">
                {issue}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}; 