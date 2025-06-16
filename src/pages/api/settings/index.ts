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

  const shopId = session.shop;

  switch (req.method) {
    case 'GET':
      try {
        const settings = await prisma.settings.findUnique({
          where: { shopId },
        });
        return res.status(200).json(settings || {});
      } catch (error) {
        console.error('Error fetching settings:', error);
        return res.status(500).json({ error: 'Failed to fetch settings' });
      }

    case 'PATCH':
      try {
        const settings = await prisma.settings.upsert({
          where: { shopId },
          update: req.body,
          create: {
            shopId,
            ...req.body,
          },
        });
        return res.status(200).json(settings);
      } catch (error) {
        console.error('Error updating settings:', error);
        return res.status(500).json({ error: 'Failed to update settings' });
      }

    case 'POST':
      if (req.url?.endsWith('/reset')) {
        try {
          const defaultSettings = {
            theme: 'light',
            notifications: true,
            analytics: true,
            performance: {
              samplingRate: 0.1,
              thresholds: {
                responseTime: 1000,
                errorRate: 0.01,
              },
            },
          };

          const settings = await prisma.settings.upsert({
            where: { shopId },
            update: defaultSettings,
            create: {
              shopId,
              ...defaultSettings,
            },
          });
          return res.status(200).json(settings);
        } catch (error) {
          console.error('Error resetting settings:', error);
          return res.status(500).json({ error: 'Failed to reset settings' });
        }
      }
      return res.status(404).json({ error: 'Not Found' });

    default:
      res.setHeader('Allow', ['GET', 'PATCH', 'POST']);
      return res.status(405).json({ error: `Method ${req.method} Not Allowed` });
  }
} 