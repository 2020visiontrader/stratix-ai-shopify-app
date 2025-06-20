'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../hooks/useAuth';
import DashboardLayout from '../../components/DashboardLayout';
import BrandDNAPanel from '../../components/BrandDNAPanel';
import MetricsOverview from '../../components/MetricsOverview';
import RecommendationsPanel from '../../components/RecommendationsPanel';
import InsightsPanel from '../../components/InsightsPanel';

export default function Dashboard() {
  const { user, isLoading, isAuthenticated } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [metrics, setMetrics] = useState<any | null>(null);

  useEffect(() => {
    // If auth has been checked and user is not authenticated, redirect to login
    if (!isLoading && !isAuthenticated) {
      console.log('Not authenticated, redirecting to login...');
      router.push('/auth/login');
    }
  }, [isLoading, isAuthenticated, router]);

  useEffect(() => {
    const fetchDashboardData = async () => {
      if (isAuthenticated) {
        try {
          // Fetch metrics data
          const response = await fetch('/api/analytics');
          if (!response.ok) {
            throw new Error('Failed to load dashboard data');
          }
          const data = await response.json();
          setMetrics(data);
        } catch (err: any) {
          console.error('Error loading dashboard:', err);
          setError(err.message || 'Failed to load dashboard');
        } finally {
          setLoading(false);
        }
      }
    };

    fetchDashboardData();
  }, [isAuthenticated]);

  // Show loading state
  if (isLoading || loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-full">
          <div className="animate-pulse flex flex-col items-center">
            <div className="h-12 w-12 rounded-full border-4 border-t-purple-500 border-r-transparent border-b-purple-500 border-l-transparent animate-spin"></div>
            <p className="mt-4 text-lg text-gray-500 dark:text-gray-400">Loading dashboard...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  // Show error state
  if (error) {
    return (
      <DashboardLayout>
        <div className="bg-red-100 dark:bg-red-900/20 p-4 rounded-md">
          <h2 className="text-lg font-medium text-red-800 dark:text-red-200">Error</h2>
          <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
          <button 
            onClick={() => window.location.reload()}
            className="mt-2 px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
          >
            Retry
          </button>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="flex flex-col space-y-6">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Dashboard</h1>
        
        {user && (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Welcome, {user.name || user.email}!</h2>
            <p className="text-gray-500 dark:text-gray-400">Your AI-powered e-commerce dashboard</p>
          </div>
        )}
        
        {/* Dashboard Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {metrics && <MetricsOverview metrics={metrics} />}
          <BrandDNAPanel />
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <RecommendationsPanel />
          <InsightsPanel />
        </div>
      </div>
    </DashboardLayout>
  );
}
