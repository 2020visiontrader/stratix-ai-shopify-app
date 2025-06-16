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
        const guidelines = await prisma.brandGuidelines.findUnique({
          where: { shopId },
        });
        return res.status(200).json(guidelines || {});
      } catch (error) {
        console.error('Error fetching brand guidelines:', error);
        return res.status(500).json({ error: 'Failed to fetch brand guidelines' });
      }

    case 'POST':
      try {
        const guidelines = await prisma.brandGuidelines.upsert({
          where: { shopId },
          update: req.body,
          create: {
            ...req.body,
            shopId,
          },
        });
        return res.status(201).json(guidelines);
      } catch (error) {
        console.error('Error creating brand guidelines:', error);
        return res.status(500).json({ error: 'Failed to create brand guidelines' });
      }

    case 'PUT':
      try {
        const guidelines = await prisma.brandGuidelines.update({
          where: { shopId },
          data: req.body,
        });
        return res.status(200).json(guidelines);
      } catch (error) {
        console.error('Error updating brand guidelines:', error);
        return res.status(500).json({ error: 'Failed to update brand guidelines' });
      }

    default:
      res.setHeader('Allow', ['GET', 'POST', 'PUT']);
      return res.status(405).json({ error: `Method ${req.method} Not Allowed` });
  }
} 