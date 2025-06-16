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
        const {
          page = 1,
          limit = 10,
          status,
          paymentStatus,
          fulfillmentStatus,
          sortBy = 'createdAt',
          sortOrder = 'desc',
        } = req.query;

        const where = {
          shopId,
          ...(status && { status: status as string }),
          ...(paymentStatus && { paymentStatus: paymentStatus as string }),
          ...(fulfillmentStatus && { fulfillmentStatus: fulfillmentStatus as string }),
        };

        const [orders, total] = await Promise.all([
          prisma.order.findMany({
            where,
            skip: (Number(page) - 1) * Number(limit),
            take: Number(limit),
            orderBy: { [sortBy as string]: sortOrder },
            include: {
              customer: true,
              items: {
                include: {
                  product: true,
                  variant: true,
                },
              },
            },
          }),
          prisma.order.count({ where }),
        ]);

        return res.status(200).json({
          orders,
          total,
          hasMore: total > Number(page) * Number(limit),
        });
      } catch (error) {
        console.error('Error fetching orders:', error);
        return res.status(500).json({ error: 'Failed to fetch orders' });
      }

    default:
      res.setHeader('Allow', ['GET']);
      return res.status(405).json({ error: `Method ${req.method} Not Allowed` });
  }
} 