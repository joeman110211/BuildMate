import type { TraderProfile } from '@/types';

const SEARCH_GROUPS = [
  ['tile', 'tiles', 'tiler', 'tilers', 'tiling', 'grout', 'grouting', 'ceramic', 'porcelain', 'splashback', 'wetroom', 'wet room', 'bathroom', 'kitchen'],
  ['bath', 'bathroom', 'bathrooms', 'shower', 'showers', 'wetroom', 'wet room', 'ensuite', 'toilet', 'wc', 'basin', 'sink', 'vanity', 'plumber', 'plumbing', 'tiler', 'tiling', 'bathroom fitting'],
  ['kitchen', 'kitchens', 'sink', 'worktop', 'worktops', 'cabinet', 'cabinets', 'units', 'splashback', 'joiner', 'carpenter', 'tiler', 'tiling', 'plumber', 'kitchen fitting'],
  ['plumber', 'plumbing', 'pipe', 'pipes', 'tap', 'taps', 'leak', 'leaks', 'sink', 'toilet', 'radiator', 'shower', 'bath', 'drain', 'water'],
  ['boiler', 'boilers', 'heating', 'gas', 'radiator', 'radiators', 'central heating', 'heat pump', 'underfloor heating', 'hot water'],
  ['electric', 'electrics', 'electrician', 'electrical', 'rewire', 'rewiring', 'socket', 'sockets', 'lighting', 'consumer unit', 'fuse box', 'ev charger'],
  ['builder', 'builders', 'building', 'renovation', 'renovations', 'refurbishment', 'extension', 'extensions', 'conversion', 'structural', 'open plan'],
  ['brick', 'bricks', 'bricklayer', 'bricklaying', 'blockwork', 'repointing', 'wall', 'walls', 'masonry'],
  ['plaster', 'plasterer', 'plastering', 'skim', 'skimming', 'render', 'rendering', 'dry lining'],
  ['paint', 'painter', 'painting', 'decorator', 'decorating', 'decoration', 'wallpaper', 'wallpapering'],
  ['carpenter', 'carpentry', 'joiner', 'joinery', 'woodwork', 'doors', 'stairs', 'skirting', 'cabinet', 'cabinetry'],
  ['roof', 'roofer', 'roofing', 'slate', 'slates', 'roof tile', 'roof tiles', 'flat roof', 'gutter', 'guttering', 'fascia', 'soffit', 'roof leak'],
  ['floor', 'floors', 'flooring', 'laminate', 'vinyl', 'lvt', 'wood floor', 'carpet', 'carpet fitting', 'floor tiles'],
  ['garden', 'gardener', 'gardening', 'landscape', 'landscaper', 'landscaping', 'lawn', 'patio', 'planting', 'artificial grass'],
  ['tree', 'trees', 'tree surgeon', 'tree surgery', 'stump', 'pruning', 'hedge'],
  ['fence', 'fencing', 'gate', 'gates', 'deck', 'decking', 'garden fence'],
  ['drive', 'driveway', 'driveways', 'paving', 'paver', 'patio', 'block paving', 'resin', 'tarmac', 'path'],
  ['groundwork', 'groundworks', 'foundation', 'foundations', 'excavation', 'concrete', 'footings', 'trench'],
  ['drain', 'drains', 'drainage', 'blocked drain', 'sewer', 'soakaway', 'cctv drain survey'],
  ['window', 'windows', 'door', 'doors', 'glazing', 'glazier', 'double glazing', 'upvc', 'bifold', 'bi-fold'],
  ['lock', 'locks', 'locksmith', 'locked out', 'security lock', 'door lock'],
  ['damp', 'damp proofing', 'mould', 'mold', 'rising damp', 'tanking', 'waterproofing'],
  ['insulation', 'insulate', 'loft insulation', 'wall insulation', 'soundproofing', 'thermal'],
  ['solar', 'solar panels', 'battery', 'battery storage', 'renewable', 'renewables', 'heat pump'],
  ['air conditioning', 'aircon', 'air con', 'ventilation', 'extractor', 'extractor fan', 'mvhr'],
  ['cctv', 'alarm', 'alarms', 'security', 'smart home', 'doorbell', 'video doorbell', 'access control'],
  ['handyman', 'odd jobs', 'small repairs', 'shelves', 'flat pack', 'assembly', 'picture hanging'],
  ['scaffold', 'scaffolder', 'scaffolding', 'access tower'],
  ['demolition', 'demolish', 'strip out', 'strip-out', 'site clearance'],
  ['waste', 'rubbish', 'clearance', 'builders waste', 'house clearance', 'skip'],
  ['pressure wash', 'pressure washing', 'jet wash', 'jet washing', 'exterior cleaning', 'driveway cleaning'],
  ['clean', 'cleaner', 'cleaning', 'deep clean', 'builders clean', 'window cleaning', 'carpet cleaning'],
  ['pest', 'pest control', 'rats', 'mice', 'wasps', 'insects', 'rodents'],
  ['garden room', 'garden rooms', 'outbuilding', 'outbuildings', 'summerhouse', 'shed', 'garden office'],
  ['conservatory', 'conservatories', 'orangery', 'orangeries'],
  ['pool', 'swimming pool', 'hot tub', 'spa', 'pool maintenance'],
  ['accessible', 'accessibility', 'disabled adaptation', 'adaptations', 'grab rail', 'ramp', 'mobility'],
  ['metalwork', 'welding', 'welder', 'steel', 'railings', 'balustrade'],
  ['architect', 'architecture', 'architectural', 'planning', 'planning drawings', 'planning application', 'building regulations'],
  ['structural engineer', 'structural engineering', 'calculations', 'steel beam', 'rsj', 'load bearing wall'],
  ['surveyor', 'surveying', 'building survey', 'snagging', 'party wall', 'condition report'],
  ['screed', 'screeding', 'floor screed', 'levelling compound', 'self levelling', 'floor preparation'],
  ['dry lining', 'dryliner', 'dryliner', 'plasterboard', 'stud wall', 'partition wall', 'suspended ceiling'],
  ['basement', 'cellar', 'basement conversion', 'cellar conversion', 'basement waterproofing', 'tanking'],
  ['concrete', 'formwork', 'reinforced concrete', 'concrete slab', 'concrete base', 'shuttering'],
  ['piling', 'piles', 'underpinning', 'mini piling', 'foundation piles', 'foundation repair'],
  ['garage door', 'garage doors', 'roller door', 'sectional door', 'garage door repair', 'garage door opener'],
  ['blind', 'blinds', 'shutter', 'shutters', 'plantation shutters', 'roller blinds'],
  ['property maintenance', 'maintenance', 'property repair', 'repairs', 'landlord maintenance', 'reactive maintenance'],
  ['commercial fit out', 'shop fit out', 'office fit out', 'shopfitting', 'shop fitter', 'office refurbishment'],
  ['septic tank', 'septic tanks', 'treatment plant', 'cesspit', 'sewage treatment', 'septic drainage'],
  ['asbestos', 'asbestos removal', 'asbestos survey', 'asbestos testing', 'asbestos disposal'],
  ['loft boarding', 'loft boards', 'loft storage', 'loft ladder', 'loft hatch', 'raised loft floor'],
];

const GROUP_ANCHOR_LIMIT = 6;

function normalise(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, ' ').replace(/\s+/g, ' ').trim();
}

function containsTerm(value: string, term: string) {
  return Boolean(term) && value.includes(term);
}

function matchedGroups(query: string) {
  const raw = normalise(query);
  if (!raw) return [];

  return SEARCH_GROUPS.filter((group) => group.slice(0, GROUP_ANCHOR_LIMIT).some((term) => {
    const anchor = normalise(term);
    return anchor.length > 1 && (raw === anchor || raw.includes(anchor) || anchor.includes(raw));
  }));
}

function bestFieldMatch(value: string, terms: string[], score: number) {
  return terms.some((term) => containsTerm(value, term)) ? score : 0;
}

export function scoreTraderSearch(trader: TraderProfile, query: string) {
  const raw = normalise(query);
  if (!raw) return 1;

  const category = normalise(trader.tradeCategory);
  const business = normalise(trader.businessName);
  const skills = normalise(trader.subSkills.join(' '));
  const bio = normalise(trader.bio || '');

  let score = 0;

  // Literal user wording is strongest. This prevents a related trade from
  // outranking the trade the user actually typed.
  if (business.includes(raw)) score += 150;
  if (category === raw) score += 145;
  else if (category.includes(raw) || raw.includes(category)) score += 115;
  if (skills.includes(raw)) score += 90;
  if (bio.includes(raw)) score += 18;

  for (const group of matchedGroups(query)) {
    const primaryTerms = group.slice(0, GROUP_ANCHOR_LIMIT).map(normalise);
    const relatedTerms = group.slice(GROUP_ANCHOR_LIMIT).map(normalise);

    // Primary aliases describe the core trade/problem represented by the group.
    // Related terms broaden results without being allowed to dominate ranking.
    score += bestFieldMatch(category, primaryTerms, 95);
    score += bestFieldMatch(skills, primaryTerms, 58);
    score += bestFieldMatch(business, primaryTerms, 38);
    score += bestFieldMatch(bio, primaryTerms, 8);

    score += bestFieldMatch(category, relatedTerms, 28);
    score += bestFieldMatch(skills, relatedTerms, 20);
    score += bestFieldMatch(business, relatedTerms, 12);
    score += bestFieldMatch(bio, relatedTerms, 3);
  }

  return score;
}

export function searchTraders(traders: TraderProfile[], query: string) {
  if (!query.trim()) return traders;
  return traders
    .map((trader) => ({ trader, score: scoreTraderSearch(trader, query) }))
    .filter((result) => result.score > 0)
    .sort((a, b) => b.score - a.score || b.trader.averageRating - a.trader.averageRating)
    .map((result) => result.trader);
}
