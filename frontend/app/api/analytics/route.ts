import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  // Get session cookie
  const sessionCookie = cookies().get('session');
  
  // If no valid session, return 401
  if (!sessionCookie?.value) {
    return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
  }
  
  // Mock analytics data
  const analyticsData = {
    revenue: {
      total: 4850,
      change: 12.5,
      trend: 'up'
    },
    orders: {
      total: 156,
      change: 8.2,
      trend: 'up'
    },
    conversion: {
      rate: 3.2,
      change: 0.5,
      trend: 'up'
    },
    aov: {
      amount: 31.09,
      change: 4.3,
      trend: 'up'
    },
    traffic: {
      visitors: 4870,
      change: 15.3,
      trend: 'up'
    },
    topProducts: [
      { id: 1, name: 'Product A', sales: 42, revenue: 1260 },
      { id: 2, name: 'Product B', sales: 38, revenue: 950 },
      { id: 3, name: 'Product C', sales: 29, revenue: 725 },
      { id: 4, name: 'Product D', sales: 21, revenue: 630 }
    ],
    recentOrders: [
      { id: 'ORD-1234', customer: 'John D.', total: 85.99, items: 3, date: '2023-06-18T14:22:10Z' },
      { id: 'ORD-1233', customer: 'Sarah M.', total: 49.99, items: 1, date: '2023-06-18T12:15:43Z' },
      { id: 'ORD-1232', customer: 'Robert P.', total: 137.45, items: 4, date: '2023-06-18T09:30:22Z' }
    ]
  };
  
  return NextResponse.json(analyticsData);
}
