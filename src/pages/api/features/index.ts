import { FeatureManager } from '@/lib/core/FeatureManager';
import { NetworkManager } from '@/lib/core/NetworkManager';
import { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const featureManager = FeatureManager.getInstance();
  const networkManager = NetworkManager.getInstance();

  try {
    switch (req.method) {
      case 'GET':
        const features = await featureManager.getAllFeatures();
        return res.status(200).json(features);

      case 'POST':
        const { featureId, enabled } = req.body;
        if (!featureId) {
          return res.status(400).json({ error: 'Feature ID is required' });
        }
        const result = await featureManager.toggleFeature(featureId, enabled);
        return res.status(200).json(result);

      default:
        res.setHeader('Allow', ['GET', 'POST']);
        return res.status(405).end(`Method ${req.method} Not Allowed`);
    }
  } catch (error) {
    console.error('Feature API Error:', error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
} 