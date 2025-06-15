import React, { Suspense } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { DashboardLayout } from '../layout/DashboardLayout';

// Lazy load pages
const Overview = React.lazy(() => import('./Overview'));
const BrandConfig = React.lazy(() => import('./BrandConfig'));
const AdGenerator = React.lazy(() => import('./AdGenerator'));
const Insights = React.lazy(() => import('./Insights'));
const HelpCenter = React.lazy(() => import('./HelpCenter'));

export const AppRoutes: React.FC = () => {
  return (
    <Suspense fallback={<LoadingSpinner />}>
      <Routes>
        {/* Redirect root to dashboard */}
        <Route path="/" element={<Navigate to="/dashboard/overview" replace />} />

        {/* Dashboard routes */}
        <Route path="/dashboard" element={<DashboardLayout />}>
          <Route path="overview" element={<Overview />} />
          <Route path="brand-config" element={<BrandConfig />} />
          <Route path="ads" element={<AdGenerator />} />
          <Route path="insights" element={<Insights />} />
          <Route path="help" element={<HelpCenter />} />
          
          {/* Redirect /dashboard to /dashboard/overview */}
          <Route index element={<Navigate to="/dashboard/overview" replace />} />
        </Route>

        {/* Catch all unmatched routes */}
        <Route path="*" element={<Navigate to="/dashboard/overview" replace />} />
      </Routes>
    </Suspense>
  );
}; 