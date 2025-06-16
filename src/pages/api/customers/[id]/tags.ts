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
    case 'POST':
      try {
        const { tag } = req.body;
        const customer = await prisma.customer.update({
          where: { id: String(id), shopId },
          data: {
            tags: {
              push: tag,
            },
          },
        });
        return res.status(200).json(customer);
      } catch (error) {
        console.error('Error adding customer tag:', error);
        return res.status(500).json({ error: 'Failed to add customer tag' });
      }

    case 'DELETE':
      try {
        const { tag } = req.query;
        const customer = await prisma.customer.findUnique({
          where: { id: String(id), shopId },
        });

        if (!customer) {
          return res.status(404).json({ error: 'Customer not found' });
        }

        const updatedTags = customer.tags.filter(t => t !== tag);
        const updatedCustomer = await prisma.customer.update({
          where: { id: String(id), shopId },
          data: {
            tags: updatedTags,
          },
        });

        return res.status(200).json(updatedCustomer);
      } catch (error) {
        console.error('Error removing customer tag:', error);
        return res.status(500).json({ error: 'Failed to remove customer tag' });
      }

    default:
      res.setHeader('Allow', ['POST', 'DELETE']);
      return res.status(405).json({ error: `Method ${req.method} Not Allowed` });
  }
} 