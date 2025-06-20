import { useState } from 'react';
import { apiClient } from '../src/lib/api-client';

export default function ShopifySyncPanel() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [lastSync, setLastSync] = useState<Date | null>(null);

  const handleSync = async () => {
    setLoading(true);
    setError(null);
    setSuccess(null);
    try {
      const response = await apiClient.syncShopifyStore();
      if (response.success) {
        setSuccess('Shopify store synced successfully!');
        setLastSync(new Date());
      } else {
        setError(response.error || 'Failed to sync Shopify store.');
      }
    } catch (err: any) {
      setError('Failed to sync Shopify store.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 shadow rounded-lg overflow-hidden">
      <div className="px-4 py-5 sm:px-6 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
        <h3 className="text-lg font-medium text-gray-900 dark:text-white">Shopify Store Sync</h3>
        <button
          className={`px-4 py-2 rounded text-sm font-medium ${loading ? 'bg-gray-400' : 'bg-green-600 hover:bg-green-700 text-white'}`}
          onClick={handleSync}
          disabled={loading}
        >
          {loading ? 'Syncing...' : 'Sync Store'}
        </button>
      </div>
      {error && <div className="px-4 py-2 text-red-600 dark:text-red-400">{error}</div>}
      {success && <div className="px-4 py-2 text-green-600 dark:text-green-400">{success}</div>}
      <div className="px-4 py-4">
        <div className="text-sm text-gray-500 dark:text-gray-400">
          {lastSync
            ? `Last sync: ${lastSync.toLocaleString()}`
            : 'Store has not been synced yet.'}
        </div>
      </div>
    </div>
  );
} 