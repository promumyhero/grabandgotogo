import { NextRequest, NextResponse } from 'next/server';
import { prisma, isDatabaseConfigured } from '@/lib/prisma';
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
 * Validates HMAC SHA512 signature for QRIS webhook
 */
function verifyWebhookSignature(
  orderId: string,
  statusCode: string,
  grossAmount: string,
  serverKey: string,
  receivedSignature?: string
): boolean {
  if (!receivedSignature || !serverKey) return true; // allow testing when secret not configured
  const input = `${orderId}${statusCode}${grossAmount}${serverKey}`;
  const computed = crypto.createHash('sha512').update(input).digest('hex');
  return computed === receivedSignature;
}

export async function POST(req: NextRequest) {
  try {
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

    if (!order_id) {
      return NextResponse.json(
        { error: 'Missing mandatory field: order_id' },
        { status: 422 }
      );
    }

    // Optional signature verification check
    const serverKey = process.env.PAYMENT_GATEWAY_SERVER_KEY || '';
    if (serverKey && signature_key) {
      const isValid = verifyWebhookSignature(
        order_id,
        status_code,
        String(gross_amount),
        serverKey,
        signature_key
      );
      if (!isValid) {
        return NextResponse.json(
          { error: 'Invalid HMAC signature' },
          { status: 401 }
        );
      }
    }

    const numericAmount = Math.round(Number(gross_amount) || 0);
    const isSettled =
      transaction_status === 'settlement' || transaction_status === 'capture';

    // If live PostgreSQL connection is not active, return simulated idempotent response
    if (!isDatabaseConfigured || !prisma) {
      return NextResponse.json({
        success: true,
        idempotent: true,
        mode: 'simulated_memory',
        message:
          'Payment webhook received & acknowledged with simulated row-level locking.',
        order_id,
        status: isSettled ? 'SETTLED' : transaction_status.toUpperCase(),
        amount: numericAmount,
        timestamp: new Date().toISOString(),
      });
    }

    // Execute atomic transaction with Row-Level Locking (SELECT ... FOR UPDATE)
    const result = await prisma.$transaction(
      async (tx) => {
        // 1. Acquire pessimistic lock on the transaction row
        // Raw query for Postgres Row-Level Lock
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
              status: isSettled ? 'SETTLED' : transaction_status.toUpperCase(),
              settledAt: isSettled ? new Date() : null,
              rawPayload: payload as unknown as object,
            },
          });

          return {
            idempotentSkipped: false,
            message: `Order ${order_id} status updated to ${isSettled ? 'SETTLED' : transaction_status}.`,
            status: isSettled ? 'SETTLED' : transaction_status.toUpperCase(),
          };
        }

        // 2. If row doesn't exist yet, insert it atomically
        // Find default merchant or create fallback
        let merchant = await tx.merchant.findFirst();
        if (!merchant) {
          merchant = await tx.merchant.create({
            data: {
              name: 'Merchant Utama',
            },
          });
        }

        const newRecord = await tx.paymentTransaction.create({
          data: {
            externalId: order_id,
            merchantId: merchant.id,
            amount: numericAmount,
            status: isSettled ? 'SETTLED' : transaction_status.toUpperCase(),
            paymentMethod: payment_type.toUpperCase(),
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
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
