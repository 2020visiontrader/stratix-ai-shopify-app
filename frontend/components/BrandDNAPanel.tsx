'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { apiClient } from '../src/lib/api-client';
import type { BrandDNA } from '../src/types';

export default function BrandDNAPanel() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'overview' | 'visual' | 'keywords' | 'memory'>('overview');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [brandData, setBrandData] = useState<BrandDNA | null>(null);
  const [memories, setMemories] = useState<any[]>([]);
  const [learningLogs, setLearningLogs] = useState<any[]>([]);
  const [memoryLoading, setMemoryLoading] = useState(false);
  const [memoryQuery, setMemoryQuery] = useState('');
  
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
  
  useEffect(() => {
    // Fetch recent memories and learning logs when viewing the memory tab
    if (activeTab === 'memory' && brandData) {
      fetchMemoriesAndLearningLogs();
    }
  }, [activeTab, brandData]);
  
  const fetchMemoriesAndLearningLogs = async () => {
    if (!brandData?.id) return;
    
    setMemoryLoading(true);
    try {
      const memoriesResponse = await apiClient.searchMemories(brandData.id, '', undefined, 5);
      if (memoriesResponse.success && memoriesResponse.data) {
        setMemories(memoriesResponse.data as any[]);
      }
      
      const logsResponse = await apiClient.getLearningLogs(brandData.id, undefined, undefined, 5);
      if (logsResponse.success && logsResponse.data) {
        setLearningLogs(logsResponse.data as any[]);
      }
    } catch (err) {
      console.error('Error fetching memories:', err);
    } finally {
      setMemoryLoading(false);
    }
  };
  
  const handleMemorySearch = async () => {
    if (!brandData?.id || !memoryQuery.trim()) return;
    
    setMemoryLoading(true);
    try {
      const response = await apiClient.searchMemories(brandData.id, memoryQuery);
      if (response.success && response.data) {
        setMemories(response.data as any[]);
      }
    } catch (err) {
      console.error('Error searching memories:', err);
    } finally {
      setMemoryLoading(false);
    }
  };

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
            <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-4">Brand Overview</h3>
            <div className="space-y-4">
              <div>
                <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400">Brand Voice</h4>
                <p className="mt-1 text-sm text-gray-900 dark:text-gray-100">{brandData.brand_voice?.tone}</p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {brandData.brand_voice?.personality?.map((trait: string, idx: number) => (
                    <span key={idx} className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200">
                      {trait}
                    </span>
                  ))}
                </div>
              </div>
              
              <div>
                <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400">Target Audience</h4>
                <div className="mt-2 flex flex-wrap gap-2">
                  {brandData.target_audience?.demographics?.map((demo: string, idx: number) => (
                    <span key={idx} className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                      {demo}
                    </span>
                  ))}
                </div>
              </div>
              
              <div>
                <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400">Positioning</h4>
                <p className="mt-1 text-sm text-gray-900 dark:text-gray-100">{brandData.positioning?.value_proposition}</p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {brandData.positioning?.differentiators?.map((diff: string, idx: number) => (
                    <span key={idx} className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                      {diff}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        );
      
      case 'visual':
        return (
          <div className="p-4">
            <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-4">Visual Identity</h3>
            <div className="mb-4">
              <p className="text-gray-600 dark:text-gray-400 mb-2">
                Upload brand assets to help AI understand your visual identity.
              </p>
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
            <div className="mb-4">
              <p className="text-gray-600 dark:text-gray-400 mb-2">Words to avoid:</p>
              <div className="flex flex-wrap gap-2">
                {brandData.tone_preferences?.avoid_words?.map((keyword: string, index: number) => (
                  <span key={index} className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300">
                    {keyword}
                  </span>
                ))}
              </div>
            </div>
            <div className="mb-4">
              <button className="px-3 py-1 border border-purple-600 text-purple-600 dark:text-purple-400 dark:border-purple-400 rounded-md text-sm hover:bg-purple-50 dark:hover:bg-purple-900/30">
                Add keyword
              </button>
            </div>
          </div>
        );
      
      case 'memory':
        return (
          <div className="p-4">
            <div className="mb-6">
              <h3 className="text-lg font-semibold mb-2">Brand Memory</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                Access your brand's memory and learning records - this helps your brand AI evolve and improve over time.
              </p>
              
              <div className="flex items-center gap-2 mb-4">
                <input
                  type="text"
                  value={memoryQuery}
                  onChange={(e) => setMemoryQuery(e.target.value)}
                  placeholder="Search brand memories..."
                  className="flex-1 p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800"
                  onKeyDown={(e) => e.key === 'Enter' && handleMemorySearch()}
                />
                <button 
                  onClick={handleMemorySearch}
                  className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700"
                  disabled={memoryLoading}
                >
                  {memoryLoading ? 'Searching...' : 'Search'}
                </button>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                <h4 className="text-md font-medium mb-3">Recent Memories</h4>
                {memoryLoading ? (
                  <div className="animate-pulse space-y-3">
                    <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
                    <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
                    <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-5/6"></div>
                  </div>
                ) : memories.length > 0 ? (
                  <div className="space-y-3">
                    {memories.map((memory) => (
                      <div key={memory.id} className="border-l-4 border-purple-500 pl-3 py-1">
                        <div className="text-sm font-medium">{memory.type}</div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">
                          {new Date(memory.timestamp).toLocaleString()}
                        </div>
                        <p className="text-sm mt-1 text-gray-600 dark:text-gray-300">
                          {typeof memory.data === 'object' 
                            ? JSON.stringify(memory.data).substring(0, 100) + '...'
                            : String(memory.data).substring(0, 100) + '...'}
                        </p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-gray-500 dark:text-gray-400">No memories found.</p>
                )}
              </div>
              
              <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                <h4 className="text-md font-medium mb-3">Learning Logs</h4>
                {memoryLoading ? (
                  <div className="animate-pulse space-y-3">
                    <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
                    <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
                    <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-5/6"></div>
                  </div>
                ) : learningLogs.length > 0 ? (
                  <div className="space-y-3">
                    {learningLogs.map((log) => (
                      <div key={log.id} className={`border-l-4 ${
                        log.learningType === 'positive' ? 'border-green-500' : 'border-red-500'
                      } pl-3 py-1`}>
                        <div className="flex justify-between">
                          <div className="text-sm font-medium">
                            {log.source}
                            <span className={`ml-2 px-2 py-0.5 text-xs rounded-full ${
                              log.learningType === 'positive' 
                                ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' 
                                : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                            }`}>
                              {log.learningType}
                            </span>
                          </div>
                          <div className="text-xs text-gray-500 dark:text-gray-400">
                            Impact: {log.impact}/100
                          </div>
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">
                          {new Date(log.timestamp).toLocaleString()}
                        </div>
                        <p className="text-sm mt-1 text-gray-600 dark:text-gray-300">
                          {typeof log.data === 'object' 
                            ? JSON.stringify(log.data).substring(0, 100) + '...'
                            : String(log.data).substring(0, 100) + '...'}
                        </p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-gray-500 dark:text-gray-400">No learning logs found.</p>
                )}
              </div>
            </div>
          </div>
        );
      
      default:
        return <div>Select a tab to view content</div>;
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 shadow-sm sm:rounded-lg overflow-hidden">
      <div className="border-b border-gray-200 dark:border-gray-700">
        <nav className="-mb-px flex">
          <button
            onClick={() => setActiveTab('overview')}
            className={`w-1/4 py-4 px-1 text-center border-b-2 text-sm font-medium ${
              activeTab === 'overview'
                ? 'border-purple-500 text-purple-600 dark:text-purple-400'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
            }`}
          >
            Overview
          </button>
          <button
            onClick={() => setActiveTab('visual')}
            className={`w-1/4 py-4 px-1 text-center border-b-2 text-sm font-medium ${
              activeTab === 'visual'
                ? 'border-purple-500 text-purple-600 dark:text-purple-400'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
            }`}
          >
            Visual Identity
          </button>
          <button
            onClick={() => setActiveTab('keywords')}
            className={`w-1/4 py-4 px-1 text-center border-b-2 text-sm font-medium ${
              activeTab === 'keywords'
                ? 'border-purple-500 text-purple-600 dark:text-purple-400'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
            }`}
          >
            Keywords
          </button>
          <button
            onClick={() => setActiveTab('memory')}
            className={`w-1/4 py-4 px-1 text-center border-b-2 text-sm font-medium ${
              activeTab === 'memory'
                ? 'border-purple-500 text-purple-600 dark:text-purple-400'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
            }`}
          >
            Memory & Learning
          </button>
        </nav>
      </div>
      
      {renderTabContent()}
    </div>
  );
}

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
      
      case 'memory':
        return (
          <div className="p-4">
            <div className="mb-6">
              <h3 className="text-lg font-semibold mb-2">Brand Memory</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                Access your brand's memory and learning records - this helps your brand AI evolve and improve over time.
              </p>
              
              <div className="flex items-center gap-2 mb-4">
                <input
                  type="text"
                  value={memoryQuery}
                  onChange={(e) => setMemoryQuery(e.target.value)}
                  placeholder="Search brand memories..."
                  className="flex-1 p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800"
                  onKeyDown={(e) => e.key === 'Enter' && handleMemorySearch()}
                />
                <button 
                  onClick={handleMemorySearch}
                  className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700"
                  disabled={memoryLoading}
                >
                  {memoryLoading ? 'Searching...' : 'Search'}
                </button>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                <h4 className="text-md font-medium mb-3">Recent Memories</h4>
                {memoryLoading ? (
                  <div className="animate-pulse space-y-3">
                    <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
                    <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
                    <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-5/6"></div>
                  </div>
                ) : memories.length > 0 ? (
                  <div className="space-y-3">
                    {memories.map((memory) => (
                      <div key={memory.id} className="border-l-4 border-purple-500 pl-3 py-1">
                        <div className="text-sm font-medium">{memory.type}</div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">
                          {new Date(memory.timestamp).toLocaleString()}
                        </div>
                        <p className="text-sm mt-1 text-gray-600 dark:text-gray-300">
                          {typeof memory.data === 'object' 
                            ? JSON.stringify(memory.data).substring(0, 100) + '...'
                            : String(memory.data).substring(0, 100) + '...'}
                        </p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-gray-500 dark:text-gray-400">No memories found.</p>
                )}
              </div>
              
              <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                <h4 className="text-md font-medium mb-3">Learning Logs</h4>
                {memoryLoading ? (
                  <div className="animate-pulse space-y-3">
                    <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
                    <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
                    <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-5/6"></div>
                  </div>
                ) : learningLogs.length > 0 ? (
                  <div className="space-y-3">
                    {learningLogs.map((log) => (
                      <div key={log.id} className={`border-l-4 ${
                        log.learningType === 'positive' ? 'border-green-500' : 'border-red-500'
                      } pl-3 py-1`}>
                        <div className="flex justify-between">
                          <div className="text-sm font-medium">
                            {log.source}
                            <span className={`ml-2 px-2 py-0.5 text-xs rounded-full ${
                              log.learningType === 'positive' 
                                ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' 
                                : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                            }`}>
                              {log.learningType}
                            </span>
                          </div>
                          <div className="text-xs text-gray-500 dark:text-gray-400">
                            Impact: {log.impact}/100
                          </div>
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">
      <div className="border-b border-gray-200 dark:border-gray-700">
        <nav className="-mb-px flex">
          <button
            onClick={() => setActiveTab('overview')}
            className={`w-1/4 py-4 px-1 text-center border-b-2 text-sm font-medium ${
              activeTab === 'overview'
                ? 'border-purple-500 text-purple-600 dark:text-purple-400'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
            }`}
          >
            Overview
          </button>
          <button
            onClick={() => setActiveTab('visual')}
            className={`w-1/4 py-4 px-1 text-center border-b-2 text-sm font-medium ${
              activeTab === 'visual'
                ? 'border-purple-500 text-purple-600 dark:text-purple-400'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
            }`}
          >
            Visual IdentitysName="h-4 bg-gray-200 dark:bg-gray-700 rounded w-full"></div>
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-full"></div>
          <button
            onClick={() => setActiveTab('keywords')}
            className={`w-1/4 py-4 px-1 text-center border-b-2 text-sm font-medium ${
              activeTab === 'keywords'
                ? 'border-purple-500 text-purple-600 dark:text-purple-400'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
            }`}
          >
            Keywords
          </button>
          <button
            onClick={() => setActiveTab('memory')}
            className={`w-1/4 py-4 px-1 text-center border-b-2 text-sm font-medium ${
              activeTab === 'memory'
                ? 'border-purple-500 text-purple-600 dark:text-purple-400'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
            }`}
          >
            Memory & Learning
            <div className="mb-4">
              <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Learning Logs</h3>
              {memoryLoading ? (
                <div className="animate-pulse flex flex-col space-y-4">
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-full"></div>
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-full"></div>
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-full"></div>
                </div>
              ) : (
                <div>
                  {learningLogs.length === 0 ? (
                    <p className="text-gray-500 dark:text-gray-400 text-sm">No learning logs found. Add a new log to get started.</p>
                  ) : (
                    <ul className="space-y-2">
                      {learningLogs.map((log) => (
                        <li key={log.id} className="p-3 bg-gray-100 dark:bg-gray-700 rounded-md shadow-sm">
                          <p className="text-sm text-gray-800 dark:text-gray-200">{log.content}</p>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              )}
            </div>
            
            <div>
              <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Search Memories</h3>
              <div className="flex mt-2">
                <input
                  type="text"
                  value={memoryQuery}
                  onChange={(e) => setMemoryQuery(e.target.value)}
                  className="flex-1 px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-l-md focus:outline-none focus:ring-1 focus:ring-purple-500 focus:border-purple-500"
                  placeholder="Enter keywords to search memories"
                />
                <button
                  onClick={handleMemorySearch}
                  className="px-4 py-2 text-sm font-medium rounded-r-md text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
                >
                  Search
                </button>
              </div>
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
          <button
            onClick={() => setActiveTab('memory')}
            className={`w-1/3 py-4 px-1 text-center border-b-2 text-sm font-medium ${
              activeTab === 'memory'
                ? 'border-purple-500 text-purple-600 dark:text-purple-400'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
            }`}
          >
            Memory & Learning
          </button>
        </nav>
      </div>
      
      {renderTabContent()}
    </div>
  );
}
