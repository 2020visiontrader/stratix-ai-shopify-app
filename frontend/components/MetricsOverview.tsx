'use client';

import {
    ArrowTrendingDownIcon,
    ArrowTrendingUpIcon,
    BeakerIcon,
    BoltIcon,
    ChartBarIcon,
    CurrencyDollarIcon,
    ExclamationTriangleIcon,
    UserGroupIcon
} from '@heroicons/react/24/outline';
import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';

interface MetricData {
  totalRevenue: number;
  conversionRate: number;
  activeTests: number;
  customerSegments: number;
  brandScore: number;
  aiOptimizations: number;
  timeframe?: string;
  periodComparison?: {
    totalRevenue: number;
    conversionRate: number;
    activeTests: number;
    customerSegments: number;
    brandScore: number;
    aiOptimizations: number;
  };
  topPerformers?: Array<{
    id: string;
    name: string;
    revenue: number;
    growth: number;
  }>;
  recentActivity?: Array<{
    id: number;
    type: string;
    title: string;
    timestamp: string | Date;
    status: string;
  }>;
}

interface Props {
  metrics?: {
    totalRevenue: number;
    conversionRate: number;
    activeTests: number;
    customerSegments: number;
    brandScore: number;
    aiOptimizations: number;
  };
}

export default function MetricsOverview({ metrics: propMetrics }: Props) {
  const [metrics, setMetrics] = useState<MetricData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [timeframe, setTimeframe] = useState<string>('last30days');

  useEffect(() => {
    if (propMetrics) {
      // If metrics are passed as props, use them directly
      setMetrics({
        totalRevenue: propMetrics.totalRevenue,
        conversionRate: propMetrics.conversionRate,
        activeTests: propMetrics.activeTests,
        customerSegments: propMetrics.customerSegments,
        brandScore: propMetrics.brandScore,
        aiOptimizations: propMetrics.aiOptimizations,
        periodComparison: {
          totalRevenue: 12.5,
          conversionRate: 3.2,
          activeTests: 25.0,
          customerSegments: 8.1,
          brandScore: 15.3,
          aiOptimizations: 42.1
        }
      });
      setIsLoading(false);
    } else {
      fetchMetrics();
    }
  }, [timeframe, propMetrics]);

  const fetchMetrics = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const response = await fetch(`/api/analytics/metrics?timeframe=${timeframe}`);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch metrics: ${response.status}`);
      }
      
      const data = await response.json();
      
      // Format dates in recentActivity if they're strings
      if (data.metrics?.recentActivity) {
        data.metrics.recentActivity = data.metrics.recentActivity.map((activity: any) => ({
          ...activity,
          timestamp: typeof activity.timestamp === 'string' 
            ? new Date(activity.timestamp) 
            : activity.timestamp
        }));
      }
      
      setMetrics(data.metrics);
    } catch (err) {
      console.error('Error fetching metrics:', err);
      setError('Failed to load metrics data');
    } finally {
      setIsLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric'
    });
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 mb-6">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="bg-white dark:bg-gray-800 rounded-lg shadow p-5 animate-pulse">
            <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-1/3 mb-2"></div>
            <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-2/3 mb-4"></div>
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
          </div>
        ))}
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-5 mb-6">
        <div className="flex items-center text-red-500">
          <ExclamationTriangleIcon className="h-6 w-6 mr-2" />
          <h3 className="font-medium">Error Loading Metrics</h3>
        </div>
        <p className="mt-2 text-gray-600 dark:text-gray-300">{error}</p>
        <button 
          onClick={fetchMetrics}
          className="mt-4 px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700 transition-colors"
        >
          Retry
        </button>
      </div>
    );
  }

  // If no data yet
  if (!metrics) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-5 mb-6">
        <p className="text-gray-600 dark:text-gray-300">No metrics data available</p>
      </div>
    );
  }

  const metricCards = [
    {
      name: 'Total Revenue',
      value: formatCurrency(metrics.totalRevenue),
      change: metrics.periodComparison?.totalRevenue 
        ? `${metrics.periodComparison.totalRevenue > 0 ? '+' : ''}${metrics.periodComparison.totalRevenue.toFixed(1)}%`
        : undefined,
      changeType: metrics.periodComparison?.totalRevenue && metrics.periodComparison.totalRevenue > 0 ? 'increase' : 'decrease',
      icon: CurrencyDollarIcon,
      color: 'green',
      description: 'Monthly revenue'
    },
    {
      name: 'Conversion Rate',
      value: `${metrics.conversionRate}%`,
      change: metrics.periodComparison?.conversionRate 
        ? `${metrics.periodComparison.conversionRate > 0 ? '+' : ''}${metrics.periodComparison.conversionRate.toFixed(1)}%`
        : undefined,
      changeType: metrics.periodComparison?.conversionRate && metrics.periodComparison.conversionRate > 0 ? 'increase' : 'decrease',
      icon: ChartBarIcon,
      color: 'blue',
      description: 'Store conversion rate'
    },
    {
      name: 'Active Tests',
      value: metrics.activeTests.toString(),
      change: metrics.periodComparison?.activeTests 
        ? `${metrics.periodComparison.activeTests > 0 ? '+' : ''}${metrics.periodComparison.activeTests}`
        : undefined,
      changeType: metrics.periodComparison?.activeTests && metrics.periodComparison.activeTests > 0 ? 'increase' : 'decrease',
      icon: BeakerIcon,
      color: 'purple',
      description: 'Running A/B tests'
    },
    {
      name: 'Customer Segments',
      value: metrics.customerSegments.toString(),
      change: metrics.periodComparison?.customerSegments 
        ? `${metrics.periodComparison.customerSegments > 0 ? '+' : ''}${metrics.periodComparison.customerSegments}`
        : undefined,
      changeType: metrics.periodComparison?.customerSegments && metrics.periodComparison.customerSegments > 0 ? 'increase' : 'decrease',
      icon: UserGroupIcon,
      color: 'indigo',
      description: 'Active segments'
    },
    {
      name: 'Brand Score',
      value: metrics.brandScore.toString(),
      change: metrics.periodComparison?.brandScore 
        ? `${metrics.periodComparison.brandScore > 0 ? '+' : ''}${metrics.periodComparison.brandScore.toFixed(1)}`
        : undefined,
      changeType: metrics.periodComparison?.brandScore && metrics.periodComparison.brandScore > 0 ? 'increase' : 'decrease',
      icon: ChartBarIcon,
      color: 'yellow',
      description: 'Overall brand health'
    },
    {
      name: 'AI Optimizations',
      value: metrics.aiOptimizations.toString(),
      change: metrics.periodComparison?.aiOptimizations 
        ? `${metrics.periodComparison.aiOptimizations > 0 ? '+' : ''}${metrics.periodComparison.aiOptimizations.toFixed(1)}`
        : undefined,
      changeType: metrics.periodComparison?.aiOptimizations && metrics.periodComparison.aiOptimizations > 0 ? 'increase' : 'decrease',
      icon: BoltIcon,
      color: 'orange',
      description: 'AI-generated improvements'
    }
  ];

  return (
    <div>
      {/* Timeframe selector */}
      <div className="flex justify-end mb-4">
        <div className="inline-flex rounded-md shadow-sm">
          <button
            type="button"
            onClick={() => setTimeframe('last7days')}
            className={`relative inline-flex items-center px-3 py-2 text-sm font-medium rounded-l-md ${
              timeframe === 'last7days' 
                ? 'bg-purple-600 text-white' 
                : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
            }`}
          >
            7 days
          </button>
          <button
            type="button"
            onClick={() => setTimeframe('last30days')}
            className={`relative -ml-px inline-flex items-center px-3 py-2 text-sm font-medium ${
              timeframe === 'last30days' 
                ? 'bg-purple-600 text-white' 
                : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
            }`}
          >
            30 days
          </button>
          <button
            type="button"
            onClick={() => setTimeframe('last90days')}
            className={`relative -ml-px inline-flex items-center px-3 py-2 text-sm font-medium rounded-r-md ${
              timeframe === 'last90days' 
                ? 'bg-purple-600 text-white' 
                : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
            }`}
          >
            90 days
          </button>
        </div>
      </div>
      
      {/* Metrics grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 mb-6">
        {metricCards.map((card, index) => (
          <motion.div
            key={card.name}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: index * 0.1 }}
            className="bg-white dark:bg-gray-800 rounded-lg shadow p-5"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className={`p-2 rounded-lg bg-${card.color}-100 dark:bg-${card.color}-900 bg-opacity-40 mr-3`}>
                  <card.icon className={`h-5 w-5 text-${card.color}-600 dark:text-${card.color}-400`} />
                </div>
                <span className="text-sm font-medium text-gray-500 dark:text-gray-400">{card.name}</span>
              </div>
              {card.change && (
                <div className={`flex items-center text-xs font-medium ${
                  card.changeType === 'increase' 
                    ? 'text-green-600 dark:text-green-400' 
                    : 'text-red-600 dark:text-red-400'
                }`}>
                  {card.changeType === 'increase' ? (
                    <ArrowTrendingUpIcon className="h-3 w-3 mr-1" />
                  ) : (
                    <ArrowTrendingDownIcon className="h-3 w-3 mr-1" />
                  )}
                  {card.change}
                </div>
              )}
            </div>
            <div className="mt-2 flex items-baseline">
              <span className="text-2xl font-semibold text-gray-900 dark:text-white">{card.value}</span>
            </div>
            <div className="mt-1 text-xs text-gray-500 dark:text-gray-400">{card.description}</div>
          </motion.div>
        ))}
      </div>
      
      {/* Additional sections if data is available */}
      {metrics.topPerformers && metrics.topPerformers.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* Top Performers */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
            <div className="px-4 py-5 sm:px-6 border-b border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white">Top Performing Products</h3>
            </div>
            <ul className="divide-y divide-gray-200 dark:divide-gray-700">
              {metrics.topPerformers.map(product => (
                <li key={product.id} className="px-4 py-4 sm:px-6">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{product.name}</p>
                    <div className="flex items-center">
                      <span className="text-sm text-gray-500 dark:text-gray-400 mr-2">{formatCurrency(product.revenue)}</span>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        product.growth > 0 
                          ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' 
                          : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                      }`}>
                        {product.growth > 0 ? '+' : ''}{product.growth}%
                      </span>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </div>
          
          {/* Recent Activity */}
          {metrics.recentActivity && metrics.recentActivity.length > 0 && (
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
              <div className="px-4 py-5 sm:px-6 border-b border-gray-200 dark:border-gray-700">
                <h3 className="text-lg font-medium text-gray-900 dark:text-white">Recent Activity</h3>
              </div>
              <ul className="divide-y divide-gray-200 dark:divide-gray-700">
                {metrics.recentActivity.map(activity => (
                  <li key={activity.id} className="px-4 py-4 sm:px-6">
                    <div className="flex items-center">
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{activity.title}</p>
                        <div className="flex items-center mt-1">
                          <span className="text-xs text-gray-500 dark:text-gray-400">
                            {formatDate(activity.timestamp instanceof Date ? activity.timestamp : new Date(activity.timestamp))} at {formatTime(activity.timestamp instanceof Date ? activity.timestamp : new Date(activity.timestamp))}
                          </span>
                          <span className={`ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            activity.status === 'completed' 
                              ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' 
                              : activity.status === 'running' || activity.status === 'active'
                                ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
                                : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
                          }`}>
                            {activity.status}
                          </span>
                        </div>
                      </div>
                      <div className="ml-5 flex-shrink-0">
                        {activity.type === 'test' && <BeakerIcon className="h-5 w-5 text-purple-500" />}
                        {activity.type === 'optimization' && <BoltIcon className="h-5 w-5 text-orange-500" />}
                        {activity.type === 'segment' && <UserGroupIcon className="h-5 w-5 text-blue-500" />}
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
