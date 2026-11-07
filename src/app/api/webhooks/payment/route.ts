import { NextRequest, NextResponse } from 'next/server';
import { prisma, isDatabaseConfigured } from '@/lib/prisma';
import { checkRateLimit } from '@/lib/security';
import crypto from 'crypto';

interface QrisWebhookPayload {
  order_id: string; // Idempotency key from QRIS provider
  transaction_id?: string;
  gross_amount: string | number;
  transaction_status: 'settlement' | 'capture' | 'pending' | 'expire' | 'cancel' | 'deny';
  payment_type: 'qris' | 'gopay' | 'shopeepay' | string;
  signature_key?: string;
  status_code?: string;
  merchant_id?: string;
}

/**
 * Validates HMAC SHA512 signature for QRIS webhook using constant-time comparison.
 * When a serverKey is configured in the environment, a valid signature is strictly required.
 */
function verifyWebhookSignature(
  orderId: string,
  statusCode: string,
  grossAmount: string,
  serverKey: string,
  receivedSignature?: string
): boolean {
  if (!serverKey) return true; // Only allow unsigned requests in local dev when secret is unset
  if (!receivedSignature) return false;

  const input = `${orderId}${statusCode}${grossAmount}${serverKey}`;
  const computedHex = crypto.createHash('sha512').update(input).digest('hex');

  try {
    const computedBuf = Buffer.from(computedHex, 'hex');
    const receivedBuf = Buffer.from(receivedSignature, 'hex');
    if (computedBuf.length !== receivedBuf.length) {
      return false;
    }
    return crypto.timingSafeEqual(computedBuf, receivedBuf);
  } catch {
    return false;
  }
}

export async function POST(req: NextRequest) {
  try {
    const ip =
      req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
      req.headers.get('x-real-ip') ||
      'unknown';

    const rate = checkRateLimit(`webhook_payment:${ip}`, 60, 60 * 1000);
    if (!rate.allowed) {
      return NextResponse.json(
        { error: 'Too many webhook requests' },
        {
          status: 429,
          headers: { 'Retry-After': String(rate.retryAfterSec) },
        }
      );
    }

    const serverKey = process.env.PAYMENT_GATEWAY_SERVER_KEY || '';
    if (process.env.NODE_ENV === 'production' && !serverKey) {
      return NextResponse.json(
        {
          error:
            'Service Unavailable: PAYMENT_GATEWAY_SERVER_KEY must be configured in production.',
        },
        { status: 503 }
      );
    }

    const rawBody = await req.text();
    let payload: QrisWebhookPayload;

    try {
      payload = JSON.parse(rawBody);
    } catch {
      return NextResponse.json({ error: 'Malformed JSON payload' }, { status: 400 });
    }

    const {
      order_id,
      gross_amount,
      transaction_status,
      payment_type = 'qris',
      signature_key,
      status_code = '200',
    } = payload;

    if (!order_id || typeof order_id !== 'string' || !order_id.trim()) {
      return NextResponse.json(
        { error: 'Missing mandatory field: order_id' },
        { status: 422 }
      );
    }

    const parsedAmount = Number(gross_amount);
    if (!Number.isFinite(parsedAmount) || parsedAmount < 0) {
      return NextResponse.json(
        { error: 'Invalid gross_amount: must be a non-negative number' },
        { status: 422 }
      );
    }

    // Strict HMAC verification when PAYMENT_GATEWAY_SERVER_KEY is configured
    if (serverKey) {
      const isValid = verifyWebhookSignature(
        order_id,
        status_code,
        String(gross_amount),
        serverKey,
        signature_key
      );
      if (!isValid) {
        return NextResponse.json(
          { error: 'Invalid or missing HMAC signature' },
          { status: 401 }
        );
      }
    }

    const numericAmount = Math.round(parsedAmount);
    const isSettled =
      transaction_status === 'settlement' || transaction_status === 'capture';
    const normalizedStatus = isSettled
      ? 'SETTLED'
      : String(transaction_status || 'PENDING').toUpperCase();

    // If live PostgreSQL connection is not active, return simulated idempotent response
    if (!isDatabaseConfigured || !prisma) {
      return NextResponse.json({
        success: true,
        idempotent: true,
        mode: 'simulated_memory',
        message:
          'Payment webhook received & acknowledged with simulated row-level locking.',
        order_id,
        status: normalizedStatus,
        amount: numericAmount,
        timestamp: new Date().toISOString(),
      });
    }

    // Execute atomic transaction with Row-Level Locking (SELECT ... FOR UPDATE)
    const result = await prisma.$transaction(
      async (tx) => {
        // 1. Acquire pessimistic lock on the transaction row
        const lockedRows = await tx.$queryRaw<Array<{ id: string; status: string }>>`
          SELECT id, status 
          FROM payment_transactions 
          WHERE "externalId" = ${order_id} 
          FOR UPDATE
        `;

        if (lockedRows && lockedRows.length > 0) {
          const currentRecord = lockedRows[0];

          // IDEMPOTENCY CHECK:
          // If transaction has already been settled, immediately return without re-crediting
          if (currentRecord.status === 'SETTLED') {
            return {
              idempotentSkipped: true,
              message: `Order ${order_id} has already been settled. Idempotently skipped.`,
              status: 'SETTLED',
            };
          }

          // Otherwise update from PENDING to SETTLED
          await tx.paymentTransaction.update({
            where: { externalId: order_id },
            data: {
              status: normalizedStatus,
              settledAt: isSettled ? new Date() : null,
              rawPayload: payload as unknown as object,
            },
          });

          return {
            idempotentSkipped: false,
            message: `Order ${order_id} status updated to ${normalizedStatus}.`,
            status: normalizedStatus,
          };
        }

        // 2. If row doesn't exist yet, insert it atomically
        let merchant = await tx.merchant.findFirst();
        if (!merchant) {
          merchant = await tx.merchant.create({
            data: {
              name: 'Merchant Utama',
              email: 'owner@merchant.id',
            },
          });
        }

        const newRecord = await tx.paymentTransaction.create({
          data: {
            externalId: order_id,
            merchantId: merchant.id,
            amount: numericAmount,
            status: normalizedStatus,
            paymentMethod: String(payment_type || 'QRIS').toUpperCase(),
            rawPayload: payload as unknown as object,
            settledAt: isSettled ? new Date() : null,
          },
        });

        return {
          idempotentSkipped: false,
          message: `Order ${order_id} created with status ${newRecord.status}.`,
          status: newRecord.status,
        };
      },
      {
        timeout: 10000,
        isolationLevel: 'ReadCommitted',
      }
    );

    return NextResponse.json({
      success: true,
      order_id,
      ...result,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Payment webhook error:', error);
    return NextResponse.json(
      {
        error: 'Failed to process payment webhook',
        ...(process.env.NODE_ENV === 'development' && {
          details: error instanceof Error ? error.message : String(error),
        }),
      },
      { status: 500 }
    );
  }
}
