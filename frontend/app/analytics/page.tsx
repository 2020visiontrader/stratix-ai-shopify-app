'use client';

import { useState } from 'react';

export default function Analytics() {
  const [sidebarOpen, setSidebarOpen] = useState(true);

  return (
    <div className="flex h-screen bg-gray-50 font-sans">
      {/* Sidebar */}
      <aside className={`w-64 bg-white border-r p-4 transition-all ${sidebarOpen ? 'block' : 'hidden'}`}>
        <h1 className="text-xl font-bold mb-6">Stratix AI</h1>
        <nav className="space-y-4">
          <a href="/" className="block text-gray-700 hover:text-indigo-600">Overview</a>
          <a href="/analytics" className="block text-indigo-600 font-medium">Analytics</a>
          <a href="/campaigns" className="block text-gray-700 hover:text-indigo-600">Campaigns</a>
          <a href="#" className="block text-gray-700 hover:text-indigo-600">Settings</a>
        </nav>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-6 overflow-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-semibold">Analytics Dashboard 📊</h2>
          <button onClick={() => setSidebarOpen(!sidebarOpen)} className="text-sm text-indigo-500 underline">
            {sidebarOpen ? 'Hide Sidebar' : 'Show Sidebar'}
          </button>
        </div>

        {/* Analytics Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <div className="bg-white p-4 rounded-lg shadow">
            <p className="text-sm text-gray-500">Total Revenue</p>
            <h3 className="text-xl font-bold mt-1">$142,832</h3>
            <p className="text-green-600 text-sm">+24% this month</p>
          </div>

          <div className="bg-white p-4 rounded-lg shadow">
            <p className="text-sm text-gray-500">Sessions</p>
            <h3 className="text-xl font-bold mt-1">23,445</h3>
            <p className="text-blue-600 text-sm">+8% this week</p>
          </div>

          <div className="bg-white p-4 rounded-lg shadow">
            <p className="text-sm text-gray-500">Bounce Rate</p>
            <h3 className="text-xl font-bold mt-1">32.4%</h3>
            <p className="text-red-600 text-sm">-2.1% improved</p>
          </div>

          <div className="bg-white p-4 rounded-lg shadow">
            <p className="text-sm text-gray-500">Avg. Order Value</p>
            <h3 className="text-xl font-bold mt-1">$87.50</h3>
            <p className="text-green-600 text-sm">+15% this month</p>
          </div>
        </div>

        {/* Chart Section */}
        <div className="bg-white p-6 rounded-lg shadow mb-8">
          <h3 className="text-lg font-semibold mb-4">Performance Trends</h3>
          <div className="h-64 bg-gray-50 rounded flex items-center justify-center">
            <div className="text-center text-gray-500">
              <div className="text-4xl mb-2">📈</div>
              <p>Analytics charts would be displayed here</p>
              <p className="text-sm">Integration with your analytics provider</p>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="space-x-4">
          <button className="bg-indigo-600 text-white px-4 py-2 rounded hover:bg-indigo-700">Export Data</button>
          <button className="border px-4 py-2 rounded text-indigo-600 border-indigo-600 hover:bg-indigo-50">Custom Report</button>
          <button className="border px-4 py-2 rounded text-gray-600 border-gray-300 hover:bg-gray-50">Schedule Report</button>
        </div>
      </main>
    </div>
  );
}
