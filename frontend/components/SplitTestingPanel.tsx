import { useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { apiClient } from '../src/lib/api-client';

export default function SplitTestingPanel() {
  const { user } = useAuth();
  const [experimentKey, setExperimentKey] = useState('');
  const [variations, setVariations] = useState<string[]>(['', '']);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleVariationChange = (index: number, value: string) => {
    setVariations((prev) => prev.map((v, i) => (i === index ? value : v)));
  };

  const handleAddVariation = () => {
    setVariations((prev) => [...prev, '']);
  };

  const handleRemoveVariation = (index: number) => {
    setVariations((prev) => prev.filter((_, i) => i !== index));
  };

  const handleRunTest = async () => {
    if (!user) {
      setError('User not authenticated.');
      return;
    }
    if (!experimentKey.trim() || variations.some(v => !v.trim())) {
      setError('Please provide an experiment key and all variations.');
      return;
    }
    setLoading(true);
    setError(null);
    setSuccess(null);
    try {
      const response = await apiClient.runSplitTest(user.id, experimentKey, variations);
      if (response.success) {
        setSuccess('Split test started successfully!');
      } else {
        setError(response.error || 'Failed to start split test.');
      }
    } catch (err: any) {
      setError('Failed to start split test.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 shadow rounded-lg overflow-hidden">
      <div className="px-4 py-5 sm:px-6 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
        <h3 className="text-lg font-medium text-gray-900 dark:text-white">Split Testing</h3>
      </div>
      {error && <div className="px-4 py-2 text-red-600 dark:text-red-400">{error}</div>}
      {success && <div className="px-4 py-2 text-green-600 dark:text-green-400">{success}</div>}
      <div className="px-4 py-4 space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Experiment Key</label>
          <input
            type="text"
            className="w-full px-3 py-2 rounded border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none"
            value={experimentKey}
            onChange={e => setExperimentKey(e.target.value)}
            disabled={loading}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Variations</label>
          {variations.map((variation, idx) => (
            <div key={idx} className="flex items-center mb-2">
              <input
                type="text"
                className="flex-1 px-3 py-2 rounded border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none"
                value={variation}
                onChange={e => handleVariationChange(idx, e.target.value)}
                disabled={loading}
              />
              {variations.length > 2 && (
                <button
                  className="ml-2 px-2 py-1 text-xs text-red-600 dark:text-red-400 border border-red-200 dark:border-red-600 rounded hover:bg-red-50 dark:hover:bg-red-900"
                  onClick={() => handleRemoveVariation(idx)}
                  disabled={loading}
                  type="button"
                >
                  Remove
                </button>
              )}
            </div>
          ))}
          <button
            className="mt-2 px-3 py-1 border border-purple-600 text-purple-600 dark:text-purple-400 dark:border-purple-400 rounded-md text-sm hover:bg-purple-50 dark:hover:bg-purple-900/30"
            onClick={handleAddVariation}
            disabled={loading}
            type="button"
          >
            Add Variation
          </button>
        </div>
        <div>
          <button
            className={`w-full px-4 py-2 rounded text-sm font-medium ${loading ? 'bg-gray-400' : 'bg-purple-600 hover:bg-purple-700 text-white'}`}
            onClick={handleRunTest}
            disabled={loading}
          >
            {loading ? 'Running...' : 'Run Split Test'}
          </button>
        </div>
      </div>
    </div>
  );
} 