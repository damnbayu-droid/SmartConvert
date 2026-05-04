import { NextResponse } from 'next/server';
export const runtime = 'edge';
import { db } from '@/lib/db';

// DOKU Configuration from .env
const DOKU_SECRET_KEY = process.env.DOKU_SECRET_KEY || '';

/**
 * DOKU Webhook Handler
 */
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const headers = req.headers;

    // 1. Basic Security Check
    const signature = headers.get('signature');
    if (!signature && process.env.NODE_ENV === 'production') {
       return NextResponse.json({ error: 'Missing signature' }, { status: 401 });
    }

    const transaction = body.transaction;
    const order = body.order;
    
    if (!transaction || transaction.status !== 'SUCCESS') {
      return NextResponse.json({ message: 'Transaction not successful' }, { status: 200 });
    }

    const email = (body.customer?.email || order?.customer_email || '').toLowerCase();
    const amount = transaction.amount;
    const orderId = order?.invoice_number;

    if (!email) {
      console.error('DOKU Webhook Error: No customer email found');
      return NextResponse.json({ error: 'Customer email missing' }, { status: 400 });
    }

    // 2. Determine Plan Type
    let planType = 'free';
    let durationDays = 0;

    if (amount >= 15000 && amount < 100000) {
      planType = 'weekly';
      durationDays = 7;
    } else if (amount >= 100000 && amount < 300000) {
      planType = 'monthly';
      durationDays = 60;
    } else if (amount >= 300000) {
      planType = 'lifetime';
      durationDays = 9999;
    }

    if (planType === 'free') {
      return NextResponse.json({ message: 'Amount does not match any plan' }, { status: 200 });
    }

    // 3. Update Database via Supabase (Edge-Safe)
    // A. Upsert Profile
    const { data: profile, error: profileError } = await db
      .from('Profile')
      .upsert({ email }, { onConflict: 'email' })
      .select()
      .single();

    if (profileError || !profile) throw new Error(`Profile Error: ${profileError?.message}`);

    // B. Create Subscription
    const endDate = planType === 'lifetime' ? null : new Date(Date.now() + durationDays * 24 * 60 * 60 * 1000).toISOString();
    
    const { error: subError } = await db
      .from('Subscription')
      .insert({
        profileId: profile.id,
        planType,
        status: 'active',
        startDate: new Date().toISOString(),
        endDate: endDate,
      });

    if (subError) throw new Error(`Subscription Error: ${subError.message}`);

    // C. Create Audit Log
    await db.from('AuditLog').insert({
      profileId: profile.id,
      action: 'PAYMENT_SUCCESS',
      metadata: JSON.stringify({ orderId, amount, planType, gateway: 'DOKU' })
    });

    console.log(`DOKU Webhook SUCCESS: ${planType} for ${email}`);

    return NextResponse.json({ 
      message: 'Subscription activated', 
      email, 
      plan: planType 
    }, { status: 200 });

  } catch (error: any) {
    console.error('DOKU Webhook Error:', error.message);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
