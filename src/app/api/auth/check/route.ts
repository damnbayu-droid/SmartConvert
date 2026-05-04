import { NextResponse } from 'next/server';
export const runtime = 'edge';
import { prisma } from '@/lib/prisma';

export async function POST(req: Request) {
  try {
    const { email } = await req.json();

    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    // 1. Check if it's the Admin
    if (email === 'damnbayu@gmail.com') {
      return NextResponse.json({ 
        status: 'pro', 
        plan: 'lifetime',
        role: 'admin' 
      });
    }

    // 2. Look for the profile and active subscription in the database
    const profile = await (prisma as any).profile.findUnique({
      where: { email: email.toLowerCase() },
      include: {
        subscriptions: {
          where: {
            status: 'active',
            OR: [
              { endDate: { gte: new Date() } },
              { endDate: null } // Lifetime has no end date
            ]
          },
          orderBy: { createdAt: 'desc' },
          take: 1
        }
      }
    });

    if (!profile || profile.subscriptions.length === 0) {
      return NextResponse.json({ 
        status: 'free',
        message: 'No active subscription found for this email.' 
      }, { status: 403 });
    }

    const sub = profile.subscriptions[0];

    return NextResponse.json({
      status: 'pro',
      plan: sub.planType,
      role: profile.role,
      expiry: sub.endDate
    });

  } catch (error) {
    console.error('Auth Check Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
