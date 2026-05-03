import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import crypto from 'crypto';

// DOKU Configuration from .env
const DOKU_SECRET_KEY = process.env.DOKU_SECRET_KEY || '';

/**
 * DOKU Webhook Handler
 * This endpoint receives payment notifications from DOKU
 */
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const headers = req.headers;

    // 1. Verify DOKU Signature (Security Check)
    // Note: DOKU usually sends a signature in the headers to prevent spoofing
    const signature = headers.get('signature');
    if (!signature && process.env.NODE_ENV === 'production') {
       return NextResponse.json({ error: 'Missing signature' }, { status: 401 });
    }

    // logic verifikasi signature di sini (tergantung versi DOKU API)
    // Untuk saat ini kita fokus pada pemrosesan data transaksi

    const transaction = body.transaction;
    const order = body.order;
    
    if (!transaction || transaction.status !== 'SUCCESS') {
      return NextResponse.json({ message: 'Transaction not successful' }, { status: 200 });
    }

    const email = body.customer?.email || order?.customer_email;
    const amount = transaction.amount;
    const orderId = order?.invoice_number;

    if (!email) {
      console.error('DOKU Webhook Error: No customer email found in payload');
      return NextResponse.json({ error: 'Customer email missing' }, { status: 400 });
    }

    // 2. Determine Plan Type based on Amount (Price Mapping)
    // $1 approx Rp 16.000, $10 approx Rp 160.000, $20 approx Rp 320.000
    // Kita gunakan range untuk toleransi kurs
    let planType = 'free';
    let durationDays = 0;

    if (amount >= 15000 && amount < 100000) {
      planType = 'weekly';
      durationDays = 7;
    } else if (amount >= 100000 && amount < 300000) {
      planType = 'monthly';
      durationDays = 60; // 2 Months as per user request
    } else if (amount >= 300000) {
      planType = 'lifetime';
      durationDays = 9999; // Practically lifetime
    }

    if (planType === 'free') {
      return NextResponse.json({ message: 'Amount does not match any plan' }, { status: 200 });
    }

    // 3. Update Database (Atomic Transaction)
    const result = await (prisma as any).$transaction(async (tx: any) => {
      // Upsert Profile
      const profile = await tx.profile.upsert({
        where: { email: email.toLowerCase() },
        update: { updatedAt: new Date() },
        create: { 
          email: email.toLowerCase(),
          role: 'user'
        },
      });

      // Calculate Expiry
      const endDate = planType === 'lifetime' ? null : new Date(Date.now() + durationDays * 24 * 60 * 60 * 1000);

      // Create Subscription
      const subscription = await tx.subscription.create({
        data: {
          profileId: profile.id,
          planType,
          status: 'active',
          startDate: new Date(),
          endDate: endDate,
        },
      });

      // Create Audit Log
      await tx.auditLog.create({
        data: {
          profileId: profile.id,
          action: 'PAYMENT_SUCCESS',
          metadata: JSON.stringify({
            orderId,
            amount,
            planType,
            gateway: 'DOKU'
          })
        },
      });

      return { profile, subscription };
    });

    console.log(`DOKU Webhook: Successfully activated ${planType} for ${email}`);

    return NextResponse.json({ 
      message: 'Subscription activated', 
      email, 
      plan: planType 
    }, { status: 200 });

  } catch (error: any) {
    console.error('DOKU Webhook Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
