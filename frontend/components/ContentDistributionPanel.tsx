import React, { useEffect, useState } from 'react';

interface Channel {
  id: string;
  name: string;
  type: string;
}

interface Distribution {
  id: string;
  content: string;
  channel: string;
  status: string;
  scheduledAt: string;
  publishedAt: string | null;
  metrics: {
    impressions: number;
    clicks: number;
    engagement: number;
  };
}

export default function ContentDistributionPanel() {
  const [channels, setChannels] = useState<Channel[]>([]);
  const [history, setHistory] = useState<Distribution[]>([]);
  const [content, setContent] = useState('');
  const [channel, setChannel] = useState('');
  const [scheduleAt, setScheduleAt] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        const [channelsRes, historyRes] = await Promise.all([
          fetch('/api/distribution/channels'),
          fetch('/api/distribution/history'),
        ]);
        const channelsData = await channelsRes.json();
        const historyData = await historyRes.json();
        if (channelsData.success && historyData.success) {
          setChannels(channelsData.data);
          setHistory(historyData.data);
        } else {
          setError('Failed to load distribution data');
        }
      } catch (err) {
        setError('Failed to load distribution data');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    setSending(true);
    setError(null);
    setSuccess(null);
    try {
      const res = await fetch('/api/distribution/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content, channel, scheduleAt }),
      });
      const data = await res.json();
      if (data.success) {
        setSuccess('Content scheduled/sent successfully.');
        setContent('');
        setChannel('');
        setScheduleAt('');
      } else {
        setError('Failed to send content');
      }
    } catch (err) {
      setError('Failed to send content');
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="bg-white shadow rounded-lg p-6">
      <h2 className="text-xl font-bold mb-4 text-gray-900">Content Distribution</h2>
      {loading ? (
        <div className="py-8 text-center text-gray-500">Loading distribution data...</div>
      ) : error ? (
        <div className="py-2 text-red-600">{error}</div>
      ) : (
        <>
          <form onSubmit={handleSend} className="mb-6 space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Content</label>
              <textarea
                className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                rows={3}
                value={content}
                onChange={e => setContent(e.target.value)}
                required
                placeholder="Enter content to distribute..."
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Channel</label>
              <select
                className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                value={channel}
                onChange={e => setChannel(e.target.value)}
                required
              >
                <option value="">Select a channel</option>
                {channels.map(ch => (
                  <option key={ch.id} value={ch.id}>{ch.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Schedule At (optional)</label>
              <input
                type="datetime-local"
                className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                value={scheduleAt}
                onChange={e => setScheduleAt(e.target.value)}
              />
            </div>
            <div className="flex items-center gap-4">
              <button
                type="submit"
                className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700 disabled:opacity-50"
                disabled={sending}
              >
                {sending ? 'Sending...' : 'Send/Schedule'}
              </button>
              {success && <span className="text-green-600 text-sm">{success}</span>}
            </div>
          </form>
          <div>
            <h3 className="text-md font-semibold text-gray-800 mb-2">Distribution History</h3>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead>
                  <tr>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Content</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Channel</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Scheduled</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Published</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Impressions</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Clicks</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Engagement</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-100">
                  {history.map(dist => (
                    <tr key={dist.id}>
                      <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900">{dist.content}</td>
                      <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-500">{channels.find(c => c.id === dist.channel)?.name || dist.channel}</td>
                      <td className="px-4 py-2 whitespace-nowrap text-sm">
                        <span className={`px-2 py-1 rounded text-xs font-semibold ${dist.status === 'published' ? 'bg-green-100 text-green-700' : dist.status === 'scheduled' ? 'bg-yellow-100 text-yellow-700' : 'bg-gray-100 text-gray-500'}`}>{dist.status}</span>
                      </td>
                      <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-400">{dist.scheduledAt ? new Date(dist.scheduledAt).toLocaleString() : '-'}</td>
                      <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-400">{dist.publishedAt ? new Date(dist.publishedAt).toLocaleString() : '-'}</td>
                      <td className="px-4 py-2 whitespace-nowrap text-sm text-blue-700">{dist.metrics.impressions}</td>
                      <td className="px-4 py-2 whitespace-nowrap text-sm text-purple-700">{dist.metrics.clicks}</td>
                      <td className="px-4 py-2 whitespace-nowrap text-sm text-green-700">{dist.metrics.engagement}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
} 