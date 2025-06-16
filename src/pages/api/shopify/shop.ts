import { prisma } from '@/lib/prisma';
import { getSession } from '@shopify/shopify-api';
import { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const session = await getSession(req, res);
  if (!session) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  if (req.method !== 'GET') {
    res.setHeader('Allow', ['GET']);
    return res.status(405).json({ error: `Method ${req.method} Not Allowed` });
  }

  try {
    const shop = await prisma.shop.findUnique({
      where: { id: session.shop },
      select: {
        name: true,
        domain: true,
        plan: true,
        settings: true,
      },
    });

    if (!shop) {
      return res.status(404).json({ error: 'Shop not found' });
    }

    return res.status(200).json(shop);
  } catch (error) {
    console.error('Error fetching shop data:', error);
    return res.status(500).json({ error: 'Failed to fetch shop data' });
  }
} 