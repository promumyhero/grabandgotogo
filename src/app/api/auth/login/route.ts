import { NextRequest, NextResponse } from 'next/server';
import { prisma, isDatabaseConfigured } from '@/lib/prisma';
import {
  checkRateLimit,
  resetRateLimit,
  validateAndNormalizeEmail,
  verifyDummyPassword,
  verifyPassword,
} from '@/lib/security';
import { createMerchantSession } from '@/lib/auth';

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
    const rawPassword = typeof body.password === 'string' ? body.password : '';

    if (!emailCheck.valid || !rawPassword) {
      return NextResponse.json(
        { error: 'Email dan password wajib diisi dengan benar.' },
        { status: 422 }
      );
    }

    const rateKey = `login:${ip}:${emailCheck.email}`;
    const rate = checkRateLimit(rateKey, 8, 15 * 60 * 1000);
    if (!rate.allowed) {
      return NextResponse.json(
        {
          error: `Terlalu banyak percobaan login gagal. Silakan tunggu ${rate.retryAfterSec} detik.`,
        },
        {
          status: 429,
          headers: { 'Retry-After': String(rate.retryAfterSec) },
        }
      );
    }

    if (isDatabaseConfigured && prisma) {
      const merchant = await prisma.merchant.findUnique({
        where: { email: emailCheck.email },
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
          passwordHash: true,
          createdAt: true,
        },
      });

      if (!merchant || !merchant.passwordHash) {
        // Constant-time dummy scrypt execution to prevent email enumeration
        await verifyDummyPassword(rawPassword);
        return NextResponse.json(
          { error: 'Email atau password yang Anda masukkan salah.' },
          { status: 401 }
        );
      }

      const isPasswordValid = await verifyPassword(
        rawPassword,
        merchant.passwordHash
      );

      if (!isPasswordValid) {
        return NextResponse.json(
          { error: 'Email atau password yang Anda masukkan salah.' },
          { status: 401 }
        );
      }

      resetRateLimit(rateKey);

      const user = {
        id: merchant.id,
        name: merchant.name,
        email: merchant.email,
        phone: merchant.phone ?? undefined,
        createdAt: merchant.createdAt.toISOString(),
      };

      await createMerchantSession(user, {
        userAgent: req.headers.get('user-agent') ?? undefined,
        ipAddress: ip,
      });

      return NextResponse.json({
        success: true,
        user,
        source: 'supabase_postgres',
      });
    }

    return NextResponse.json(
      {
        error:
          'Koneksi database belum tersedia. Silakan daftar akun baru untuk memulai sesi.',
      },
      { status: 503 }
    );
  } catch (error) {
    console.error('Login API error:', error);
    return NextResponse.json(
      {
        error: 'Gagal memproses login. Silakan coba lagi.',
        ...(process.env.NODE_ENV === 'development' && {
          details: error instanceof Error ? error.message : String(error),
        }),
      },
      { status: 500 }
    );
  }
}

