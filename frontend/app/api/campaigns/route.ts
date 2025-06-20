import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '../../../lib/auth-middleware';

export async function GET(request: NextRequest) {
  try {
    // Check authentication
    const user = await requireAuth(request);
    if (!user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    // Return mock campaigns data
    const mockCampaigns = [
      {
        id: '1',
        name: 'Welcome Series - New Customers',
        type: 'welcome',
        status: 'active',
        segmentIds: ['seg-123', 'seg-456'],
        analytics: {
          emailsSent: 1250,
          openRate: 28.5,
          clickRate: 12.3,
          conversionRate: 4.2,
          revenue: 15680.50
        },
        createdAt: '2024-01-15T10:00:00Z',
        updatedAt: '2024-01-20T14:30:00Z'
      },
      {
        id: '2',
        name: 'Abandoned Cart Recovery',
        type: 'automation',
        status: 'active',
        segmentIds: ['seg-789'],
        analytics: {
          emailsSent: 890,
          openRate: 35.2,
          clickRate: 18.7,
          conversionRate: 8.9,
          revenue: 24350.25
        },
        createdAt: '2024-01-10T09:00:00Z',
        updatedAt: '2024-01-18T16:45:00Z'
      },
      {
        id: '3', 
        name: 'VIP Customer Appreciation',
        type: 'promotional',
        status: 'paused',
        segmentIds: ['seg-101'],
        analytics: {
          emailsSent: 450,
          openRate: 42.1,
          clickRate: 25.6,
          conversionRate: 12.4,
          revenue: 18920.75
        },
        createdAt: '2024-01-05T11:30:00Z',
        updatedAt: '2024-01-15T13:20:00Z'
      }
    ];

    return NextResponse.json({ 
      success: true, 
      data: mockCampaigns,
      user: user.email 
    });
  } catch (error) {
    console.error('Error fetching campaigns:', error);
    return NextResponse.json({ 
      error: 'Failed to fetch campaigns' 
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const user = await requireAuth(request);
    if (!user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const body = await request.json();
    
    // In development, return a mock successful response
    return NextResponse.json(
      { 
        success: true,
        data: {
          id: 'campaign-' + Date.now(),
          ...body,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        },
        message: 'Campaign created successfully'
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error creating campaign:', error);
    return NextResponse.json({ 
      error: 'Failed to create campaign' 
    }, { status: 500 });
  }
}
