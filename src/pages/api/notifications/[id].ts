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

  const { id } = req.query;
  const shopId = session.shop;

  switch (req.method) {
    case 'PATCH':
      try {
        const notification = await prisma.notification.update({
          where: { id: String(id), shopId },
          data: { read: true },
        });
        return res.status(200).json(notification);
      } catch (error) {
        console.error('Error marking notification as read:', error);
        return res.status(500).json({ error: 'Failed to mark notification as read' });
      }

    case 'DELETE':
      try {
        await prisma.notification.delete({
          where: { id: String(id), shopId },
        });
        return res.status(204).end();
      } catch (error) {
        console.error('Error deleting notification:', error);
        return res.status(500).json({ error: 'Failed to delete notification' });
      }

    default:
      res.setHeader('Allow', ['PATCH', 'DELETE']);
      return res.status(405).json({ error: `Method ${req.method} Not Allowed` });
  }
} 