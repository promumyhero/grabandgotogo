import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { prisma, isDatabaseConfigured } from '@/lib/prisma';
import {
  checkRateLimit,
  hashPassword,
  resetRateLimit,
  sanitizePlainText,
  validateAndNormalizeEmail,
  validatePasswordStrength,
} from '@/lib/security';
import { createMerchantSession } from '@/lib/auth';
import {
  DEFAULT_GOFOOD_CATEGORIES,
  DEFAULT_GOFOOD_PRESETS,
  DEFAULT_GRAB_CATEGORIES,
  DEFAULT_GRAB_PRESETS,
} from '@/lib/storage';

export async function POST(req: NextRequest) {
  try {
    const ip =
      req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
      req.headers.get('x-real-ip') ||
      'unknown';

    const body = await req.json().catch(() => null);
    if (!body || typeof body !== 'object') {
      return NextResponse.json(
        { error: 'Payload permintaan tidak valid.' },
        { status: 400 }
      );
    }

    const emailCheck = validateAndNormalizeEmail(body.email);
    if (!emailCheck.valid) {
      return NextResponse.json({ error: emailCheck.error }, { status: 422 });
    }

    const rateKey = `register:${ip}:${emailCheck.email}`;
    const rate = checkRateLimit(rateKey, 6, 15 * 60 * 1000);
    if (!rate.allowed) {
      return NextResponse.json(
        {
          error: `Terlalu banyak percobaan pendaftaran. Silakan coba lagi dalam ${rate.retryAfterSec} detik.`,
        },
        {
          status: 429,
          headers: { 'Retry-After': String(rate.retryAfterSec) },
        }
      );
    }

    const restaurantName = sanitizePlainText(body.name, 100);
    if (restaurantName.length < 2) {
      return NextResponse.json(
        { error: 'Nama Resto minimal 2 karakter.' },
        { status: 422 }
      );
    }

    const passwordCheck = validatePasswordStrength(body.password);
    if (!passwordCheck.valid) {
      return NextResponse.json({ error: passwordCheck.error }, { status: 422 });
    }

    const passwordHash = await hashPassword(body.password);

    if (isDatabaseConfigured && prisma) {
      const existing = await prisma.merchant.findUnique({
        where: { email: emailCheck.email },
        select: { id: true },
      });

      if (existing) {
        return NextResponse.json(
          { error: 'Email sudah terdaftar. Silakan masuk menggunakan akun Anda.' },
          { status: 409 }
        );
      }

      const createdMerchant = await prisma.$transaction(async (tx) => {
        const merchant = await tx.merchant.create({
          data: {
            name: restaurantName,
            email: emailCheck.email,
            passwordHash,
          },
        });

        // Provision isolated default GrabFood & GoFood workspaces for this restaurant
        await tx.workspace.createMany({
          data: [
            {
              merchantId: merchant.id,
              channel: 'GRABFOOD',
              name: `${restaurantName} - GrabFood`,
              defaultCommissionPct: DEFAULT_GRAB_PRESETS.platformCommissionPct,
              defaultBoosterPct: DEFAULT_GRAB_PRESETS.marketingBoosterPct,
              defaultDiscountPct: DEFAULT_GRAB_PRESETS.merchantDiscountValue,
              defaultDiscountType: 'PERCENT',
              isBoosterActiveDefault: true,
              roundingRule: DEFAULT_GRAB_PRESETS.roundingRule,
              categories: DEFAULT_GRAB_CATEGORIES,
            },
            {
              merchantId: merchant.id,
              channel: 'GOFOOD',
              name: `${restaurantName} - GoFood`,
              defaultCommissionPct: DEFAULT_GOFOOD_PRESETS.platformCommissionPct,
              defaultBoosterPct: 0,
              defaultDiscountPct: DEFAULT_GOFOOD_PRESETS.merchantDiscountValue,
              defaultDiscountType: 'PERCENT',
              isBoosterActiveDefault: false,
              gojekSubsidyPct: DEFAULT_GOFOOD_PRESETS.gojekSubsidyPct ?? 25,
              isCoFundedPromo: DEFAULT_GOFOOD_PRESETS.isCoFundedPromo ?? true,
              roundingRule: DEFAULT_GOFOOD_PRESETS.roundingRule,
              categories: DEFAULT_GOFOOD_CATEGORIES,
            },
          ],
        });

        return merchant;
      });

      resetRateLimit(rateKey);

      const user = {
        id: createdMerchant.id,
        name: createdMerchant.name,
        email: createdMerchant.email,
        createdAt: createdMerchant.createdAt.toISOString(),
      };

      await createMerchantSession(user, {
        userAgent: req.headers.get('user-agent') ?? undefined,
        ipAddress: ip,
      });

      return NextResponse.json(
        {
          success: true,
          user,
          source: 'supabase_postgres',
        },
        { status: 201 }
      );
    }

    // Encrypted Cookie Fallback if DB is unreachable
    const fallbackUser = {
      id: `local_${crypto.createHash('sha256').update(emailCheck.email).digest('hex').slice(0, 16)}`,
      name: restaurantName,
      email: emailCheck.email,
      createdAt: new Date().toISOString(),
    };

    await createMerchantSession(fallbackUser, {
      userAgent: req.headers.get('user-agent') ?? undefined,
      ipAddress: ip,
    });

    return NextResponse.json(
      {
        success: true,
        user: fallbackUser,
        source: 'local_session',
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Register API error:', error);
    return NextResponse.json(
      {
        error: 'Gagal mendaftarkan akun restoran. Silakan coba beberapa saat lagi.',
        ...(process.env.NODE_ENV === 'development' && {
          details: error instanceof Error ? error.message : String(error),
        }),
      },
      { status: 500 }
    );
  }
}

