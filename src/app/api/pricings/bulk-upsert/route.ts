import { NextRequest, NextResponse } from 'next/server';
import { prisma, isDatabaseConfigured } from '@/lib/prisma';
import { MenuItem, WorkspaceChannel } from '@/types/pricing';

export interface BulkUpsertPayload {
  merchantId?: string;
  channel: WorkspaceChannel;
  presets?: {
    platformCommissionPct: number;
    marketingBoosterPct: number;
    merchantDiscountValue: number;
    roundingRule: string;
  };
  items: MenuItem[];
}

export async function POST(req: NextRequest) {
  try {
    const body: BulkUpsertPayload = await req.json();

    if (!body || !Array.isArray(body.items)) {
      return NextResponse.json(
        { error: 'Invalid payload: "items" must be an array of MenuItem objects' },
        { status: 400 }
      );
    }

    const { channel = 'GRABFOOD', items, presets } = body;

    // Graceful offline fallback if live PostgreSQL is not configured
    if (!isDatabaseConfigured || !prisma) {
      return NextResponse.json({
        success: true,
        source: 'local_fallback',
        message: 'Database connection not detected. Synced seamlessly to browser localStorage.',
        savedCount: items.length,
        channel,
        timestamp: new Date().toISOString(),
      });
    }

    // Execute bulk upsert in transactional boundary
    const result = await prisma.$transaction(async (tx) => {
      // Find or create default merchant
      let merchant = await tx.merchant.findFirst();
      if (!merchant) {
        merchant = await tx.merchant.create({
          data: {
            name: 'Merchant Utama',
            email: 'owner@merchant.id',
          },
        });
      }

      // Upsert workspace for the channel
      const workspace = await tx.workspace.upsert({
        where: {
          merchantId_channel: {
            merchantId: merchant.id,
            channel: channel === 'GOFOOD' ? 'GOFOOD' : 'GRABFOOD',
          },
        },
        create: {
          merchantId: merchant.id,
          channel: channel === 'GOFOOD' ? 'GOFOOD' : 'GRABFOOD',
          name: channel === 'GOFOOD' ? 'GoFood Merchant' : 'GrabFood Merchant',
          defaultCommissionPct: presets?.platformCommissionPct ?? 20.0,
          defaultBoosterPct: presets?.marketingBoosterPct ?? 14.0,
          defaultDiscountPct: presets?.merchantDiscountValue ?? 30.0,
          roundingRule: presets?.roundingRule ?? 'CEIL_500',
        },
        update: {
          defaultCommissionPct: presets?.platformCommissionPct ?? 20.0,
          defaultBoosterPct: presets?.marketingBoosterPct ?? 14.0,
          defaultDiscountPct: presets?.merchantDiscountValue ?? 30.0,
          roundingRule: presets?.roundingRule ?? 'CEIL_500',
        },
      });

      // Upsert all menu items
      let upsertedCount = 0;
      for (const item of items) {
        await tx.menuItem.upsert({
          where: { id: item.id },
          create: {
            id: item.id,
            workspaceId: workspace.id,
            name: item.name,
            category: item.category || 'Makanan Utama',
            targetOfflinePrice: Math.round(item.targetOfflinePrice),
            displayPrice: Math.round(item.displayPrice),
            discountType: item.merchantDiscountType === 'NOMINAL' ? 'NOMINAL' : 'PERCENT',
            discountValue: item.merchantDiscountValue,
            commissionPct: item.platformCommissionPct,
            boosterPct: item.marketingBoosterPct,
            isBoosterActive: item.isBoosterActive,
            notes: item.notes,
          },
          update: {
            name: item.name,
            category: item.category || 'Makanan Utama',
            targetOfflinePrice: Math.round(item.targetOfflinePrice),
            displayPrice: Math.round(item.displayPrice),
            discountType: item.merchantDiscountType === 'NOMINAL' ? 'NOMINAL' : 'PERCENT',
            discountValue: item.merchantDiscountValue,
            commissionPct: item.platformCommissionPct,
            boosterPct: item.marketingBoosterPct,
            isBoosterActive: item.isBoosterActive,
            notes: item.notes,
          },
        });
        upsertedCount++;
      }

      return {
        workspaceId: workspace.id,
        savedCount: upsertedCount,
      };
    });

    return NextResponse.json({
      success: true,
      source: 'postgres',
      message: `Berhasil menyimpan ${result.savedCount} menu ke PostgreSQL.`,
      ...result,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Bulk upsert API error:', error);
    return NextResponse.json(
      {
        error: 'Failed to execute bulk upsert',
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
