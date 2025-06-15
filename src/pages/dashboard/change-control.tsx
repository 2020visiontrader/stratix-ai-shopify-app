import { useEffect, useState } from 'react';

interface RewriteSuggestion {
  id: string;
  content: string;
  status: 'pending' | 'approved' | 'rejected';
  timestamp: Date;
}

interface ContentSnapshot {
  id: string;
  content: string;
  timestamp: Date;
}

interface ApprovalLog {
  id: string;
  action: string;
  by: string;
  timestamp: Date;
}

export default function ChangeControlPanel() {
  const [suggestions, setSuggestions] = useState<RewriteSuggestion[]>([]);
  const [snapshots, setSnapshots] = useState<ContentSnapshot[]>([]);
  const [logs, setLogs] = useState<ApprovalLog[]>([]);
  const [locked, setLocked] = useState(false);

  useEffect(() => {
    // TODO: Fetch suggestions, snapshots, logs, and lock state from backend
    setSuggestions([
      { id: '1', content: 'New headline suggestion', status: 'pending', timestamp: new Date() }
    ]);
    setSnapshots([
      { id: 'snap1', content: 'Previous headline', timestamp: new Date() }
    ]);
    setLogs([
      { id: 'log1', action: 'Approved rewrite', by: 'User', timestamp: new Date() }
    ]);
    setLocked(false);
  }, []);

  return (
    <div className="max-w-4xl mx-auto py-8">
      <h1 className="text-3xl font-bold mb-6">Change Control Panel</h1>
      <div className="mb-6">
        <label className="flex items-center space-x-2">
          <input type="checkbox" checked={locked} onChange={() => setLocked(!locked)} />
          <span>Lock this content from AI automation</span>
        </label>
      </div>
      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-2">Suggested Rewrites</h2>
        <ul className="space-y-2">
          {suggestions.map(s => (
            <li key={s.id} className="bg-white rounded shadow p-3 flex justify-between items-center">
              <span>{s.content}</span>
              <span className="text-xs text-gray-500">{s.status}</span>
            </li>
          ))}
        </ul>
      </section>
      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-2">Previous Content Snapshots</h2>
        <ul className="space-y-2">
          {snapshots.map(s => (
            <li key={s.id} className="bg-gray-50 rounded p-3">
              <div>{s.content}</div>
              <div className="text-xs text-gray-400">{s.timestamp.toLocaleString()}</div>
            </li>
          ))}
        </ul>
      </section>
      <section>
        <h2 className="text-xl font-semibold mb-2">Approval History</h2>
        <ul className="space-y-2">
          {logs.map(l => (
            <li key={l.id} className="bg-gray-100 rounded p-3 flex justify-between">
              <span>{l.action} by {l.by}</span>
              <span className="text-xs text-gray-400">{l.timestamp.toLocaleString()}</span>
            </li>
          ))}
        </ul>
      </section>
      {/* TODO: Aunt Mel explains change history in simple terms */}
    </div>
  );
} 