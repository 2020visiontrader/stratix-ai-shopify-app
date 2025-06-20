'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { apiClient } from '../src/lib/api-client';
import type { BrandDNA } from '../src/types';

export default function BrandDNAPanel() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [brandData, setBrandData] = useState<BrandDNA | null>(null);
  
  useEffect(() => {
    const fetchBrandData = async () => {
      if (!user) {
        setError('User not authenticated.');
        setLoading(false);
        return;
      }
      try {
        setLoading(true);
        setError(null);
        // Fetch Brand DNA for the current user/brand
        const response = await apiClient.brandDNAQuery(user.id, 'overview', 1);
        if (response.success && response.data && Array.isArray(response.data) && response.data.length > 0) {
          setBrandData(response.data[0]);
        } else {
          setError('Brand DNA not found.');
        }
      } catch (err: any) {
        setError('Error loading brand DNA.');
      } finally {
        setLoading(false);
      }
    };
    fetchBrandData();
  }, [user]);

  const renderTabContent = () => {
    if (loading) {
      return (
        <div className="animate-pulse flex flex-col space-y-4 p-4">
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-5/6"></div>
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-2/3"></div>
        </div>
      );
    }
    if (error) {
      return <div className="p-4 text-red-600 dark:text-red-400">{error}</div>;
    }
    if (!brandData) {
      return <div className="p-4 text-gray-500 dark:text-gray-400">No Brand DNA data available.</div>;
    }

    switch (activeTab) {
      case 'overview':
        return (
          <div className="p-4">
            <div className="mb-4">
              <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Brand Values</h3>
              <div className="mt-1 flex flex-wrap gap-2">
                {brandData.content_strategy?.themes?.map((value: string, index: number) => (
                  <span key={index} className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200">
                    {value}
                  </span>
                ))}
              </div>
            </div>
            
            <div className="mb-4">
              <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Brand Personality</h3>
              <p className="mt-1 text-base text-gray-800 dark:text-gray-200">{brandData.brand_voice?.personality?.join(', ')}</p>
            </div>
            
            <div className="mb-4">
              <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Voice & Tone</h3>
              <p className="mt-1 text-base text-gray-800 dark:text-gray-200">{brandData.brand_voice?.tone}</p>
            </div>
            
            <div>
              <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Target Audience</h3>
              <ul className="mt-1 list-disc list-inside text-gray-800 dark:text-gray-200">
                {brandData.target_audience?.demographics?.map((item: string, index: number) => (
                  <li key={index}>{item}</li>
                ))}
              </ul>
            </div>
          </div>
        );
      
      case 'visual':
        return (
          <div className="p-4">
            <div className="mb-4 text-center">
              <p className="text-gray-600 dark:text-gray-400">Upload brand assets to enhance AI-generated content</p>
              <button className="mt-2 px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500">
                Upload Assets
              </button>
            </div>
            <div className="grid grid-cols-2 gap-4 mt-6">
              <div className="bg-gray-100 dark:bg-gray-700 rounded-md p-4 flex flex-col items-center justify-center">
                <div className="w-16 h-16 bg-gray-300 dark:bg-gray-600 rounded-md mb-2"></div>
                <p className="text-xs text-gray-500 dark:text-gray-400">Logo</p>
              </div>
              <div className="bg-gray-100 dark:bg-gray-700 rounded-md p-4 flex flex-col items-center justify-center">
                <div className="w-16 h-16 bg-blue-300 dark:bg-blue-900 rounded-md mb-2"></div>
                <p className="text-xs text-gray-500 dark:text-gray-400">Primary Color</p>
              </div>
            </div>
            <div className="mt-6">
              <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Brand Colors</h3>
              <div className="flex flex-wrap gap-2 mt-2">
                {brandData.visual_identity?.primary_colors?.map((color: string, idx: number) => (
                  <span key={idx} className="inline-block w-6 h-6 rounded-full border border-gray-300 dark:border-gray-600" style={{ backgroundColor: color }} title={color}></span>
                ))}
              </div>
              <div className="flex flex-wrap gap-2 mt-2">
                {brandData.visual_identity?.secondary_colors?.map((color: string, idx: number) => (
                  <span key={idx} className="inline-block w-6 h-6 rounded-full border border-gray-300 dark:border-gray-600" style={{ backgroundColor: color }} title={color}></span>
                ))}
              </div>
            </div>
            <div className="mt-6">
              <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Fonts</h3>
              <div className="flex flex-wrap gap-2 mt-2">
                {brandData.visual_identity?.fonts?.map((font: string, idx: number) => (
                  <span key={idx} className="inline-block px-2 py-1 rounded bg-gray-200 dark:bg-gray-600 text-xs" style={{ fontFamily: font }}>{font}</span>
                ))}
              </div>
            </div>
          </div>
        );
      
      case 'keywords':
        return (
          <div className="p-4">
            <div className="mb-4">
              <p className="text-gray-600 dark:text-gray-400 mb-2">Keywords that define your brand:</p>
              <div className="flex flex-wrap gap-2">
                {brandData.tone_preferences?.preferred_words?.map((keyword: string, index: number) => (
                  <span key={index} className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300">
                    {keyword}
                  </span>
                ))}
              </div>
            </div>
            <div className="mt-4">
              <button className="px-3 py-1 border border-purple-600 text-purple-600 dark:text-purple-400 dark:border-purple-400 rounded-md text-sm hover:bg-purple-50 dark:hover:bg-purple-900/30">
                Add keyword
              </button>
            </div>
          </div>
        );
      
      default:
        return <div className="p-4">Select a tab</div>;
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 shadow rounded-lg overflow-hidden">
      <div className="flex items-center justify-between px-4 py-5 sm:px-6 border-b border-gray-200 dark:border-gray-700">
        <h3 className="text-lg font-medium text-gray-900 dark:text-white">Brand DNA</h3>
        <button className="text-sm text-purple-600 hover:text-purple-500 dark:text-purple-400 dark:hover:text-purple-300">
          Edit
        </button>
      </div>
      
      <div className="border-b border-gray-200 dark:border-gray-700">
        <nav className="-mb-px flex">
          <button
            onClick={() => setActiveTab('overview')}
            className={`w-1/3 py-4 px-1 text-center border-b-2 text-sm font-medium ${
              activeTab === 'overview'
                ? 'border-purple-500 text-purple-600 dark:text-purple-400'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
            }`}
          >
            Overview
          </button>
          <button
            onClick={() => setActiveTab('visual')}
            className={`w-1/3 py-4 px-1 text-center border-b-2 text-sm font-medium ${
              activeTab === 'visual'
                ? 'border-purple-500 text-purple-600 dark:text-purple-400'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
            }`}
          >
            Visual Identity
          </button>
          <button
            onClick={() => setActiveTab('keywords')}
            className={`w-1/3 py-4 px-1 text-center border-b-2 text-sm font-medium ${
              activeTab === 'keywords'
                ? 'border-purple-500 text-purple-600 dark:text-purple-400'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
            }`}
          >
            Keywords
          </button>
        </nav>
      </div>
      
      {renderTabContent()}
    </div>
  );
}
