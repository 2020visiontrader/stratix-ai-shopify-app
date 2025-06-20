'use client';

import { useState, useEffect } from 'react';

export default function RecommendationsPanel() {
  const [loading, setLoading] = useState(true);
  const [recommendations, setRecommendations] = useState<any[]>([]);

  useEffect(() => {
    const fetchRecommendations = async () => {
      // In a real app, fetch from API
      setTimeout(() => {
        setRecommendations([
          {
            id: 1,
            title: 'Update product descriptions',
            impact: 'high',
            category: 'content',
            description: 'Adding more detailed product features and benefits could increase conversion rates by 15%.'
          },
          {
            id: 2,
            title: 'A/B test your checkout flow',
            impact: 'medium',
            category: 'testing',
            description: 'Current checkout completion rate is below industry average. Test a simplified version.'
          },
          {
            id: 3,
            title: 'Create targeted campaign',
            impact: 'high',
            category: 'marketing',
            description: 'Customer segment analysis shows opportunity for a specialized campaign targeting returning customers.'
          }
        ]);
        setLoading(false);
      }, 1200);
    };

    fetchRecommendations();
  }, []);

  // Get impact color
  const getImpactColor = (impact: string) => {
    switch (impact) {
      case 'high':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      case 'low':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
    }
  };

  // Get category badge
  const getCategoryBadge = (category: string) => {
    switch (category) {
      case 'content':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case 'testing':
        return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200';
      case 'marketing':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 shadow rounded-lg overflow-hidden">
      <div className="px-4 py-5 sm:px-6 border-b border-gray-200 dark:border-gray-700">
        <h3 className="text-lg font-medium text-gray-900 dark:text-white">Recommendations</h3>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">AI-powered suggestions to optimize your store</p>
      </div>
      
      <div className="p-4">
        {loading ? (
          // Loading state
          <div className="animate-pulse space-y-4">
            {[1, 2, 3].map((item) => (
              <div key={item} className="border border-gray-200 dark:border-gray-700 rounded-md p-4">
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-2"></div>
                <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2 mb-3"></div>
                <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-5/6"></div>
              </div>
            ))}
          </div>
        ) : (
          // Recommendations list
          <div className="space-y-4">
            {recommendations.map((rec) => (
              <div key={rec.id} className="border border-gray-200 dark:border-gray-700 rounded-md p-4 hover:bg-gray-50 dark:hover:bg-gray-750 transition-colors duration-150">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-base font-medium text-gray-900 dark:text-white">{rec.title}</h4>
                  <div className="flex gap-2">
                    <span className={`px-2 py-1 text-xs font-medium rounded ${getImpactColor(rec.impact)}`}>
                      {rec.impact}
                    </span>
                    <span className={`px-2 py-1 text-xs font-medium rounded ${getCategoryBadge(rec.category)}`}>
                      {rec.category}
                    </span>
                  </div>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-300">{rec.description}</p>
                <div className="mt-3 flex justify-end">
                  <button className="text-sm text-purple-600 hover:text-purple-500 dark:text-purple-400 dark:hover:text-purple-300">
                    Take action →
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      
      <div className="bg-gray-50 dark:bg-gray-750 px-4 py-4 sm:px-6">
        <div className="flex justify-center">
          <button className="px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500">
            View All Recommendations
          </button>
        </div>
      </div>
    </div>
  );
}
