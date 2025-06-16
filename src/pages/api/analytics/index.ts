import { AnalyticsManager } from '@/lib/core/AnalyticsManager';
import { NetworkManager } from '@/lib/core/NetworkManager';
import { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const analyticsManager = AnalyticsManager.getInstance();
  const networkManager = NetworkManager.getInstance();

  try {
    switch (req.method) {
      case 'GET':
        const { type, startDate, endDate } = req.query;
        const analytics = await analyticsManager.getAnalytics({
          type: type as string,
          startDate: startDate as string,
          endDate: endDate as string
        });
        return res.status(200).json(analytics);

      case 'POST':
        const { event, data } = req.body;
        if (!event) {
          return res.status(400).json({ error: 'Event is required' });
        }
        const result = await analyticsManager.trackEvent(event, data);
        return res.status(200).json(result);

      default:
        res.setHeader('Allow', ['GET', 'POST']);
        return res.status(405).end(`Method ${req.method} Not Allowed`);
    }
  } catch (error) {
    console.error('Analytics API Error:', error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
} 