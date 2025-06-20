'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';

export default function HomePage() {
  const [backendStatus, setBackendStatus] = useState<'checking' | 'online' | 'offline'>('checking');

  useEffect(() => {
    // Check backend status
    fetch('http://localhost:3001/health')
      .then(res => res.json())
      .then(data => {
        if (data.status === 'ok') {
          setBackendStatus('online');
        } else {
          setBackendStatus('offline');
        }
      })
      .catch(() => setBackendStatus('offline'));
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <header className="bg-white shadow-lg">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-xl">S</span>
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Stratix AI</h1>
                <p className="text-sm text-gray-600">E-commerce Optimization Platform</p>
              </div>
            </div>
            
            {/* Status Indicator */}
            <div className="flex items-center space-x-2">
              <div className={`w-3 h-3 rounded-full ${
                backendStatus === 'online' ? 'bg-green-500' : 
                backendStatus === 'offline' ? 'bg-red-500' : 'bg-yellow-500'
              }`}></div>
              <span className="text-sm font-medium text-gray-700">
                Backend: {backendStatus === 'checking' ? 'Checking...' : backendStatus}
              </span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 py-12">
        {/* Hero Section */}
        <div className="text-center mb-16">
          <h2 className="text-5xl font-bold text-gray-900 mb-6">
            AI-Powered E-commerce
            <span className="block text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600">
              Optimization Platform
            </span>
          </h2>
          <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
            Transform your Shopify store with advanced AI analysis, content generation, 
            and performance optimization tools designed for modern e-commerce success.
          </p>
          
          <div className="flex justify-center space-x-4">
            <Link 
              href="/api-test"
              className="bg-blue-600 text-white px-8 py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors"
            >
              🧪 Test APIs
            </Link>
            <button className="border border-gray-300 text-gray-700 px-8 py-3 rounded-lg font-medium hover:bg-gray-50 transition-colors">
              📚 View Documentation
            </button>
          </div>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-16">
          {[
            {
              icon: '🧠',
              title: 'AI Content Analysis',
              description: 'Advanced content analysis using frameworks like AIDA, PAS, and Hook-Story-Close',
              endpoint: '/api/analysis'
            },
            {
              icon: '🎨',
              title: 'Brand DNA Analysis',
              description: 'Understand your brand personality, values, and unique positioning',
              endpoint: '/api/brands'
            },
            {
              icon: '✍️',
              title: 'Content Generation',
              description: 'AI-powered content creation optimized for your brand voice',
              endpoint: '/api/content'
            },
            {
              icon: '📊',
              title: 'Performance Metrics',
              description: 'Real-time analytics and performance monitoring dashboard',
              endpoint: '/api/performance'
            },
            {
              icon: '🛍️',
              title: 'Product Optimization',
              description: 'Analyze and optimize product listings for better conversions',
              endpoint: '/api/products'
            },
            {
              icon: '🔒',
              title: 'Security Scanning',
              description: 'Automated security monitoring and vulnerability detection',
              endpoint: '/api/security'
            }
          ].map((feature, index) => (
            <div key={index} className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-shadow">
              <div className="text-4xl mb-4">{feature.icon}</div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">{feature.title}</h3>
              <p className="text-gray-600 mb-4">{feature.description}</p>
              <div className="text-sm font-mono text-blue-600 bg-blue-50 px-3 py-1 rounded">
                {feature.endpoint}
              </div>
            </div>
          ))}
        </div>

        {/* API Status */}
        <div className="bg-white rounded-xl shadow-lg p-8">
          <h3 className="text-2xl font-bold text-gray-900 mb-6">🚀 Server Status</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Backend Status */}
            <div className={`border-2 rounded-lg p-6 ${
              backendStatus === 'online' 
                ? 'border-green-200 bg-green-50' 
                : 'border-red-200 bg-red-50'
            }`}>
              <div className="flex items-center justify-between mb-4">
                <h4 className="text-lg font-semibold">Backend API Server</h4>
                <div className={`px-3 py-1 rounded-full text-sm font-medium ${
                  backendStatus === 'online'
                    ? 'bg-green-100 text-green-800'
                    : 'bg-red-100 text-red-800'
                }`}>
                  {backendStatus === 'online' ? '✅ Online' : '❌ Offline'}
                </div>
              </div>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">URL:</span>
                  <span className="font-mono">http://localhost:3001</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Health Check:</span>
                  <span className="font-mono">/health</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">API Endpoints:</span>
                  <span>9 Active</span>
                </div>
              </div>
            </div>

            {/* Frontend Status */}
            <div className="border-2 border-blue-200 bg-blue-50 rounded-lg p-6">
              <div className="flex items-center justify-between mb-4">
                <h4 className="text-lg font-semibold">Frontend Application</h4>
                <div className="px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
                  ✅ Running
                </div>
              </div>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">URL:</span>
                  <span className="font-mono">http://localhost:3000</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Framework:</span>
                  <span className="font-mono">Next.js 14</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Status:</span>
                  <span>Development Mode</span>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="mt-8 pt-6 border-t border-gray-200">
            <h4 className="text-lg font-semibold mb-4">Quick Actions</h4>
            <div className="flex flex-wrap gap-3">
              <Link 
                href="/api-test"
                className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
              >
                🧪 API Test Dashboard
              </Link>
              <button 
                onClick={() => window.open('http://localhost:3001/health', '_blank')}
                className="border border-gray-300 text-gray-700 px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors"
              >
                🔍 Backend Health Check
              </button>
              <button className="border border-gray-300 text-gray-700 px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors">
                📊 Performance Monitor
              </button>
              <button className="border border-gray-300 text-gray-700 px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors">
                ⚙️ Settings
              </button>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 mt-16">
        <div className="max-w-7xl mx-auto px-6 py-8">
          <div className="text-center text-gray-600">
            <p className="mb-2">Stratix AI - E-commerce Optimization Platform</p>
            <p className="text-sm">
              Backend: <span className="font-mono">localhost:3001</span> | 
              Frontend: <span className="font-mono">localhost:3000</span>
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
