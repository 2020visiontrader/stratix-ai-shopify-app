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

  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).json({ error: `Method ${req.method} Not Allowed` });
  }

  try {
    const { category, action, label, value, metadata } = req.body;
    const shopId = session.shop;

    const event = await prisma.analyticsEvent.create({
      data: {
        shopId,
        category,
        action,
        label,
        value,
        metadata,
        timestamp: new Date(),
      },
    });

    return res.status(201).json(event);
  } catch (error) {
    console.error('Error tracking analytics event:', error);
    return res.status(500).json({ error: 'Failed to track analytics event' });
  }
} 