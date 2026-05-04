import { NextResponse } from 'next/server';
export const runtime = 'edge';
import { db } from '@/lib/db';

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

    // 2. Look for the profile and active subscription in Supabase
    // We fetch the profile and join with active subscriptions
    const { data: profile, error: profileError } = await db
      .from('Profile')
      .select(`
        id,
        role,
        Subscription:Subscription (
          planType,
          endDate,
          status
        )
      `)
      .eq('email', email.toLowerCase())
      .eq('Subscription.status', 'active')
      .single();

    if (profileError || !profile) {
      return NextResponse.json({ 
        status: 'free',
        message: 'No active subscription found for this email.' 
      }, { status: 403 });
    }

    // Filter active subscriptions by date
    const activeSub = profile.Subscription.find((sub: any) => {
      if (!sub.endDate) return true; // Lifetime
      return new Date(sub.endDate) >= new Date();
    });

    if (!activeSub) {
      return NextResponse.json({ 
        status: 'free',
        message: 'Subscription has expired.' 
      }, { status: 403 });
    }

    return NextResponse.json({
      status: 'pro',
      plan: activeSub.planType,
      role: profile.role,
      expiry: activeSub.endDate
    });

  } catch (error) {
    console.error('Auth Check Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
