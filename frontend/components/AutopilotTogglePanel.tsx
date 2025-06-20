import { useEffect, useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { apiClient } from '../src/lib/api-client';

export default function AutopilotTogglePanel() {
  const { user } = useAuth();
  const [enabled, setEnabled] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);
  const [toggling, setToggling] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    const fetchStatus = async () => {
      if (!user) {
        setError('User not authenticated.');
        setLoading(false);
        return;
      }
      setLoading(true);
      setError(null);
      try {
        const response = await apiClient.getAutopilotStatus(user.id);
        if (response.success && typeof response.data?.enabled === 'boolean') {
          setEnabled(response.data.enabled);
        } else {
          setError(response.error || 'Failed to fetch autopilot status.');
        }
      } catch (err: any) {
        setError('Failed to fetch autopilot status.');
      } finally {
        setLoading(false);
      }
    };
    fetchStatus();
  }, [user]);

  const handleToggle = async () => {
    if (!user || enabled === null) return;
    setToggling(true);
    setError(null);
    setSuccess(null);
    try {
      const response = await apiClient.setAutopilot(user.id, !enabled);
      if (response.success) {
        setEnabled(!enabled);
        setSuccess(`Autopilot ${!enabled ? 'enabled' : 'disabled'} successfully!`);
      } else {
        setError(response.error || 'Failed to update autopilot status.');
      }
    } catch (err: any) {
      setError('Failed to update autopilot status.');
    } finally {
      setToggling(false);
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 shadow rounded-lg overflow-hidden">
      <div className="px-4 py-5 sm:px-6 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
        <h3 className="text-lg font-medium text-gray-900 dark:text-white">Autopilot Mode</h3>
        <button
          className={`px-4 py-2 rounded text-sm font-medium ${toggling || loading ? 'bg-gray-400' : enabled ? 'bg-green-600 hover:bg-green-700 text-white' : 'bg-purple-600 hover:bg-purple-700 text-white'}`}
          onClick={handleToggle}
          disabled={toggling || loading || enabled === null}
        >
          {loading ? 'Loading...' : toggling ? 'Updating...' : enabled ? 'Disable Autopilot' : 'Enable Autopilot'}
        </button>
      </div>
      {error && <div className="px-4 py-2 text-red-600 dark:text-red-400">{error}</div>}
      {success && <div className="px-4 py-2 text-green-600 dark:text-green-400">{success}</div>}
      <div className="px-4 py-4">
        <div className="text-sm text-gray-500 dark:text-gray-400">
          {enabled === null
            ? 'Autopilot status unknown.'
            : enabled
              ? 'Autopilot is currently enabled. The AI will optimize your campaigns automatically.'
              : 'Autopilot is currently disabled. Manual control is active.'}
        </div>
      </div>
    </div>
  );
} 