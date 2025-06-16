'use client';

import { useState } from 'react';

export default function Campaigns() {
  const [sidebarOpen, setSidebarOpen] = useState(true);

  return (
    <div className="flex h-screen bg-gray-50 font-sans">
      {/* Sidebar */}
      <aside className={`w-64 bg-white border-r p-4 transition-all ${sidebarOpen ? 'block' : 'hidden'}`}>
        <h1 className="text-xl font-bold mb-6">Stratix AI</h1>
        <nav className="space-y-4">
          <a href="/" className="block text-gray-700 hover:text-indigo-600">Overview</a>
          <a href="/analytics" className="block text-gray-700 hover:text-indigo-600">Analytics</a>
          <a href="/campaigns" className="block text-indigo-600 font-medium">Campaigns</a>
          <a href="#" className="block text-gray-700 hover:text-indigo-600">Settings</a>
        </nav>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-6 overflow-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-semibold">A/B Testing Campaigns 🎯</h2>
          <button onClick={() => setSidebarOpen(!sidebarOpen)} className="text-sm text-indigo-500 underline">
            {sidebarOpen ? 'Hide Sidebar' : 'Show Sidebar'}
          </button>
        </div>

        {/* Campaign Status Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          <div className="bg-white p-4 rounded-lg shadow">
            <p className="text-sm text-gray-500">Active Tests</p>
            <h3 className="text-xl font-bold mt-1">12</h3>
            <p className="text-blue-600 text-sm">6 showing significance</p>
          </div>

          <div className="bg-white p-4 rounded-lg shadow">
            <p className="text-sm text-gray-500">Avg. Lift</p>
            <h3 className="text-xl font-bold mt-1">+18.4%</h3>
            <p className="text-green-600 text-sm">Across winning tests</p>
          </div>

          <div className="bg-white p-4 rounded-lg shadow">
            <p className="text-sm text-gray-500">Revenue Impact</p>
            <h3 className="text-xl font-bold mt-1">$89,234</h3>
            <p className="text-green-600 text-sm">This quarter</p>
          </div>
        </div>

        {/* Active Campaigns List */}
        <div className="bg-white rounded-lg shadow mb-8">
          <div className="p-4 border-b">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold">Active A/B Tests</h3>
              <button className="bg-indigo-600 text-white px-4 py-2 rounded text-sm hover:bg-indigo-700">
                + New Test
              </button>
            </div>
          </div>
          
          <div className="divide-y">
            {/* Test 1 */}
            <div className="p-4 hover:bg-gray-50">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <h4 className="font-medium text-gray-900">Homepage Hero Section Test</h4>
                  <p className="text-sm text-gray-600 mt-1">Testing new headline vs. original</p>
                  <div className="flex items-center space-x-4 mt-2 text-sm">
                    <span className="text-gray-500">Started: 12 days ago</span>
                    <span className="text-gray-500">Traffic: 2,847 visitors</span>
                  </div>
                </div>
                <div className="text-right">
                  <div className="flex items-center space-x-2">
                    <span className="bg-green-100 text-green-800 px-2 py-1 rounded text-xs font-medium">
                      Winning +12.3%
                    </span>
                    <span className="text-sm text-gray-500">94% confidence</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Test 2 */}
            <div className="p-4 hover:bg-gray-50">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <h4 className="font-medium text-gray-900">Product Page CTA Button</h4>
                  <p className="text-sm text-gray-600 mt-1">Testing "Buy Now" vs "Add to Cart"</p>
                  <div className="flex items-center space-x-4 mt-2 text-sm">
                    <span className="text-gray-500">Started: 8 days ago</span>
                    <span className="text-gray-500">Traffic: 1,234 visitors</span>
                  </div>
                </div>
                <div className="text-right">
                  <div className="flex items-center space-x-2">
                    <span className="bg-yellow-100 text-yellow-800 px-2 py-1 rounded text-xs font-medium">
                      Learning +3.1%
                    </span>
                    <span className="text-sm text-gray-500">67% confidence</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Test 3 */}
            <div className="p-4 hover:bg-gray-50">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <h4 className="font-medium text-gray-900">Checkout Page Layout</h4>
                  <p className="text-sm text-gray-600 mt-1">Single-page vs multi-step checkout</p>
                  <div className="flex items-center space-x-4 mt-2 text-sm">
                    <span className="text-gray-500">Started: 3 days ago</span>
                    <span className="text-gray-500">Traffic: 456 visitors</span>
                  </div>
                </div>
                <div className="text-right">
                  <div className="flex items-center space-x-2">
                    <span className="bg-gray-100 text-gray-600 px-2 py-1 rounded text-xs font-medium">
                      Too early
                    </span>
                    <span className="text-sm text-gray-500">23% confidence</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="space-x-4">
          <button className="bg-indigo-600 text-white px-4 py-2 rounded hover:bg-indigo-700">Create New Test</button>
          <button className="border px-4 py-2 rounded text-indigo-600 border-indigo-600 hover:bg-indigo-50">Test Ideas</button>
          <button className="border px-4 py-2 rounded text-gray-600 border-gray-300 hover:bg-gray-50">View Archive</button>
        </div>
      </main>
    </div>
  );
}
