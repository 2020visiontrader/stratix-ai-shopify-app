import {
    ChartBarIcon,
    CogIcon,
    LightBulbIcon,
    MenuIcon,
    QuestionMarkCircleIcon,
    SparklesIcon,
    XIcon
} from '@heroicons/react/outline';
import { AnimatePresence, motion } from 'framer-motion';
import React, { useState } from 'react';
import { NavLink, Outlet, useLocation } from 'react-router-dom';
import { useUserSession } from '../hooks/useUserSession';

interface NavItem {
  name: string;
  path: string;
  icon: React.ComponentType<{ className: string }>;
  description: string;
}

const navigation: NavItem[] = [
  {
    name: 'Overview',
    path: '/dashboard/overview',
    icon: ChartBarIcon,
    description: 'Performance metrics and insights'
  },
  {
    name: 'Brand Config',
    path: '/dashboard/brand-config',
    icon: CogIcon,
    description: 'Brand setup and strategy'
  },
  {
    name: 'Ad Generator',
    path: '/dashboard/ads',
    icon: SparklesIcon,
    description: 'Create and optimize ads'
  },
  {
    name: 'Insights',
    path: '/dashboard/insights',
    icon: LightBulbIcon,
    description: 'A/B test reports and variant logs'
  },
  {
    name: 'Help Center',
    path: '/dashboard/help',
    icon: QuestionMarkCircleIcon,
    description: 'Get help and support'
  }
];

export const DashboardLayout: React.FC = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const { user, brandName } = useUserSession();
  const location = useLocation();

  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);

  return (
    <div className="h-screen flex overflow-hidden bg-gray-100">
      {/* Sidebar */}
      <AnimatePresence>
        {isSidebarOpen && (
          <motion.div
            initial={{ x: -280 }}
            animate={{ x: 0 }}
            exit={{ x: -280 }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed inset-y-0 left-0 w-64 flex flex-col bg-white border-r border-gray-200 z-20"
          >
            {/* Logo */}
            <div className="h-16 flex items-center justify-between px-4 border-b border-gray-200">
              <img src="/logo.svg" alt="Stratix AI" className="h-8" />
              <button
                onClick={toggleSidebar}
                className="p-2 rounded-md text-gray-500 hover:text-gray-600 hover:bg-gray-100 lg:hidden"
              >
                <XIcon className="h-6 w-6" />
              </button>
            </div>

            {/* Welcome Message */}
            <div className="px-4 py-4 border-b border-gray-200">
              <p className="text-sm font-medium text-gray-900">
                Welcome back, {user?.firstName || brandName}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                Let's grow your business today
              </p>
            </div>

            {/* Navigation */}
            <nav className="flex-1 px-2 py-4 space-y-1 overflow-y-auto">
              {navigation.map((item) => (
                <NavLink
                  key={item.path}
                  to={item.path}
                  className={({ isActive }) =>
                    `group flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                      isActive
                        ? 'bg-indigo-50 text-indigo-600'
                        : 'text-gray-700 hover:bg-gray-50'
                    }`
                  }
                >
                  <item.icon
                    className={`mr-3 h-5 w-5 transition-colors ${
                      location.pathname === item.path
                        ? 'text-indigo-600'
                        : 'text-gray-400 group-hover:text-gray-500'
                    }`}
                  />
                  <span>{item.name}</span>
                </NavLink>
              ))}
            </nav>

            {/* User Profile */}
            <div className="flex items-center p-4 border-t border-gray-200">
              <div className="flex-shrink-0">
                <img
                  className="h-8 w-8 rounded-full"
                  src={user?.photoURL || '/default-avatar.png'}
                  alt={user?.firstName || 'User'}
                />
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-900">
                  {user?.firstName} {user?.lastName}
                </p>
                <p className="text-xs text-gray-500">{brandName}</p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Mobile sidebar toggle */}
      <div className="lg:hidden fixed top-0 left-0 z-10 p-4">
        <button
          onClick={toggleSidebar}
          className="p-2 rounded-md text-gray-500 hover:text-gray-600 hover:bg-white"
        >
          <MenuIcon className="h-6 w-6" />
        </button>
      </div>

      {/* Main Content */}
      <div className={`flex-1 flex flex-col overflow-hidden transition-all ${
        isSidebarOpen ? 'lg:pl-64' : ''
      }`}>
        {/* Page Content */}
        <main className="flex-1 overflow-y-auto bg-gray-100">
          <div className="py-6">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <Outlet />
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}; 