import { NextResponse } from 'next/server';
export const runtime = 'edge';
import { v4 as uuidv4 } from 'uuid';

// DOKU Configuration
const DOKU_CLIENT_ID = process.env.DOKU_CLIENT_ID || '';
const DOKU_SECRET_KEY = process.env.DOKU_SECRET_KEY || '';
const DOKU_API_URL = process.env.DOKU_API_URL || 'https://api-sandbox.doku.com';

/**
 * Generate Digest using Web Crypto API (Edge Compatible)
 */
async function generateDigest(body: any) {
    const encoder = new TextEncoder();
    const data = encoder.encode(JSON.stringify(body));
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    return btoa(String.fromCharCode(...new Uint8Array(hashBuffer)));
}

/**
 * Generate DOKU Signature using Web Crypto API (Edge Compatible)
 */
async function generateSignature(clientId: string, requestId: string, requestTimestamp: string, requestTarget: string, digest: string, secret: string) {
    const rawSignature = `Client-Id:${clientId}\n` +
        `Request-Id:${requestId}\n` +
        `Request-Timestamp:${requestTimestamp}\n` +
        `Request-Target:${requestTarget}\n` +
        `Digest:${digest}`;
    
    const encoder = new TextEncoder();
    const keyData = encoder.encode(secret);
    const signatureData = encoder.encode(rawSignature);

    const key = await crypto.subtle.importKey(
        'raw',
        keyData,
        { name: 'HMAC', hash: 'SHA-256' },
        false,
        ['sign']
    );

    const signatureBuffer = await crypto.subtle.sign('HMAC', key, signatureData);
    const signatureBase64 = btoa(String.fromCharCode(...new Uint8Array(signatureBuffer)));
    
    return `HMACSHA256=${signatureBase64}`;
}

export async function POST(req: Request) {
    try {
        const { email, plan, amount } = await req.json();

        if (!email || !plan || !amount) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        const requestId = uuidv4();
        const requestTimestamp = new Date().toISOString().slice(0, 19) + 'Z';
        const requestTarget = '/checkout/v1/payment-invocation';
        const invoiceNumber = `INV-${Date.now()}`;

        // DOKU Checkout Payload
        const body = {
            order: {
                amount: amount,
                invoice_number: invoiceNumber,
                currency: 'IDR',
                callback_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard`,
                line_items: [
                    {
                        name: `PT Indonesian Visas Agency - Smart Convert ${plan}`,
                        price: amount,
                        quantity: 1
                    }
                ]
            },
            customer: {
                name: email.split('@')[0],
                email: email.toLowerCase(),
            }
        };

        const digest = await generateDigest(body);
        const signature = await generateSignature(DOKU_CLIENT_ID, requestId, requestTimestamp, requestTarget, digest, DOKU_SECRET_KEY);

        const baseUrl = DOKU_API_URL.endsWith('/') ? DOKU_API_URL.slice(0, -1) : DOKU_API_URL;
        const fullUrl = `${baseUrl}${requestTarget}`;

        const response = await fetch(fullUrl, {
            method: 'POST',
            headers: {
                'Client-Id': DOKU_CLIENT_ID,
                'Request-Id': requestId,
                'Request-Timestamp': requestTimestamp,
                'Signature': signature,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(body)
        });

        const data = await response.json();

        if (!response.ok) {
            console.error('DOKU Checkout Error:', data);
            return NextResponse.json({ error: 'Failed to create DOKU session', details: data }, { status: response.status });
        }

        return NextResponse.json({ 
            checkout_url: data.response.payment.url,
            order_id: invoiceNumber 
        });

    } catch (error) {
        console.error('Checkout API Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
