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
          query,
          sortBy = 'createdAt',
          sortOrder = 'desc',
        } = req.query;

        const where = {
          shopId,
          ...(query && {
            OR: [
              { name: { contains: query as string, mode: 'insensitive' } },
              { email: { contains: query as string, mode: 'insensitive' } },
            ],
          }),
        };

        const [customers, total] = await Promise.all([
          prisma.customer.findMany({
            where,
            skip: (Number(page) - 1) * Number(limit),
            take: Number(limit),
            orderBy: { [sortBy as string]: sortOrder },
            include: {
              _count: {
                select: { orders: true },
              },
              orders: {
                select: {
                  total: true,
                  createdAt: true,
                },
                orderBy: { createdAt: 'desc' },
                take: 1,
              },
            },
          }),
          prisma.customer.count({ where }),
        ]);

        const formattedCustomers = customers.map(customer => ({
          ...customer,
          totalOrders: customer._count.orders,
          totalSpent: customer.orders.reduce((sum, order) => sum + order.total, 0),
          lastOrderDate: customer.orders[0]?.createdAt,
        }));

        return res.status(200).json({
          customers: formattedCustomers,
          total,
          hasMore: total > Number(page) * Number(limit),
        });
      } catch (error) {
        console.error('Error fetching customers:', error);
        return res.status(500).json({ error: 'Failed to fetch customers' });
      }

    case 'POST':
      try {
        const customer = await prisma.customer.create({
          data: {
            ...req.body,
            shopId,
          },
        });
        return res.status(201).json(customer);
      } catch (error) {
        console.error('Error creating customer:', error);
        return res.status(500).json({ error: 'Failed to create customer' });
      }

    default:
      res.setHeader('Allow', ['GET', 'POST']);
      return res.status(405).json({ error: `Method ${req.method} Not Allowed` });
  }
} 