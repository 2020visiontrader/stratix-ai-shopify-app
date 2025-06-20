import { useMemo, useState } from 'react';
import { FeatureToggle } from '../../src/components/FeatureToggle';
import { useFeature } from '../../src/hooks/useFeature';

export default function FeatureFlagPanel() {
  const { features, toggleFeature, loading, error } = useFeature();
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');
  const [success, setSuccess] = useState<string | null>(null);
  const [toggleError, setToggleError] = useState<string | null>(null);

  const featureList = useMemo(() => {
    const arr = Array.from(features.values());
    let filtered = arr;
    if (filter !== 'all') {
      filtered = filtered.filter(f => f.metadata.category === filter);
    }
    if (search.trim()) {
      filtered = filtered.filter(f =>
        f.name.toLowerCase().includes(search.toLowerCase()) ||
        f.description.toLowerCase().includes(search.toLowerCase())
      );
    }
    return filtered.sort((a, b) => a.name.localeCompare(b.name));
  }, [features, search, filter]);

  const categories = useMemo(() => {
    const cats = new Set(Array.from(features.values()).map(f => f.metadata.category));
    return ['all', ...Array.from(cats)];
  }, [features]);

  const handleToggle = async (featureId: string, enabled: boolean) => {
    setToggleError(null);
    setSuccess(null);
    try {
      await toggleFeature(featureId, enabled);
      setSuccess(`Feature "${featureId}" ${enabled ? 'enabled' : 'disabled'} successfully.`);
    } catch (err: any) {
      setToggleError(err.message || 'Failed to toggle feature.');
    }
  };

  return (
    <div className="bg-white shadow rounded-lg p-6">
      <div className="mb-4 flex flex-col md:flex-row md:items-center md:justify-between gap-2">
        <h2 className="text-xl font-bold text-gray-900">Feature Flags</h2>
        <div className="flex gap-2 items-center">
          <input
            type="text"
            placeholder="Search features..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="border border-gray-300 rounded px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
            aria-label="Search features"
          />
          <select
            value={filter}
            onChange={e => setFilter(e.target.value)}
            className="border border-gray-300 rounded px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
            aria-label="Filter by category"
          >
            {categories.map(cat => (
              <option key={cat} value={cat}>{cat.charAt(0).toUpperCase() + cat.slice(1)}</option>
            ))}
          </select>
        </div>
      </div>
      {loading && <div className="py-8 text-center text-gray-500">Loading features...</div>}
      {error && <div className="py-2 text-red-600">{error}</div>}
      {toggleError && <div className="py-2 text-red-600">{toggleError}</div>}
      {success && <div className="py-2 text-green-600">{success}</div>}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
        {featureList.length === 0 && !loading && (
          <div className="col-span-full text-center text-gray-400">No features found.</div>
        )}
        {featureList.map(feature => (
          <FeatureToggle
            key={feature.id}
            feature={feature}
            onToggle={enabled => handleToggle(feature.id, enabled)}
            showTooltip
            requireConfirmation={feature.config.requiresAuth}
          />
        ))}
      </div>
    </div>
  );
} 