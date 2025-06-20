import { useEffect, useState } from 'react';

interface PerformanceSummary {
  averageLoadTime: number;
  averageMemoryUsage: number;
  averageFrameRate: number;
}

export default function PerformancePanel() {
  const [summary, setSummary] = useState<PerformanceSummary | null>(null);
  const [trends, setTrends] = useState<string[]>([]);
  const [recommendations, setRecommendations] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchPerformance = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch('/api/performance/suggestions');
        const data = await res.json();
        if (data.success) {
          setSummary(data.data.summary);
          setTrends(data.data.trends);
          setRecommendations(data.data.recommendations);
        } else {
          setError('Failed to load performance data');
        }
      } catch (err) {
        setError('Failed to load performance data');
      } finally {
        setLoading(false);
      }
    };
    fetchPerformance();
  }, []);

  return (
    <div className="bg-white shadow rounded-lg p-6">
      <h2 className="text-xl font-bold mb-4 text-gray-900">Performance Analysis</h2>
      {loading ? (
        <div className="py-8 text-center text-gray-500">Loading performance data...</div>
      ) : error ? (
        <div className="py-2 text-red-600">{error}</div>
      ) : !summary ? (
        <div className="py-8 text-center text-gray-400">No performance data found.</div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="bg-purple-50 rounded p-4 text-center">
              <div className="text-xs text-gray-500">Avg. Load Time</div>
              <div className="text-lg font-semibold text-purple-700">{summary.averageLoadTime} ms</div>
            </div>
            <div className="bg-purple-50 rounded p-4 text-center">
              <div className="text-xs text-gray-500">Avg. Memory Usage</div>
              <div className="text-lg font-semibold text-purple-700">{(summary.averageMemoryUsage / (1024 * 1024)).toFixed(1)} MB</div>
            </div>
            <div className="bg-purple-50 rounded p-4 text-center">
              <div className="text-xs text-gray-500">Avg. Frame Rate</div>
              <div className="text-lg font-semibold text-purple-700">{summary.averageFrameRate} fps</div>
            </div>
          </div>
          <div className="mb-4">
            <h3 className="text-md font-semibold text-gray-800 mb-2">Trends</h3>
            <ul className="list-disc list-inside text-sm text-gray-700">
              {trends.map((trend, i) => (
                <li key={i}>{trend}</li>
              ))}
            </ul>
          </div>
          <div>
            <h3 className="text-md font-semibold text-gray-800 mb-2">Recommendations</h3>
            <ul className="list-disc list-inside text-sm text-green-700">
              {recommendations.map((rec, i) => (
                <li key={i}>{rec}</li>
              ))}
            </ul>
          </div>
        </>
      )}
    </div>
  );
} 