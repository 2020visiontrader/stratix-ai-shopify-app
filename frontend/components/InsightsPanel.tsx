'use client';

import { useEffect, useState } from 'react';
import { apiClient } from '../src/lib/api-client';

export default function InsightsPanel() {
  const [loading, setLoading] = useState(true);
  const [insights, setInsights] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchInsights = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await apiClient.getInsightsMetrics();
        if (response.success && Array.isArray(response.data)) {
          setInsights(response.data);
        } else {
          setError(response.error || 'No insights found.');
        }
      } catch (err: any) {
        setError('Failed to load insights.');
      } finally {
        setLoading(false);
      }
    };
    fetchInsights();
  }, []);

  return (
    <div className="bg-white dark:bg-gray-800 shadow rounded-lg overflow-hidden">
      <div className="px-4 py-5 sm:px-6 border-b border-gray-200 dark:border-gray-700">
        <h3 className="text-lg font-medium text-gray-900 dark:text-white">Insights</h3>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">AI-powered analytics and discoveries</p>
      </div>
      
      <div className="p-4">
        {loading ? (
          // Loading state
          <div className="animate-pulse space-y-4">
            {[1, 2, 3].map((item) => (
              <div key={item} className="flex space-x-4">
                <div className="w-10 h-10 bg-gray-200 dark:bg-gray-700 rounded-full"></div>
                <div className="flex-1 space-y-2 py-1">
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
                  <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-5/6"></div>
                </div>
              </div>
            ))}
          </div>
        ) : error ? (
          <div className="text-red-600 dark:text-red-400">{error}</div>
        ) : insights.length === 0 ? (
          <div className="text-gray-500 dark:text-gray-400">No insights available.</div>
        ) : (
          // Insights list
          <div className="space-y-6">
            {insights.map((insight) => (
              <div key={insight.id} className="flex">
                <div className="mr-4 flex-shrink-0">
                  <svg className="h-10 w-10 text-purple-500 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div>
                  <h4 className="text-base font-medium text-gray-900 dark:text-white">{insight.title}</h4>
                  <p className="mt-1 text-sm text-gray-600 dark:text-gray-300">{insight.description}</p>
                  <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">Discovered {insight.createdAt ? new Date(insight.createdAt).toLocaleString() : ''}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      
      <div className="bg-gray-50 dark:bg-gray-750 px-4 py-4 sm:px-6">
        <div className="flex justify-between items-center">
          <span className="text-sm text-gray-500 dark:text-gray-400">Updated automatically</span>
          <button className="text-sm text-purple-600 hover:text-purple-500 dark:text-purple-400 dark:hover:text-purple-300">
            View All Insights →
          </button>
        </div>
      </div>
    </div>
  );
}
