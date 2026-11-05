import { NextResponse } from 'next/server';
import { clearMerchantSession } from '@/lib/auth';

export async function POST() {
  await clearMerchantSession();
  return NextResponse.json({
    success: true,
    message: 'Sesi berhasil diakhiri.',
  });
}

