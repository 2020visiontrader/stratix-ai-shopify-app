import { useEffect, useState } from 'react';
import { apiClient } from '../src/lib/api-client';

interface KnowledgeFeedItem {
  id: string;
  title: string;
  content: string;
  category: string;
  tags: string[];
  createdAt: string;
  updatedAt: string;
  relevance: number;
}

export default function KnowledgeFeedPanel() {
  const [items, setItems] = useState<KnowledgeFeedItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchFeed = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await apiClient.getKnowledgeFeedItems();
        if (response.success && Array.isArray(response.data)) {
          setItems(response.data);
        } else {
          setError('No knowledge feed items found.');
        }
      } catch (err: any) {
        setError('Failed to load knowledge feed.');
      } finally {
        setLoading(false);
      }
    };
    fetchFeed();
  }, []);

  if (loading) {
    return (
      <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-4 animate-pulse">
        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-2"></div>
        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2 mb-2"></div>
        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-5/6"></div>
      </div>
    );
  }
  if (error) {
    return <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-4 text-red-600 dark:text-red-400">{error}</div>;
  }
  if (!items.length) {
    return <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-4 text-gray-500 dark:text-gray-400">No knowledge feed items available.</div>;
  }

  return (
    <div className="bg-white dark:bg-gray-800 shadow rounded-lg overflow-hidden">
      <div className="px-4 py-5 sm:px-6 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
        <h3 className="text-lg font-medium text-gray-900 dark:text-white">Knowledge Feed</h3>
        <button className="text-sm text-purple-600 hover:text-purple-500 dark:text-purple-400 dark:hover:text-purple-300">Ingest New</button>
      </div>
      <div className="divide-y divide-gray-200 dark:divide-gray-700">
        {items.map(item => (
          <div key={item.id} className="px-4 py-4">
            <div className="flex items-center justify-between">
              <h4 className="text-base font-semibold text-gray-900 dark:text-white">{item.title}</h4>
              <span className="text-xs px-2 py-1 rounded bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200 ml-2">{item.category}</span>
            </div>
            <div className="mt-1 text-sm text-gray-600 dark:text-gray-300 line-clamp-2">{item.content}</div>
            <div className="mt-2 flex flex-wrap gap-2">
              {item.tags.map(tag => (
                <span key={tag} className="inline-block px-2 py-0.5 rounded bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300 text-xs">{tag}</span>
              ))}
            </div>
            <div className="mt-2 text-xs text-gray-400">Added {new Date(item.createdAt).toLocaleString()}</div>
          </div>
        ))}
      </div>
    </div>
  );
} 