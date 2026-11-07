import { NextRequest, NextResponse } from 'next/server';
import { prisma, isDatabaseConfigured } from '@/lib/prisma';
import { getSessionUser } from '@/lib/auth';
import { checkRateLimit, clampNumber, sanitizePlainText } from '@/lib/security';
import {
  DiscountTemplate,
  GlobalPresets,
  MenuItem,
  WorkspaceChannel,
} from '@/types/pricing';

export interface BulkUpsertPayload {
  channel: WorkspaceChannel;
  presets?: GlobalPresets;
  categories?: string[];
  discountTemplates?: DiscountTemplate[];
  items: MenuItem[];
}

const MAX_BATCH_ITEMS = 500;

export async function POST(req: NextRequest) {
  try {
    // Enforce authentication: Cloud Database Sync is restricted to authenticated merchants
    const sessionUser = await getSessionUser();
    if (!sessionUser) {
      return NextResponse.json(
        {
          error:
            'Fitur Simpan ke Cloud Database hanya tersedia untuk akun Resto terdaftar. Silakan masuk terlebih dahulu.',
        },
        { status: 401 }
      );
    }

    const ip =
      req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
      req.headers.get('x-real-ip') ||
      'unknown';

    const rate = checkRateLimit(
      `bulk_upsert:${ip}:${sessionUser.id}`,
      30,
      5 * 60 * 1000
    );
    if (!rate.allowed) {
      return NextResponse.json(
        {
          error: `Terlalu banyak permintaan sinkronisasi. Silakan tunggu ${rate.retryAfterSec} detik.`,
        },
        {
          status: 429,
          headers: { 'Retry-After': String(rate.retryAfterSec) },
        }
      );
    }

    const body: BulkUpsertPayload = await req.json();

    if (!body || !Array.isArray(body.items)) {
      return NextResponse.json(
        { error: 'Invalid payload: "items" must be an array of MenuItem objects' },
        { status: 400 }
      );
    }

    if (body.items.length > MAX_BATCH_ITEMS) {
      return NextResponse.json(
        { error: `Payload exceeds maximum batch limit of ${MAX_BATCH_ITEMS} items` },
        { status: 413 }
      );
    }

    const { channel = 'GRABFOOD', items, presets, categories, discountTemplates } = body;
    const safeChannel: WorkspaceChannel = channel === 'GOFOOD' ? 'GOFOOD' : 'GRABFOOD';

    const validItems = items.filter(
      (item) =>
        item &&
        typeof item.id === 'string' &&
        item.id.trim() &&
        typeof item.name === 'string' &&
        item.name.trim()
    );

    if (!isDatabaseConfigured || !prisma) {
      return NextResponse.json({
        success: true,
        source: 'local_fallback',
        message: 'Disimpan ke penyimpanan terisolasi akun lokal.',
        savedCount: validItems.length,
        channel: safeChannel,
        timestamp: new Date().toISOString(),
      });
    }

    const merchantId = sessionUser.id;

    // Execute tenant-isolated bulk upsert inside transaction
    const result = await prisma.$transaction(async (tx) => {
      const defaultComm = clampNumber(presets?.platformCommissionPct, 0, 100, 20.0);
      const defaultBooster = clampNumber(presets?.marketingBoosterPct, 0, 100, 14.0);
      const defaultDisc = clampNumber(presets?.merchantDiscountValue, 0, 100_000_000, 30.0);
      const defaultDiscType =
        presets?.merchantDiscountType === 'NOMINAL' ? 'NOMINAL' : 'PERCENT';
      const isBoosterActiveDefault = Boolean(presets?.isBoosterActiveDefault ?? true);
      const gojekSubsidyPct = clampNumber(presets?.gojekSubsidyPct, 0, 100, 25.0);
      const isCoFundedPromo = Boolean(presets?.isCoFundedPromo ?? true);
      const roundingRule = ['EXACT', 'CEIL_100', 'CEIL_500', 'CEIL_1000'].includes(
        presets?.roundingRule ?? ''
      )
        ? presets!.roundingRule
        : 'CEIL_500';

      const sanitizedCategories = Array.isArray(categories)
        ? categories
            .map((c) => sanitizePlainText(c, 80))
            .filter(Boolean)
            .slice(0, 50)
        : undefined;

      const workspace = await tx.workspace.upsert({
        where: {
          merchantId_channel: {
            merchantId,
            channel: safeChannel,
          },
        },
        create: {
          merchantId,
          channel: safeChannel,
          name: `${sessionUser.name} - ${safeChannel === 'GOFOOD' ? 'GoFood' : 'GrabFood'}`,
          defaultCommissionPct: defaultComm,
          defaultBoosterPct: defaultBooster,
          defaultDiscountPct: defaultDisc,
          defaultDiscountType: defaultDiscType,
          isBoosterActiveDefault,
          gojekSubsidyPct,
          isCoFundedPromo,
          roundingRule,
          ...(sanitizedCategories && { categories: sanitizedCategories }),
        },
        update: {
          name: `${sessionUser.name} - ${safeChannel === 'GOFOOD' ? 'GoFood' : 'GrabFood'}`,
          defaultCommissionPct: defaultComm,
          defaultBoosterPct: defaultBooster,
          defaultDiscountPct: defaultDisc,
          defaultDiscountType: defaultDiscType,
          isBoosterActiveDefault,
          gojekSubsidyPct,
          isCoFundedPromo,
          roundingRule,
          ...(sanitizedCategories && { categories: sanitizedCategories }),
          updatedAt: new Date(),
        },
      });

      // Replace workspace items cleanly (scoped strictly to workspace.id owned by session.merchantId -> zero IDOR risk)
      await tx.menuItem.deleteMany({
        where: { workspaceId: workspace.id },
      });

      const seenIds = new Set<string>();
      const itemsToInsert = validItems
        .map((item, index) => {
          // Scope item ID by workspaceId to prevent cross-tenant primary key collisions
          const rawId = sanitizePlainText(item.id, 80);
          let scopedId = rawId.startsWith(`${workspace.id}_`)
            ? rawId
            : `${workspace.id}_${rawId}`;

          if (seenIds.has(scopedId)) {
            scopedId = `${scopedId}_${index}`;
          }
          seenIds.add(scopedId);

          return {
            id: scopedId,
            workspaceId: workspace.id,
            name: sanitizePlainText(item.name, 200) || 'Menu Tanpa Nama',
            category: sanitizePlainText(item.category, 100) || 'Makanan Utama',
            targetOfflinePrice: Math.round(
              clampNumber(item.targetOfflinePrice, 0, 100_000_000, 0)
            ),
            displayPrice: Math.round(
              clampNumber(item.displayPrice, 0, 100_000_000, 0)
            ),
            discountType:
              (item.merchantDiscountType === 'NOMINAL' ? 'NOMINAL' : 'PERCENT') as
                | 'NOMINAL'
                | 'PERCENT',
            discountValue: clampNumber(
              item.merchantDiscountValue,
              0,
              100_000_000,
              0
            ),
            commissionPct: clampNumber(item.platformCommissionPct, 0, 100, 20),
            boosterPct: clampNumber(item.marketingBoosterPct, 0, 100, 0),
            isBoosterActive: Boolean(item.isBoosterActive),
            gojekSubsidyPct: clampNumber(item.gojekSubsidyPct, 0, 100, 25),
            isCoFundedPromo: Boolean(item.isCoFundedPromo ?? true),
            notes: item.notes ? sanitizePlainText(item.notes, 500) : null,
            sortOrder: index,
          };
        });

      if (itemsToInsert.length > 0) {
        await tx.menuItem.createMany({
          data: itemsToInsert,
        });
      }

      // Sync custom discount templates for this merchant & channel if provided
      if (Array.isArray(discountTemplates)) {
        const customOnly = discountTemplates
          .filter((t) => t && !t.isBuiltIn && sanitizePlainText(t.name, 80))
          .slice(0, 30);

        await tx.discountTemplate.deleteMany({
          where: {
            merchantId,
            channel: safeChannel,
          },
        });

        if (customOnly.length > 0) {
          await tx.discountTemplate.createMany({
            data: customOnly.map((t) => ({
              merchantId,
              name: sanitizePlainText(t.name, 80),
              channel: safeChannel,
              platformCommissionPct: clampNumber(t.platformCommissionPct, 0, 100, 20),
              marketingBoosterPct: clampNumber(t.marketingBoosterPct, 0, 100, 0),
              isBoosterActiveDefault: Boolean(t.isBoosterActiveDefault),
              merchantDiscountType:
                t.merchantDiscountType === 'NOMINAL' ? 'NOMINAL' : 'PERCENT',
              merchantDiscountValue: clampNumber(
                t.merchantDiscountValue,
                0,
                100_000_000,
                0
              ),
              gojekSubsidyPct: clampNumber(t.gojekSubsidyPct, 0, 100, 25),
              isCoFundedPromo: Boolean(t.isCoFundedPromo ?? true),
              roundingRule: ['EXACT', 'CEIL_100', 'CEIL_500', 'CEIL_1000'].includes(
                t.roundingRule
              )
                ? t.roundingRule
                : 'CEIL_500',
            })),
          });
        }
      }

      return {
        workspaceId: workspace.id,
        savedCount: validItems.length,
      };
    });

    return NextResponse.json({
      success: true,
      source: 'supabase_postgres',
      message: `Berhasil menyimpan ${result.savedCount} menu resto "${sessionUser.name}" ke Supabase Cloud Database.`,
      ...result,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Bulk upsert API error:', error);
    return NextResponse.json(
      {
        error: 'Gagal menyimpan data ke database.',
        ...(process.env.NODE_ENV === 'development' && {
          details: error instanceof Error ? error.message : String(error),
        }),
      },
      { status: 500 }
    );
  }
}
