import { NetworkManager } from '@/lib/core/NetworkManager';
import { StoreManager } from '@/lib/core/StoreManager';
import { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const storeManager = StoreManager.getInstance();
  const networkManager = NetworkManager.getInstance();

  try {
    switch (req.method) {
      case 'GET':
        const { type } = req.query;
        const storeData = await storeManager.getStoreData(type as string);
        return res.status(200).json(storeData);

      case 'POST':
        const { action, data } = req.body;
        if (!action) {
          return res.status(400).json({ error: 'Action is required' });
        }
        const result = await storeManager.performAction(action, data);
        return res.status(200).json(result);

      default:
        res.setHeader('Allow', ['GET', 'POST']);
        return res.status(405).end(`Method ${req.method} Not Allowed`);
    }
  } catch (error) {
    console.error('Store API Error:', error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
} 