import {
    BarElement,
    CategoryScale,
    Chart as ChartJS,
    Legend,
    LinearScale,
    Tooltip
} from 'chart.js';
import { useEffect, useState } from 'react';
import { Bar } from 'react-chartjs-2';

ChartJS.register(BarElement, CategoryScale, LinearScale, Tooltip, Legend);

interface Model {
  id: string;
  name: string;
  version: string;
  status: string;
  createdAt: string;
  updatedAt: string;
}

interface UsageLog {
  id: string;
  modelId: string;
  tokensUsed: number;
  cost: number;
  createdAt: string;
}

interface ComparisonModel {
  modelId: string;
  modelName: string;
  metrics: {
    accuracy: number;
    cost: number;
    responseTime: number;
  };
  rank: number;
}

export default function AIModelManagementPanel() {
  const [models, setModels] = useState<Model[]>([]);
  const [usage, setUsage] = useState<UsageLog[]>([]);
  const [comparison, setComparison] = useState<ComparisonModel[]>([]);
  const [recommendations, setRecommendations] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        const [modelsRes, usageRes, compareRes] = await Promise.all([
          fetch('/api/ai/models'),
          fetch('/api/ai/usage'),
          fetch('/api/ai/compare'),
        ]);
        const modelsData = await modelsRes.json();
        const usageData = await usageRes.json();
        const compareData = await compareRes.json();
        if (modelsData.success && usageData.success && compareData.success) {
          setModels(modelsData.data);
          setUsage(usageData.data);
          setComparison(compareData.data.models);
          setRecommendations(compareData.data.recommendations);
        } else {
          setError('Failed to load AI model data');
        }
      } catch (err) {
        setError('Failed to load AI model data');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const usageChartData = {
    labels: usage.map(u => `${u.modelId} (${u.createdAt})`),
    datasets: [
      {
        label: 'Tokens Used',
        data: usage.map(u => u.tokensUsed),
        backgroundColor: '#6366f1',
      },
      {
        label: 'Cost ($)',
        data: usage.map(u => u.cost),
        backgroundColor: '#f59e42',
      },
    ],
  };

  return (
    <div className="bg-white shadow rounded-lg p-6">
      <h2 className="text-xl font-bold mb-4 text-gray-900">AI Model Management</h2>
      {loading ? (
        <div className="py-8 text-center text-gray-500">Loading AI model data...</div>
      ) : error ? (
        <div className="py-2 text-red-600">{error}</div>
      ) : (
        <>
          <div className="mb-6">
            <h3 className="text-md font-semibold text-gray-800 mb-2">Models</h3>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead>
                  <tr>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Version</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Created</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Updated</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-100">
                  {models.map(model => (
                    <tr key={model.id}>
                      <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900">{model.name}</td>
                      <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-500">{model.version}</td>
                      <td className="px-4 py-2 whitespace-nowrap text-sm">
                        <span className={`px-2 py-1 rounded text-xs font-semibold ${model.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>{model.status}</span>
                      </td>
                      <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-400">{model.createdAt}</td>
                      <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-400">{model.updatedAt}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          <div className="mb-6">
            <h3 className="text-md font-semibold text-gray-800 mb-2">Usage & Cost</h3>
            <Bar data={usageChartData} options={{ responsive: true, plugins: { legend: { position: 'top' } } }} />
          </div>
          <div className="mb-6">
            <h3 className="text-md font-semibold text-gray-800 mb-2">Model Comparison</h3>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead>
                  <tr>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Model</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Accuracy</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Cost ($)</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Response Time (ms)</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Rank</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-100">
                  {comparison.map(model => (
                    <tr key={model.modelId}>
                      <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900">{model.modelName}</td>
                      <td className="px-4 py-2 whitespace-nowrap text-sm text-green-700">{(model.metrics.accuracy * 100).toFixed(1)}%</td>
                      <td className="px-4 py-2 whitespace-nowrap text-sm text-purple-700">${model.metrics.cost.toFixed(2)}</td>
                      <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-700">{model.metrics.responseTime}</td>
                      <td className="px-4 py-2 whitespace-nowrap text-sm font-bold">{model.rank}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          <div>
            <h3 className="text-md font-semibold text-gray-800 mb-2">Recommendations</h3>
            <ul className="list-disc list-inside text-sm text-blue-700">
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