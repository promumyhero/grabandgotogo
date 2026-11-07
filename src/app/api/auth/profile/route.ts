import { NextRequest, NextResponse } from 'next/server';
import { prisma, isDatabaseConfigured } from '@/lib/prisma';
import {
  clearMerchantSession,
  createMerchantSession,
  getSessionUser,
} from '@/lib/auth';
import {
  checkRateLimit,
  hashPassword,
  sanitizePlainText,
  validateAndNormalizeEmail,
  validatePasswordStrength,
  verifyPassword,
} from '@/lib/security';

/**
 * PATCH /api/auth/profile
 * Updates restaurant profile (name, phone) and optionally credentials (email, password).
 * Sensitive changes (email or newPassword) strictly require `currentPassword` verification.
 */
export async function PATCH(req: NextRequest) {
  try {
    const sessionUser = await getSessionUser();
    if (!sessionUser) {
      return NextResponse.json(
        { error: 'Sesi tidak valid. Silakan masuk kembali.' },
        { status: 401 }
      );
    }

    const ip =
      req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
      req.headers.get('x-real-ip') ||
      'unknown';

    const rate = checkRateLimit(
      `profile_update:${ip}:${sessionUser.id}`,
      12,
      15 * 60 * 1000
    );
    if (!rate.allowed) {
      return NextResponse.json(
        {
          error: `Terlalu banyak permintaan perubahan profil. Coba lagi dalam ${rate.retryAfterSec} detik.`,
        },
        {
          status: 429,
          headers: { 'Retry-After': String(rate.retryAfterSec) },
        }
      );
    }

    const body = await req.json().catch(() => null);
    if (!body || typeof body !== 'object') {
      return NextResponse.json(
        { error: 'Payload tidak valid.' },
        { status: 400 }
      );
    }

    const nextName =
      body.name !== undefined
        ? sanitizePlainText(body.name, 100)
        : sessionUser.name;
    if (nextName.length < 2) {
      return NextResponse.json(
        { error: 'Nama Resto minimal harus 2 karakter.' },
        { status: 422 }
      );
    }

    const nextPhone =
      body.phone !== undefined
        ? sanitizePlainText(body.phone, 30).replace(/[^0-9+()-\s]/g, '')
        : sessionUser.phone;

    const wantsEmailChange =
      typeof body.email === 'string' &&
      body.email.trim().toLowerCase() !== sessionUser.email.toLowerCase();
    const wantsPasswordChange =
      typeof body.newPassword === 'string' && body.newPassword.length > 0;

    let nextEmail = sessionUser.email;
    if (wantsEmailChange) {
      const emailCheck = validateAndNormalizeEmail(body.email);
      if (!emailCheck.valid) {
        return NextResponse.json({ error: emailCheck.error }, { status: 422 });
      }
      nextEmail = emailCheck.email;
    }

    if (wantsPasswordChange) {
      const pwCheck = validatePasswordStrength(body.newPassword);
      if (!pwCheck.valid) {
        return NextResponse.json({ error: pwCheck.error }, { status: 422 });
      }
    }

    if (isDatabaseConfigured && prisma) {
      const merchant = await prisma.merchant.findUnique({
        where: { id: sessionUser.id },
      });

      if (!merchant) {
        return NextResponse.json(
          { error: 'Data akun restoran tidak ditemukan.' },
          { status: 404 }
        );
      }

      // Require currentPassword verification if changing email or password
      if (wantsEmailChange || wantsPasswordChange) {
        const currentPassword =
          typeof body.currentPassword === 'string' ? body.currentPassword : '';
        if (!currentPassword) {
          return NextResponse.json(
            {
              error:
                'Masukkan Password Saat Ini untuk mengubah email atau password.',
            },
            { status: 422 }
          );
        }

        const isPasswordValid = await verifyPassword(
          currentPassword,
          merchant.passwordHash
        );
        if (!isPasswordValid) {
          return NextResponse.json(
            { error: 'Password Saat Ini yang Anda masukkan salah.' },
            { status: 403 }
          );
        }
      }

      if (wantsEmailChange) {
        const emailTaken = await prisma.merchant.findUnique({
          where: { email: nextEmail },
          select: { id: true },
        });
        if (emailTaken && emailTaken.id !== sessionUser.id) {
          return NextResponse.json(
            { error: 'Email tersebut sudah digunakan oleh akun lain.' },
            { status: 409 }
          );
        }
      }

      const newPasswordHash = wantsPasswordChange
        ? await hashPassword(body.newPassword)
        : undefined;

      const updated = await prisma.merchant.update({
        where: { id: sessionUser.id },
        data: {
          name: nextName,
          phone: nextPhone || null,
          email: nextEmail,
          ...(newPasswordHash && { passwordHash: newPasswordHash }),
        },
      });

      // If password was changed, revoke old sessions and issue a fresh session cookie
      if (wantsPasswordChange) {
        await prisma.merchantSession.deleteMany({
          where: { merchantId: sessionUser.id },
        });
      }

      const updatedUser = {
        id: updated.id,
        name: updated.name,
        email: updated.email,
        phone: updated.phone ?? undefined,
        createdAt: updated.createdAt.toISOString(),
      };

      await createMerchantSession(updatedUser, {
        userAgent: req.headers.get('user-agent') ?? undefined,
        ipAddress: ip,
      });

      return NextResponse.json({
        success: true,
        user: updatedUser,
        message: 'Profil restoran berhasil diperbarui.',
      });
    }

    // Fallback when running in local session mode
    const fallbackUser = {
      ...sessionUser,
      name: nextName,
      email: nextEmail,
      phone: nextPhone || undefined,
    };
    await createMerchantSession(fallbackUser, {
      userAgent: req.headers.get('user-agent') ?? undefined,
      ipAddress: ip,
    });

    return NextResponse.json({
      success: true,
      user: fallbackUser,
      message: 'Profil restoran berhasil diperbarui.',
    });
  } catch (error) {
    console.error('Update profile API error:', error);
    return NextResponse.json(
      { error: 'Gagal memperbarui profil restoran.' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/auth/profile
 * Permanently deletes the Merchant account and all cascading Workspaces, MenuItems,
 * DiscountTemplates, and Sessions in Supabase PostgreSQL.
 */
export async function DELETE(req: NextRequest) {
  try {
    const sessionUser = await getSessionUser();
    if (!sessionUser) {
      return NextResponse.json(
        { error: 'Sesi tidak valid. Silakan masuk kembali.' },
        { status: 401 }
      );
    }

    const ip =
      req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
      req.headers.get('x-real-ip') ||
      'unknown';

    const rate = checkRateLimit(
      `profile_delete:${ip}:${sessionUser.id}`,
      5,
      15 * 60 * 1000
    );
    if (!rate.allowed) {
      return NextResponse.json(
        {
          error: `Terlalu banyak percobaan penghapusan akun. Coba lagi dalam ${rate.retryAfterSec} detik.`,
        },
        {
          status: 429,
          headers: { 'Retry-After': String(rate.retryAfterSec) },
        }
      );
    }

    const body = await req.json().catch(() => null);
    if (!body || typeof body !== 'object') {
      return NextResponse.json(
        { error: 'Payload konfirmasi tidak valid.' },
        { status: 400 }
      );
    }

    if (body.confirmText !== 'HAPUS') {
      return NextResponse.json(
        { error: 'Ketik kata "HAPUS" dengan huruf kapital untuk mengonfirmasi.' },
        { status: 422 }
      );
    }

    const currentPassword =
      typeof body.currentPassword === 'string' ? body.currentPassword : '';
    if (!currentPassword) {
      return NextResponse.json(
        { error: 'Password wajib diisi untuk menghapus akun secara permanen.' },
        { status: 422 }
      );
    }

    if (isDatabaseConfigured && prisma) {
      const merchant = await prisma.merchant.findUnique({
        where: { id: sessionUser.id },
        select: { id: true, passwordHash: true },
      });

      if (merchant) {
        const isPasswordValid = await verifyPassword(
          currentPassword,
          merchant.passwordHash
        );
        if (!isPasswordValid) {
          return NextResponse.json(
            { error: 'Password yang Anda masukkan salah. Penghapusan dibatalkan.' },
            { status: 403 }
          );
        }

        // Cascade delete Merchant + Workspaces + MenuItems + DiscountTemplates + Sessions
        await prisma.merchant.delete({
          where: { id: sessionUser.id },
        });
      }
    }

    await clearMerchantSession();

    return NextResponse.json({
      success: true,
      deletedMerchantId: sessionUser.id,
      message: 'Akun restoran dan seluruh data terkait telah dihapus permanen.',
    });
  } catch (error) {
    console.error('Delete account API error:', error);
    return NextResponse.json(
      { error: 'Gagal menghapus akun restoran.' },
      { status: 500 }
    );
  }
}

