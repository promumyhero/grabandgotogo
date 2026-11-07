import { NextRequest, NextResponse } from 'next/server';
import { prisma, isDatabaseConfigured } from '@/lib/prisma';
import { getSessionUser } from '@/lib/auth';
import {
  DiscountTemplate,
  GlobalPresets,
  MenuItem,
  RoundingRule,
  WorkspaceChannel,
} from '@/types/pricing';
import {
  BUILT_IN_DISCOUNT_TEMPLATES,
  DEFAULT_GOFOOD_CATEGORIES,
  DEFAULT_GOFOOD_PRESETS,
  DEFAULT_GRAB_CATEGORIES,
  DEFAULT_GRAB_PRESETS,
} from '@/lib/storage';

export async function GET(req: NextRequest) {
  try {
    const sessionUser = await getSessionUser();
    if (!sessionUser) {
      return NextResponse.json(
        { error: 'Unauthorized: Sesi tidak ditemukan.' },
        { status: 401 }
      );
    }

    const channelParam = req.nextUrl.searchParams.get('channel');
    const safeChannel: WorkspaceChannel =
      channelParam === 'GOFOOD' ? 'GOFOOD' : 'GRABFOOD';

    if (!isDatabaseConfigured || !prisma) {
      return NextResponse.json({
        success: true,
        source: 'local_fallback',
        workspace: null,
      });
    }

    const [workspace, dbTemplates] = await Promise.all([
      prisma.workspace.findUnique({
        where: {
          merchantId_channel: {
            merchantId: sessionUser.id,
            channel: safeChannel,
          },
        },
        include: {
          menuItems: {
            orderBy: { sortOrder: 'asc' },
          },
        },
      }),
      prisma.discountTemplate.findMany({
        where: {
          merchantId: sessionUser.id,
          channel: safeChannel,
        },
        orderBy: { createdAt: 'asc' },
      }),
    ]);

    const builtInForChannel = BUILT_IN_DISCOUNT_TEMPLATES.filter(
      (t) => t.channel === safeChannel
    );

    const customTemplates: DiscountTemplate[] = dbTemplates.map((t) => ({
      id: t.id,
      name: t.name,
      channel: t.channel,
      platformCommissionPct: t.platformCommissionPct,
      marketingBoosterPct: t.marketingBoosterPct,
      isBoosterActiveDefault: t.isBoosterActiveDefault,
      merchantDiscountType: t.merchantDiscountType,
      merchantDiscountValue: t.merchantDiscountValue,
      gojekSubsidyPct: t.gojekSubsidyPct,
      isCoFundedPromo: t.isCoFundedPromo,
      roundingRule: (['EXACT', 'CEIL_100', 'CEIL_500', 'CEIL_1000'].includes(
        t.roundingRule
      )
        ? t.roundingRule
        : 'CEIL_500') as RoundingRule,
      isBuiltIn: false,
    }));

    if (!workspace) {
      return NextResponse.json({
        success: true,
        source: 'supabase_postgres',
        workspace: null,
        discountTemplates: [...builtInForChannel, ...customTemplates],
      });
    }

    const fallbackPresets =
      safeChannel === 'GOFOOD' ? DEFAULT_GOFOOD_PRESETS : DEFAULT_GRAB_PRESETS;
    const fallbackCategories =
      safeChannel === 'GOFOOD'
        ? DEFAULT_GOFOOD_CATEGORIES
        : DEFAULT_GRAB_CATEGORIES;

    const presets: GlobalPresets = {
      platformCommissionPct:
        workspace.defaultCommissionPct ?? fallbackPresets.platformCommissionPct,
      marketingBoosterPct:
        workspace.defaultBoosterPct ?? fallbackPresets.marketingBoosterPct,
      merchantDiscountValue:
        workspace.defaultDiscountPct ?? fallbackPresets.merchantDiscountValue,
      merchantDiscountType:
        workspace.defaultDiscountType ?? fallbackPresets.merchantDiscountType,
      roundingRule: (['EXACT', 'CEIL_100', 'CEIL_500', 'CEIL_1000'].includes(
        workspace.roundingRule
      )
        ? workspace.roundingRule
        : fallbackPresets.roundingRule) as RoundingRule,
      isBoosterActiveDefault:
        workspace.isBoosterActiveDefault ?? fallbackPresets.isBoosterActiveDefault,
      gojekSubsidyPct:
        workspace.gojekSubsidyPct ?? fallbackPresets.gojekSubsidyPct ?? 25,
      isCoFundedPromo:
        workspace.isCoFundedPromo ?? fallbackPresets.isCoFundedPromo ?? true,
    };

    const parsedCategories =
      Array.isArray(workspace.categories) && workspace.categories.length > 0
        ? (workspace.categories as string[])
        : fallbackCategories;

    const mappedItems: MenuItem[] = workspace.menuItems.map((item) => ({
      id: item.id,
      name: item.name,
      category: item.category,
      channel: safeChannel,
      targetOfflinePrice: item.targetOfflinePrice,
      displayPrice: item.displayPrice,
      merchantDiscountType: item.discountType,
      merchantDiscountValue: item.discountValue,
      platformCommissionPct: item.commissionPct,
      marketingBoosterPct: item.boosterPct,
      isBoosterActive: item.isBoosterActive,
      gojekSubsidyPct: item.gojekSubsidyPct,
      isCoFundedPromo: item.isCoFundedPromo,
      notes: item.notes ?? undefined,
      createdAt: item.createdAt.toISOString(),
      updatedAt: item.updatedAt.toISOString(),
    }));

    const hasSyncedData =
      workspace.menuItems.length > 0 ||
      Math.abs(workspace.updatedAt.getTime() - workspace.createdAt.getTime()) > 500;

    return NextResponse.json(
      {
        success: true,
        source: 'supabase_postgres',
        workspace: {
          id: workspace.id,
          channel: safeChannel,
          presets,
          categories: parsedCategories,
          items: mappedItems,
          hasSyncedData,
        },
        discountTemplates: [...builtInForChannel, ...customTemplates],
      },
      {
        headers: { 'Cache-Control': 'no-store, max-age=0' },
      }
    );
  } catch (error) {
    console.error('Fetch workspace API error:', error);
    return NextResponse.json(
      { error: 'Gagal memuat workspace dari database.' },
      { status: 500 }
    );
  }
}

