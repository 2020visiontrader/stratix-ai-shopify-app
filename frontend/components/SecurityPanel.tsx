import { useEffect, useState } from 'react';

interface SecurityOverview {
  overallScore: number;
  totalChecks: number;
  passedChecks: number;
  warnings: number;
  failures: number;
  lastUpdated: string | null;
}

interface SecurityCheck {
  id: string;
  name: string;
  description: string;
  severity: string;
  status: string;
  lastChecked: string;
  recommendation?: string;
}

export default function SecurityPanel() {
  const [overview, setOverview] = useState<SecurityOverview | null>(null);
  const [checks, setChecks] = useState<SecurityCheck[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchSecurity = async () => {
      setLoading(true);
      setError(null);
      try {
        // For demo, use a mock userId
        const res = await fetch('/api/security/status?userId=demo');
        const data = await res.json();
        if (data.success) {
          setOverview(data.data.overview);
          setChecks(data.data.checks);
        } else {
          setError('Failed to load security status');
        }
      } catch (err) {
        setError('Failed to load security status');
      } finally {
        setLoading(false);
      }
    };
    fetchSecurity();
  }, []);

  return (
    <div className="bg-white shadow rounded-lg p-6">
      <h2 className="text-xl font-bold mb-4 text-gray-900">Security & Audit</h2>
      {loading ? (
        <div className="py-8 text-center text-gray-500">Loading security status...</div>
      ) : error ? (
        <div className="py-2 text-red-600">{error}</div>
      ) : !overview ? (
        <div className="py-8 text-center text-gray-400">No security data found.</div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="bg-green-50 rounded p-4 text-center">
              <div className="text-xs text-gray-500">Security Score</div>
              <div className="text-lg font-semibold text-green-700">{overview.overallScore}%</div>
            </div>
            <div className="bg-green-50 rounded p-4 text-center">
              <div className="text-xs text-gray-500">Checks</div>
              <div className="text-lg font-semibold text-green-700">{overview.passedChecks}/{overview.totalChecks}</div>
            </div>
            <div className="bg-green-50 rounded p-4 text-center">
              <div className="text-xs text-gray-500">Warnings / Failures</div>
              <div className="text-lg font-semibold text-yellow-600">{overview.warnings}</div>
              <div className="text-lg font-semibold text-red-600">{overview.failures}</div>
            </div>
          </div>
          <div className="mb-4 text-xs text-gray-400">Last updated: {overview.lastUpdated ? new Date(overview.lastUpdated).toLocaleString() : 'N/A'}</div>
          <div>
            <h3 className="text-md font-semibold text-gray-800 mb-2">Recent Security Checks</h3>
            <ul className="divide-y divide-gray-100">
              {checks.map(check => (
                <li key={check.id} className="py-2 flex items-center justify-between">
                  <div>
                    <div className="font-medium text-gray-900">{check.name}</div>
                    <div className="text-xs text-gray-500">{check.description}</div>
                    {check.recommendation && (
                      <div className="text-xs text-purple-700 mt-1">{check.recommendation}</div>
                    )}
                  </div>
                  <div className="flex flex-col items-end">
                    <span className={`text-xs font-semibold ${check.status === 'pass' ? 'text-green-700' : check.status === 'warning' ? 'text-yellow-600' : 'text-red-600'}`}>{check.status.toUpperCase()}</span>
                    <span className="text-xs text-gray-400">{check.severity}</span>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </>
      )}
    </div>
  );
} 