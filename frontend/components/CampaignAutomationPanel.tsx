import { useEffect, useState } from 'react';
import { apiClient } from '../src/lib/api-client';

interface Campaign {
  id: string;
  name: string;
  type: string;
  status: string;
  createdAt: string;
  updatedAt: string;
}

export default function CampaignAutomationPanel() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [triggering, setTriggering] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    const fetchCampaigns = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch('/api/campaigns');
        const data = await res.json();
        if (data.success && Array.isArray(data.data)) {
          setCampaigns(data.data);
        } else {
          setError('No campaigns found.');
        }
      } catch (err: any) {
        setError('Failed to load campaigns.');
      } finally {
        setLoading(false);
      }
    };
    fetchCampaigns();
  }, []);

  const handleTrigger = async (campaignId: string) => {
    setTriggering(campaignId);
    setSuccess(null);
    setError(null);
    try {
      // For demo, use a placeholder email. In production, use the real user email.
      const response = await apiClient.triggerCampaignAutomation('demo@stratix.ai', Number(campaignId));
      if (response.success) {
        setSuccess('Campaign automation triggered!');
      } else {
        setError(response.error || 'Failed to trigger campaign automation.');
      }
    } catch (err: any) {
      setError('Failed to trigger campaign automation.');
    } finally {
      setTriggering(null);
    }
  };

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
  if (!campaigns.length) {
    return <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-4 text-gray-500 dark:text-gray-400">No campaigns available.</div>;
  }

  return (
    <div className="bg-white dark:bg-gray-800 shadow rounded-lg overflow-hidden">
      <div className="px-4 py-5 sm:px-6 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
        <h3 className="text-lg font-medium text-gray-900 dark:text-white">Campaign Automation</h3>
      </div>
      {success && <div className="px-4 py-2 text-green-600 dark:text-green-400">{success}</div>}
      <div className="divide-y divide-gray-200 dark:divide-gray-700">
        {campaigns.map(campaign => (
          <div key={campaign.id} className="px-4 py-4 flex items-center justify-between">
            <div>
              <h4 className="text-base font-semibold text-gray-900 dark:text-white">{campaign.name}</h4>
              <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">Type: {campaign.type} | Status: {campaign.status}</div>
            </div>
            <button
              className={`px-4 py-2 rounded text-sm font-medium ${triggering === campaign.id ? 'bg-gray-400' : 'bg-purple-600 hover:bg-purple-700 text-white'}`}
              onClick={() => handleTrigger(campaign.id)}
              disabled={!!triggering}
            >
              {triggering === campaign.id ? 'Triggering...' : 'Trigger Automation'}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
} 