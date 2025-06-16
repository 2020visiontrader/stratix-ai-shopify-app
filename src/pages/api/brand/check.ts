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

  const { content, type } = req.body;
  const shopId = session.shop;

  try {
    const guidelines = await prisma.brandGuidelines.findUnique({
      where: { shopId },
    });

    if (!guidelines) {
      return res.status(404).json({ error: 'Brand guidelines not found' });
    }

    // Perform brand compliance check based on type
    const check = await performBrandCheck(content, type, guidelines);

    // Save the check result
    const savedCheck = await prisma.brandCheck.create({
      data: {
        ...check,
        shopId,
      },
    });

    return res.status(200).json(savedCheck);
  } catch (error) {
    console.error('Error performing brand check:', error);
    return res.status(500).json({ error: 'Failed to perform brand check' });
  }
}

async function performBrandCheck(
  content: string | Record<string, any>,
  type: 'content' | 'design' | 'voice' | 'compliance',
  guidelines: any
): Promise<{
  type: 'content' | 'design' | 'voice' | 'compliance';
  status: 'pass' | 'fail' | 'warning';
  score: number;
  details: {
    category: string;
    findings: {
      type: string;
      description: string;
      severity: 'high' | 'medium' | 'low';
      recommendation: string;
    }[];
  };
}> {
  // Implement brand check logic based on type and guidelines
  // This is a placeholder implementation
  const findings = [];
  let score = 100;

  switch (type) {
    case 'content':
      // Check content against brand voice guidelines
      if (typeof content === 'string') {
        const words = content.toLowerCase().split(/\s+/);
        for (const word of words) {
          if (guidelines.voice.doNotUse.includes(word)) {
            findings.push({
              type: 'forbidden_word',
              description: `Found forbidden word: ${word}`,
              severity: 'high',
              recommendation: 'Replace with brand-appropriate alternative',
            });
            score -= 10;
          }
        }
      }
      break;

    case 'design':
      // Check design against brand visual guidelines
      if (typeof content === 'object') {
        if (content.colors) {
          const invalidColors = content.colors.filter(
            (color: string) => !guidelines.visuals.colors.primary.includes(color)
          );
          if (invalidColors.length > 0) {
            findings.push({
              type: 'invalid_colors',
              description: `Found invalid colors: ${invalidColors.join(', ')}`,
              severity: 'medium',
              recommendation: 'Use brand-approved colors',
            });
            score -= 5;
          }
        }
      }
      break;

    case 'voice':
      // Check tone and personality
      if (typeof content === 'string') {
        const tone = analyzeTone(content);
        if (!guidelines.voice.tone.includes(tone)) {
          findings.push({
            type: 'tone_mismatch',
            description: `Content tone (${tone}) doesn't match brand voice`,
            severity: 'medium',
            recommendation: 'Adjust tone to match brand guidelines',
          });
          score -= 8;
        }
      }
      break;

    case 'compliance':
      // Check general brand compliance
      if (typeof content === 'object') {
        const compliance = checkCompliance(content, guidelines);
        findings.push(...compliance.findings);
        score -= compliance.score;
      }
      break;
  }

  return {
    type,
    status: score >= 80 ? 'pass' : score >= 60 ? 'warning' : 'fail',
    score,
    details: {
      category: type,
      findings,
    },
  };
}

function analyzeTone(content: string): string {
  // Implement tone analysis logic
  // This is a placeholder implementation
  return 'professional';
}

function checkCompliance(content: Record<string, any>, guidelines: any): {
  findings: any[];
  score: number;
} {
  // Implement compliance check logic
  // This is a placeholder implementation
  return {
    findings: [],
    score: 0,
  };
} 