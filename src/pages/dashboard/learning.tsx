import { useEffect, useState } from 'react';

interface LearningItem {
  title: string;
  description: string;
  timestamp: Date;
}

const fetchLearnings = async (): Promise<LearningItem[]> => {
  // TODO: Aggregate from variant logs, prompt changes, framework log
  return [
    {
      title: 'Shorter CTAs worked better',
      description: 'CTAs under 5 words had 12% higher CTR last week.',
      timestamp: new Date()
    },
    {
      title: 'Hero product swapped',
      description: 'Your hero product was swapped due to poor CTR.',
      timestamp: new Date()
    },
    {
      title: 'Scheduled: Rewrite 5 product pages',
      description: 'Will rewrite 5 product pages Monday.',
      timestamp: new Date()
    }
  ];
};

export default function LearningDashboard() {
  const [learnings, setLearnings] = useState<LearningItem[]>([]);

  useEffect(() => {
    fetchLearnings().then(setLearnings);
  }, []);

  return (
    <div className="max-w-3xl mx-auto py-8">
      <h1 className="text-3xl font-bold mb-6">What Stratix AI is Learning</h1>
      <ul className="space-y-4">
        {learnings.map((item, idx) => (
          <li key={idx} className="bg-white rounded shadow p-4">
            <div className="font-semibold text-lg">{item.title}</div>
            <div className="text-gray-600">{item.description}</div>
            <div className="text-xs text-gray-400 mt-2">
              {item.timestamp.toLocaleString()}
            </div>
          </li>
        ))}
      </ul>
      {/* TODO: Add sections for strategy shifts and upcoming changes */}
    </div>
  );
} 