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

  const { content } = req.body;
  const shopId = session.shop;

  try {
    const guidelines = await prisma.brandGuidelines.findUnique({
      where: { shopId },
    });

    if (!guidelines) {
      return res.status(404).json({ error: 'Brand guidelines not found' });
    }

    const analysis = await analyzeBrandConsistency(content, guidelines);
    return res.status(200).json(analysis);
  } catch (error) {
    console.error('Error analyzing brand consistency:', error);
    return res.status(500).json({ error: 'Failed to analyze brand consistency' });
  }
}

async function analyzeBrandConsistency(
  content: string | Record<string, any>[],
  guidelines: any
): Promise<{
  score: number;
  issues: {
    type: string;
    description: string;
    severity: 'high' | 'medium' | 'low';
    recommendation: string;
  }[];
}> {
  const issues = [];
  let score = 100;

  if (Array.isArray(content)) {
    // Analyze multiple content pieces
    for (const item of content) {
      const itemAnalysis = await analyzeContentItem(item, guidelines);
      issues.push(...itemAnalysis.issues);
      score = Math.min(score, itemAnalysis.score);
    }
  } else {
    // Analyze single content piece
    const analysis = await analyzeContentItem(content, guidelines);
    issues.push(...analysis.issues);
    score = analysis.score;
  }

  return {
    score,
    issues,
  };
}

async function analyzeContentItem(
  content: string | Record<string, any>,
  guidelines: any
): Promise<{
  score: number;
  issues: {
    type: string;
    description: string;
    severity: 'high' | 'medium' | 'low';
    recommendation: string;
  }[];
}> {
  const issues = [];
  let score = 100;

  // Check voice consistency
  if (typeof content === 'string') {
    const voiceIssues = checkVoiceConsistency(content, guidelines.voice);
    issues.push(...voiceIssues);
    score -= voiceIssues.length * 5;
  }

  // Check visual consistency
  if (typeof content === 'object') {
    const visualIssues = checkVisualConsistency(content, guidelines.visuals);
    issues.push(...visualIssues);
    score -= visualIssues.length * 5;
  }

  // Check value alignment
  const valueIssues = checkValueAlignment(content, guidelines.values);
  issues.push(...valueIssues);
  score -= valueIssues.length * 5;

  return {
    score: Math.max(0, score),
    issues,
  };
}

function checkVoiceConsistency(
  content: string,
  voice: any
): {
  type: string;
  description: string;
  severity: 'high' | 'medium' | 'low';
  recommendation: string;
}[] {
  const issues = [];

  // Check forbidden words
  const words = content.toLowerCase().split(/\s+/);
  for (const word of words) {
    if (voice.doNotUse.includes(word)) {
      issues.push({
        type: 'forbidden_word',
        description: `Found forbidden word: ${word}`,
        severity: 'high',
        recommendation: 'Replace with brand-appropriate alternative',
      });
    }
  }

  // Check tone
  const tone = analyzeTone(content);
  if (!voice.tone.includes(tone)) {
    issues.push({
      type: 'tone_mismatch',
      description: `Content tone (${tone}) doesn't match brand voice`,
      severity: 'medium',
      recommendation: 'Adjust tone to match brand guidelines',
    });
  }

  return issues;
}

function checkVisualConsistency(
  content: Record<string, any>,
  visuals: any
): {
  type: string;
  description: string;
  severity: 'high' | 'medium' | 'low';
  recommendation: string;
}[] {
  const issues = [];

  // Check colors
  if (content.colors) {
    const invalidColors = content.colors.filter(
      (color: string) => !visuals.colors.primary.includes(color)
    );
    if (invalidColors.length > 0) {
      issues.push({
        type: 'invalid_colors',
        description: `Found invalid colors: ${invalidColors.join(', ')}`,
        severity: 'medium',
        recommendation: 'Use brand-approved colors',
      });
    }
  }

  // Check typography
  if (content.typography) {
    const invalidFonts = content.typography.filter(
      (font: string) => !visuals.typography.body.includes(font)
    );
    if (invalidFonts.length > 0) {
      issues.push({
        type: 'invalid_typography',
        description: `Found invalid fonts: ${invalidFonts.join(', ')}`,
        severity: 'medium',
        recommendation: 'Use brand-approved typography',
      });
    }
  }

  return issues;
}

function checkValueAlignment(
  content: string | Record<string, any>,
  values: string[]
): {
  type: string;
  description: string;
  severity: 'high' | 'medium' | 'low';
  recommendation: string;
}[] {
  const issues = [];

  // Check if content aligns with brand values
  // This is a placeholder implementation
  if (typeof content === 'string') {
    const contentValues = extractValues(content);
    const missingValues = values.filter(value => !contentValues.includes(value));
    if (missingValues.length > 0) {
      issues.push({
        type: 'missing_values',
        description: `Content doesn't reflect brand values: ${missingValues.join(', ')}`,
        severity: 'high',
        recommendation: 'Incorporate missing brand values in content',
      });
    }
  }

  return issues;
}

function analyzeTone(content: string): string {
  // Implement tone analysis logic
  // This is a placeholder implementation
  return 'professional';
}

function extractValues(content: string): string[] {
  // Implement value extraction logic
  // This is a placeholder implementation
  return [];
} 