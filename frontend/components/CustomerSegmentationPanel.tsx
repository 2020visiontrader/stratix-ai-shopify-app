import {
    ArcElement,
    Chart as ChartJS,
    Legend,
    Tooltip
} from 'chart.js';
import { useEffect, useState } from 'react';
import { Pie } from 'react-chartjs-2';

ChartJS.register(ArcElement, Tooltip, Legend);

interface Segment {
  id: string;
  name: string;
  description: string;
  count: number;
  ltv: number;
  churnRisk: number;
  createdAt: string;
}

interface Customer {
  id: string;
  name: string;
  email: string;
  totalOrders: number;
  totalSpent: number;
  lastOrderDate: string;
  tags: string[];
}

export default function CustomerSegmentationPanel() {
  const [segments, setSegments] = useState<Segment[]>([]);
  const [selected, setSelected] = useState<string | null>(null);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [loadingCustomers, setLoadingCustomers] = useState(false);

  useEffect(() => {
    const fetchSegments = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch('/api/segments');
        const data = await res.json();
        if (data.success) {
          setSegments(data.data);
        } else {
          setError('Failed to load segments');
        }
      } catch (err) {
        setError('Failed to load segments');
      } finally {
        setLoading(false);
      }
    };
    fetchSegments();
  }, []);

  useEffect(() => {
    if (!selected) {
      setCustomers([]);
      return;
    }
    const fetchCustomers = async () => {
      setLoadingCustomers(true);
      setError(null);
      try {
        const res = await fetch(`/api/segments/${selected}`);
        const data = await res.json();
        if (data.success) {
          setCustomers(data.data);
        } else {
          setError('Failed to load customers');
        }
      } catch (err) {
        setError('Failed to load customers');
      } finally {
        setLoadingCustomers(false);
      }
    };
    fetchCustomers();
  }, [selected]);

  const pieData = {
    labels: segments.map(s => s.name),
    datasets: [
      {
        label: 'Customers',
        data: segments.map(s => s.count),
        backgroundColor: [
          '#6366f1', '#f59e42', '#10b981', '#f43f5e', '#a21caf', '#fbbf24', '#3b82f6', '#14b8a6'
        ],
        borderWidth: 1,
      },
    ],
  };

  return (
    <div className="bg-white shadow rounded-lg p-6">
      <h2 className="text-xl font-bold mb-4 text-gray-900">Customer Segmentation</h2>
      {loading ? (
        <div className="py-8 text-center text-gray-500">Loading segments...</div>
      ) : error ? (
        <div className="py-2 text-red-600">{error}</div>
      ) : segments.length === 0 ? (
        <div className="py-8 text-center text-gray-400">No segments found.</div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div>
              <Pie data={pieData} />
            </div>
            <div>
              <ul className="divide-y divide-gray-200">
                {segments.map(segment => (
                  <li
                    key={segment.id}
                    className={`py-3 cursor-pointer ${selected === segment.id ? 'bg-purple-50' : ''}`}
                    onClick={() => setSelected(segment.id)}
                    aria-selected={selected === segment.id}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-medium text-gray-900">{segment.name}</div>
                        <div className="text-xs text-gray-500">{segment.description}</div>
                      </div>
                      <div className="flex flex-col items-end">
                        <span className="text-sm font-semibold text-purple-700">{segment.count} customers</span>
                        <span className="text-xs text-gray-400">LTV: ${segment.ltv}</span>
                        <span className="text-xs text-red-500">Churn: {(segment.churnRisk * 100).toFixed(1)}%</span>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </div>
          {selected && (
            <div className="mt-6">
              <h3 className="text-lg font-semibold mb-2 text-gray-800">Customers in "{segments.find(s => s.id === selected)?.name}"</h3>
              {loadingCustomers ? (
                <div className="py-4 text-center text-gray-500">Loading customers...</div>
              ) : customers.length === 0 ? (
                <div className="py-4 text-center text-gray-400">No customers in this segment.</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead>
                      <tr>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Orders</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Total Spent</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Last Order</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-100">
                      {customers.map(cust => (
                        <tr key={cust.id}>
                          <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900">{cust.name}</td>
                          <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-500">{cust.email}</td>
                          <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-500">{cust.totalOrders}</td>
                          <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-500">${cust.totalSpent}</td>
                          <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-500">{new Date(cust.lastOrderDate).toLocaleDateString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
} 