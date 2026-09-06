import { demoTraders } from '@/lib/demo-data';
import { previewDataEnabled } from '@/lib/preview';
import { jsonError } from '@/lib/server';
import { getSql } from '@/lib/sql';

const LEGACY_CATEGORY_MAP: Record<string, string> = {
  'Bathroom Fitting': 'Bathrooms',
  'Kitchen Fitting': 'Kitchens',
  'EV Chargers': 'Renewables & EV',
  'Solar & Renewables': 'Renewables & EV',
  'General Building': 'Building & Extensions',
  Extensions: 'Building & Extensions',
  'Loft Conversions': 'Conversions',
  'Loft Boarding & Storage': 'Conversions',
  'Garage Conversions': 'Conversions',
  'Basement & Cellar Conversions': 'Conversions',
  Bricklaying: 'Brickwork & Masonry',
  'Stone Masonry': 'Brickwork & Masonry',
  'Plastering & Rendering': 'Plastering, Rendering & Dry Lining',
  'Dry Lining & Partitioning': 'Plastering, Rendering & Dry Lining',
  Roofing: 'Roofing & Roofline',
  'Guttering, Fascias & Soffits': 'Roofing & Roofline',
  'Windows & Doors': 'Windows, Doors & Glazing',
  Glazing: 'Windows, Doors & Glazing',
  'Garage Doors & Automated Gates': 'Windows, Doors & Glazing',
  Flooring: 'Flooring & Screeding',
  'Carpet Fitting': 'Flooring & Screeding',
  'Screeding & Floor Preparation': 'Flooring & Screeding',
  'Driveways & Paving': 'Driveways, Paving & Groundworks',
  Groundworks: 'Driveways, Paving & Groundworks',
  'Concrete & Formwork': 'Driveways, Paving & Groundworks',
  'Piling & Foundations': 'Driveways, Paving & Groundworks',
  Drainage: 'Drainage & Sewage',
  'Septic Tanks & Sewage Treatment': 'Drainage & Sewage',
  'Damp Proofing': 'Damp Proofing & Insulation',
  Insulation: 'Damp Proofing & Insulation',
  Cladding: 'Cladding & Exterior Finishes',
  'Smart Home, CCTV & Alarms': 'Security, Smart Home & Locksmiths',
  Locksmith: 'Security, Smart Home & Locksmiths',
  Handyman: 'Handyman & Property Maintenance',
  'Property Maintenance': 'Handyman & Property Maintenance',
  'Shopfitting & Commercial Fit-Out': 'Commercial Fit-Out & Access',
  Scaffolding: 'Commercial Fit-Out & Access',
  Demolition: 'Demolition, Asbestos & Waste',
  'Asbestos Survey & Removal': 'Demolition, Asbestos & Waste',
  'Waste Removal': 'Demolition, Asbestos & Waste',
  'Pressure Washing': 'Cleaning, Exterior Care & Pest Control',
  Cleaning: 'Cleaning, Exterior Care & Pest Control',
  'Pest Control': 'Cleaning, Exterior Care & Pest Control',
  'Garden Rooms & Outbuildings': 'Garden Buildings & Leisure',
  Conservatories: 'Garden Buildings & Leisure',
  'Swimming Pools & Hot Tubs': 'Garden Buildings & Leisure',
  'Architectural & Planning Services': 'Professional Building Services',
  'Structural Engineering': 'Professional Building Services',
  'Building Surveying': 'Professional Building Services',
};

function canonicalTradeCategory(category: string) {
  return LEGACY_CATEGORY_MAP[category] ?? category;
}

type DirectoryTrader = {
  id: string;
  userId: string;
  businessName: string;
  tradeCategory: string;
  tradeCategories: string[];
  subSkills: string[];
  serviceSelections: Record<string, string[]>;
  bio: string;
  radiusMiles: number;
  locationLabel: string | null;
  externalLinks: Record<string, string>;
  photos: string[];
  subscriptionTier: 'basic' | 'featured';
  isSubscriptionActive: boolean;
  averageRating: number;
  reviewCount: number;
  verifiedCredentialCount: number;
  availabilitySummary: string | null;
  rankingScore: number;
};

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const trade = url.searchParams.get('trade');
    const sql = getSql();
    const rows = await sql`
      SELECT tp.id,
             tp.user_id AS "userId",
             tp.business_name AS "businessName",
             tp.trade_category AS "tradeCategory",
             CASE WHEN cardinality(tp.trade_categories) > 0 THEN tp.trade_categories ELSE ARRAY[tp.trade_category]::text[] END AS "tradeCategories",
             tp.sub_skills AS "subSkills",
             tp.service_selections AS "serviceSelections",
             tp.bio,
             tp.radius_miles AS "radiusMiles",
             tp.location_label AS "locationLabel",
             tp.external_links AS "externalLinks",
             tp.photos,
             tp.subscription_tier AS "subscriptionTier",
             tp.is_subscription_active AS "isSubscriptionActive",
             coalesce(avg(r.rating), 0)::float AS "averageRating",
             count(r.id)::int AS "reviewCount",
             (SELECT count(*)::int
                FROM trader_credentials tc
               WHERE tc.trader_id = tp.user_id
                 AND tc.status = 'verified'
                 AND (tc.expires_at IS NULL OR tc.expires_at > now())) AS "verifiedCredentialCount",
             (SELECT CASE WHEN count(*) > 0 THEN 'Available soon' ELSE NULL END
                FROM trader_availability ta
               WHERE ta.trader_id = tp.user_id
                 AND ta.status = 'available'
                 AND ta.ends_at >= now()
                 AND ta.starts_at <= now() + interval '30 days') AS "availabilitySummary",
             (
               coalesce(avg(r.rating), 0) * 10
               + least(count(r.id), 20) * 0.5
               + least((SELECT count(*) FROM trader_credentials tc WHERE tc.trader_id = tp.user_id AND tc.status = 'verified' AND (tc.expires_at IS NULL OR tc.expires_at > now())), 5) * 3
               + CASE WHEN char_length(trim(tp.bio)) >= 100 THEN 8 ELSE 3 END
               + CASE WHEN cardinality(tp.photos) > 0 THEN 6 ELSE 0 END
               + CASE WHEN tp.service_selections <> '{}'::jsonb THEN 6 ELSE 0 END
               + CASE WHEN cardinality(tp.qualifications) > 0 THEN 5 ELSE 0 END
               + coalesce((
                   SELECT avg(CASE WHEN EXISTS (
                     SELECT 1 FROM messages m
                     WHERE m.conversation_id = c.id AND m.sender_id = tp.user_id
                   ) THEN 1.0 ELSE 0.0 END)
                   FROM conversations c
                   WHERE c.trader_id = tp.user_id
                 ), 1.0) * 10
               + CASE WHEN tp.subscription_tier = 'featured' THEN 8 ELSE 0 END
             )::float AS "rankingScore"
      FROM trader_profiles tp
      LEFT JOIN reviews r
        ON r.trader_id = tp.user_id AND r.verified_completion = true
      WHERE tp.subscription_tier <> 'free'
        AND tp.is_subscription_active = true
        AND NOT EXISTS (
          SELECT 1 FROM users u
          WHERE u.id = tp.user_id
            AND (
              coalesce(u.is_suspended, false) = true
              OR coalesce(u.is_deleted, false) = true
              OR coalesce(u.email, '') LIKE '%@buildpair.test'
            )
        )
        AND (
          ${trade}::text IS NULL
          OR ${trade} = ANY(CASE WHEN cardinality(tp.trade_categories) > 0 THEN tp.trade_categories ELSE ARRAY[tp.trade_category]::text[] END)
        )
      GROUP BY tp.id
      ORDER BY "rankingScore" DESC, coalesce(avg(r.rating), 0) DESC, tp.updated_at DESC
      LIMIT 100
    ` as unknown as DirectoryTrader[];

    const previewTraders = previewDataEnabled(request)
      ? demoTraders
          .map((trader) => {
            const category = canonicalTradeCategory(trader.tradeCategory);
            return {
              ...trader,
              tradeCategory: category,
              tradeCategories: [category],
              serviceSelections: { [category]: trader.subSkills },
              averageRating: 0,
              reviewCount: 0,
              verifiedCredentialCount: 0,
              availabilitySummary: null,
              rankingScore: 0,
              isPreview: true,
            };
          })
          .filter((trader) => !trade || trader.tradeCategories.includes(trade))
      : [];

    return Response.json([
      ...rows.map((trader) => ({ ...trader, isPreview: false })),
      ...previewTraders,
    ].slice(0, 100));
  } catch (error) {
    return jsonError(error);
  }
}
