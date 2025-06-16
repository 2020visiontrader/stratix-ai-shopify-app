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
          status,
          sortBy = 'createdAt',
          sortOrder = 'desc',
        } = req.query;

        const where = {
          shopId,
          ...(query && {
            OR: [
              { title: { contains: query as string, mode: 'insensitive' } },
              { description: { contains: query as string, mode: 'insensitive' } },
            ],
          }),
          ...(status && { status: status as string }),
        };

        const [products, total] = await Promise.all([
          prisma.product.findMany({
            where,
            skip: (Number(page) - 1) * Number(limit),
            take: Number(limit),
            orderBy: { [sortBy as string]: sortOrder },
            include: {
              variants: true,
              images: true,
            },
          }),
          prisma.product.count({ where }),
        ]);

        return res.status(200).json({
          products,
          total,
          hasMore: total > Number(page) * Number(limit),
        });
      } catch (error) {
        console.error('Error fetching products:', error);
        return res.status(500).json({ error: 'Failed to fetch products' });
      }

    case 'POST':
      try {
        const { variants, images, ...productData } = req.body;
        const product = await prisma.product.create({
          data: {
            ...productData,
            shopId,
            variants: {
              create: variants,
            },
            images: {
              create: images,
            },
          },
          include: {
            variants: true,
            images: true,
          },
        });
        return res.status(201).json(product);
      } catch (error) {
        console.error('Error creating product:', error);
        return res.status(500).json({ error: 'Failed to create product' });
      }

    case 'PATCH':
      if (req.url?.endsWith('/bulk')) {
        try {
          const { updates } = req.body;
          const updatedProducts = await Promise.all(
            updates.map(async ({ id, updates: productUpdates }) => {
              const { variants, images, ...productData } = productUpdates;
              return prisma.product.update({
                where: { id, shopId },
                data: {
                  ...productData,
                  variants: {
                    updateMany: {
                      where: { productId: id },
                      data: variants,
                    },
                  },
                  images: {
                    updateMany: {
                      where: { productId: id },
                      data: images,
                    },
                  },
                },
                include: {
                  variants: true,
                  images: true,
                },
              });
            })
          );
          return res.status(200).json(updatedProducts);
        } catch (error) {
          console.error('Error bulk updating products:', error);
          return res.status(500).json({ error: 'Failed to bulk update products' });
        }
      }
      return res.status(404).json({ error: 'Not Found' });

    default:
      res.setHeader('Allow', ['GET', 'POST', 'PATCH']);
      return res.status(405).json({ error: `Method ${req.method} Not Allowed` });
  }
} 