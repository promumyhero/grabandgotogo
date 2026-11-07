import crypto from 'crypto';
import { cookies } from 'next/headers';
import { prisma, isDatabaseConfigured } from '@/lib/prisma';
import {
  hashToken,
  SignedSessionPayload,
  signSessionToken,
  verifySessionToken,
} from '@/lib/security';
import { AuthUser } from '@/types/pricing';

export const SESSION_COOKIE_NAME = 'fmp_merchant_session';
export const SESSION_TTL_SECONDS = 60 * 60 * 24 * 7; // 7 days

/**
 * Create a signed HttpOnly session cookie and optionally persist session record in Supabase PostgreSQL.
 */
export async function createMerchantSession(
  user: AuthUser,
  metadata?: { userAgent?: string; ipAddress?: string }
): Promise<string> {
  const now = Date.now();
  const expiresAtMs = now + SESSION_TTL_SECONDS * 1000;
  const jti = crypto.randomBytes(16).toString('hex');

  const payload: SignedSessionPayload = {
    uid: user.id,
    email: user.email,
    name: user.name,
    jti,
    iat: now,
    exp: expiresAtMs,
  };

  const signedToken = signSessionToken(payload);

  if (isDatabaseConfigured && prisma && !user.id.startsWith('local_')) {
    try {
      await prisma.merchantSession.create({
        data: {
          tokenHash: hashToken(signedToken),
          merchantId: user.id,
          userAgent: metadata?.userAgent?.slice(0, 255) ?? null,
          ipAddress: metadata?.ipAddress?.slice(0, 64) ?? null,
          expiresAt: new Date(expiresAtMs),
        },
      });
      // Opportunistic non-blocking cleanup of expired sessions
      void prisma.merchantSession
        .deleteMany({
          where: { expiresAt: { lt: new Date() } },
        })
        .catch(() => {});
    } catch {
      // Non-blocking if database session table is still migrating
    }
  }

  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE_NAME, signedToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: SESSION_TTL_SECONDS,
  });

  return signedToken;
}

/**
 * Read and verify current authenticated merchant from HttpOnly cookie.
 */
export async function getSessionUser(): Promise<AuthUser | null> {
  try {
    const cookieStore = await cookies();
    const rawToken = cookieStore.get(SESSION_COOKIE_NAME)?.value;
    const payload = verifySessionToken(rawToken);
    if (!payload) return null;

    if (
      isDatabaseConfigured &&
      prisma &&
      rawToken &&
      !payload.uid.startsWith('local_')
    ) {
      try {
        const dbSession = await prisma.merchantSession.findUnique({
          where: { tokenHash: hashToken(rawToken) },
          include: {
            merchant: {
              select: {
                id: true,
                name: true,
                email: true,
                phone: true,
                createdAt: true,
              },
            },
          },
        });

        // Strictly reject revoked or deleted sessions when DB query succeeds
        if (!dbSession) {
          return null;
        }

        if (dbSession.expiresAt.getTime() < Date.now()) {
          void prisma.merchantSession
            .delete({ where: { id: dbSession.id } })
            .catch(() => {});
          return null;
        }

        return {
          id: dbSession.merchant.id,
          name: dbSession.merchant.name,
          email: dbSession.merchant.email,
          phone: dbSession.merchant.phone ?? undefined,
          createdAt: dbSession.merchant.createdAt.toISOString(),
        };
      } catch {
        // Fallback to cryptographically verified HMAC session payload ONLY if DB connection transiently fails
      }
    }

    return {
      id: payload.uid,
      name: payload.name,
      email: payload.email,
    };
  } catch {
    return null;
  }
}

/**
 * Revoke session in database and clear HttpOnly cookie.
 */
export async function clearMerchantSession(): Promise<void> {
  try {
    const cookieStore = await cookies();
    const rawToken = cookieStore.get(SESSION_COOKIE_NAME)?.value;

    if (rawToken && isDatabaseConfigured && prisma) {
      try {
        await prisma.merchantSession.deleteMany({
          where: { tokenHash: hashToken(rawToken) },
        });
      } catch {
        // ignore if already deleted
      }
    }

    cookieStore.set(SESSION_COOKIE_NAME, '', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 0,
    });
  } catch {
    // ignore
  }
}

