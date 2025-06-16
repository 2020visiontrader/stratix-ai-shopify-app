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
        const notifications = await prisma.notification.findMany({
          where: { shopId },
          orderBy: { timestamp: 'desc' },
        });
        return res.status(200).json(notifications);
      } catch (error) {
        console.error('Error fetching notifications:', error);
        return res.status(500).json({ error: 'Failed to fetch notifications' });
      }

    case 'PATCH':
      try {
        await prisma.notification.updateMany({
          where: { shopId, read: false },
          data: { read: true },
        });
        return res.status(200).json({ message: 'All notifications marked as read' });
      } catch (error) {
        console.error('Error marking notifications as read:', error);
        return res.status(500).json({ error: 'Failed to mark notifications as read' });
      }

    default:
      res.setHeader('Allow', ['GET', 'PATCH']);
      return res.status(405).json({ error: `Method ${req.method} Not Allowed` });
  }
} 