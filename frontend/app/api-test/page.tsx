'use client';

import { useState } from 'react';

// Simple API client for testing
const API_BASE_URL = 'http://localhost:3001';

interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
}

const apiClient = {
  async request<T>(endpoint: string, options: RequestInit = {}): Promise<ApiResponse<T>> {
    try {
      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        headers: {
          'Content-Type': 'application/json',
          ...options.headers,
        },
        ...options,
      });
      
      const data = await response.json();
      return data;
    } catch (error: any) {
      console.error('API Error:', error);
      return {
        success: false,
        error: error.message || 'Network error',
      };
    }
  },

  healthCheck: () => apiClient.request('/health'),
  analyzeContent: (data: any) => apiClient.request('/api/analysis', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  getBrandDNA: (brandId: string) => apiClient.request(`/api/brands/${brandId}/dna`),
  generateContent: (data: any) => apiClient.request('/api/content/generate', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  getPerformanceMetrics: () => apiClient.request('/api/performance/metrics'),
  getProducts: () => apiClient.request('/api/products'),
  getSecurityScan: () => apiClient.request('/api/security/scan'),
  getSettings: () => apiClient.request('/api/settings'),
  getTrialStatus: () => apiClient.request('/api/trials/status'),
};

export default function ApiTestPage() {
  const [results, setResults] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState<string | null>(null);

  const testApi = async (apiName: string, apiCall: () => Promise<any>) => {
    setLoading(apiName);
    try {
      const result = await apiCall();
      setResults((prev: Record<string, any>) => ({ ...prev, [apiName]: result }));
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      setResults((prev: Record<string, any>) => ({ 
        ...prev, 
        [apiName]: { success: false, error: errorMessage } 
      }));
    }
    setLoading(null);
  };

  const testButtons = [
    {
      name: 'Health Check',
      key: 'health',
      action: () => testApi('health', apiClient.healthCheck),
    },
    {
      name: 'Content Analysis',
      key: 'analysis',
      action: () => testApi('analysis', () => apiClient.analyzeContent({
        content: 'Transform your business with our innovative solutions',
        type: 'ad',
        framework: 'AIDA'
      })),
    },
    {
      name: 'Brand DNA',
      key: 'brand',
      action: () => testApi('brand', () => apiClient.getBrandDNA('brand_123')),
    },
    {
      name: 'Generate Content',
      key: 'content',
      action: () => testApi('content', () => apiClient.generateContent({
        type: 'product_description',
        prompt: 'Create engaging description for eco-friendly water bottle',
        brand_id: 'brand_123'
      })),
    },
    {
      name: 'Performance Metrics',
      key: 'performance',
      action: () => testApi('performance', apiClient.getPerformanceMetrics),
    },
    {
      name: 'Products',
      key: 'products',
      action: () => testApi('products', apiClient.getProducts),
    },
    {
      name: 'Security Scan',
      key: 'security',
      action: () => testApi('security', apiClient.getSecurityScan),
    },
    {
      name: 'Settings',
      key: 'settings',
      action: () => testApi('settings', apiClient.getSettings),
    },
    {
      name: 'Trial Status',
      key: 'trial',
      action: () => testApi('trial', apiClient.getTrialStatus),
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-6xl mx-auto">
        <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            🚀 Stratix AI API Test Dashboard
          </h1>
          <p className="text-gray-600 mb-6">
            Test all API endpoints and verify the connection between frontend and backend.
          </p>
          
          {/* Server Status */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <h3 className="font-semibold text-green-800">Backend Server</h3>
              <p className="text-green-600">http://localhost:3001</p>
              <div className="flex items-center mt-2">
                <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                <span className="text-sm text-green-700">Running</span>
              </div>
            </div>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h3 className="font-semibold text-blue-800">Frontend Server</h3>
              <p className="text-blue-600">http://localhost:3000</p>
              <div className="flex items-center mt-2">
                <div className="w-2 h-2 bg-blue-500 rounded-full mr-2"></div>
                <span className="text-sm text-blue-700">Running</span>
              </div>
            </div>
          </div>

          {/* API Test Buttons */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-8">
            {testButtons.map((button) => (
              <button
                key={button.key}
                onClick={button.action}
                disabled={loading === button.key}
                className={`
                  px-4 py-3 rounded-lg font-medium text-sm transition-all
                  ${loading === button.key
                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    : 'bg-blue-600 text-white hover:bg-blue-700 active:transform active:scale-95'
                  }
                `}
              >
                {loading === button.key ? (
                  <div className="flex items-center justify-center">
                    <div className="w-4 h-4 border-2 border-gray-500 border-t-transparent rounded-full animate-spin mr-2"></div>
                    Testing...
                  </div>
                ) : (
                  button.name
                )}
              </button>
            ))}
          </div>

          {/* Test All Button */}
          <button
            onClick={() => testButtons.forEach(button => button.action())}
            disabled={loading !== null}
            className="w-full bg-green-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed mb-8"
          >
            🧪 Test All APIs
          </button>
        </div>

        {/* Results */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {Object.entries(results).map(([key, result]: [string, any]) => (
            <div key={key} className="bg-white rounded-lg shadow-lg p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold capitalize">{key} API</h3>
                <div className={`px-3 py-1 rounded-full text-sm font-medium ${
                  result.success 
                    ? 'bg-green-100 text-green-800' 
                    : 'bg-red-100 text-red-800'
                }`}>
                  {result.success ? '✅ Success' : '❌ Error'}
                </div>
              </div>
              
              <div className="bg-gray-50 rounded-lg p-4 overflow-auto max-h-64">
                <pre className="text-sm text-gray-700 whitespace-pre-wrap">
                  {JSON.stringify(result, null, 2)}
                </pre>
              </div>
            </div>
          ))}
        </div>

        {/* Instructions */}
        <div className="bg-white rounded-lg shadow-lg p-6 mt-8">
          <h2 className="text-xl font-semibold mb-4">📋 Instructions</h2>
          <ul className="space-y-2 text-gray-600">
            <li>• Click any API button to test individual endpoints</li>
            <li>• Use "Test All APIs" to run all tests simultaneously</li>
            <li>• Check the results panel to see API responses</li>
            <li>• Green indicators show successful API calls</li>
            <li>• Red indicators show errors or connection issues</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
