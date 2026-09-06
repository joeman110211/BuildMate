import type { TraderProfile } from '@/types';

const SEARCH_GROUPS = [
  ['tile', 'tiles', 'tiler', 'tilers', 'tiling', 'grout', 'grouting', 'ceramic', 'porcelain', 'splashback', 'wetroom', 'wet room', 'bathroom', 'kitchen'],
  ['bath', 'bathroom', 'bathrooms', 'shower', 'showers', 'wetroom', 'wet room', 'ensuite', 'toilet', 'wc', 'basin', 'sink', 'vanity', 'plumber', 'plumbing', 'tiler', 'tiling', 'bathroom fitting'],
  ['kitchen', 'kitchens', 'sink', 'worktop', 'worktops', 'cabinet', 'cabinets', 'units', 'splashback', 'joiner', 'carpenter', 'tiler', 'tiling', 'plumber', 'kitchen fitting'],
  ['plumber', 'plumbing', 'pipe', 'pipes', 'tap', 'taps', 'leak', 'leaks', 'sink', 'toilet', 'radiator', 'shower', 'bath', 'drain', 'water'],
  ['boiler', 'boilers', 'heating', 'gas', 'radiator', 'radiators', 'central heating', 'heat pump', 'underfloor heating'],
  ['electric', 'electrics', 'electrician', 'electrical', 'rewire', 'rewiring', 'socket', 'sockets', 'lighting', 'consumer unit', 'fuse box', 'ev charger'],
  ['builder', 'builders', 'building', 'renovation', 'renovations', 'refurbishment', 'extension', 'extensions', 'conversion', 'structural', 'open plan'],
  ['brick', 'bricks', 'bricklayer', 'bricklaying', 'blockwork', 'repointing', 'wall', 'walls', 'masonry'],
  ['plaster', 'plasterer', 'plastering', 'skim', 'skimming', 'render', 'rendering', 'dry lining'],
  ['dry lining', 'dryliner', 'dry liner', 'plasterboard', 'stud wall', 'stud walls', 'partition', 'partitioning', 'suspended ceiling', 'suspended ceilings'],
  ['paint', 'painter', 'painting', 'decorator', 'decorating', 'decoration', 'wallpaper', 'wallpapering'],
  ['carpenter', 'carpentry', 'joiner', 'joinery', 'woodwork', 'doors', 'stairs', 'skirting', 'cabinet', 'cabinetry'],
  ['roof', 'roofer', 'roofing', 'slate', 'slates', 'roof tile', 'roof tiles', 'flat roof', 'gutter', 'guttering', 'fascia', 'soffit', 'roof leak'],
  ['floor', 'floors', 'flooring', 'laminate', 'vinyl', 'lvt', 'wood floor', 'carpet', 'carpet fitting', 'floor tiles'],
  ['screed', 'screeding', 'floor screed', 'floor preparation', 'floor prep', 'self levelling', 'self leveling', 'latex screed', 'subfloor'],
  ['garden', 'gardener', 'gardening', 'landscape', 'landscaper', 'landscaping', 'lawn', 'patio', 'planting', 'artificial grass'],
  ['tree', 'trees', 'tree surgeon', 'tree surgery', 'stump', 'pruning', 'hedge'],
  ['fence', 'fencing', 'gate', 'gates', 'deck', 'decking', 'garden fence'],
  ['garage door', 'garage doors', 'roller door', 'roller doors', 'sectional door', 'automated gate', 'automated gates', 'gate motor'],
  ['blind', 'blinds', 'shutter', 'shutters', 'plantation shutters', 'awning', 'awnings', 'motorised blinds'],
  ['drive', 'driveway', 'driveways', 'paving', 'paver', 'patio', 'block paving', 'resin', 'tarmac', 'path'],
  ['groundwork', 'groundworks', 'foundation', 'foundations', 'excavation', 'concrete', 'footings', 'trench'],
  ['concrete', 'formwork', 'concrete slab', 'concrete slabs', 'reinforced concrete', 'concrete base', 'concrete repair'],
  ['piling', 'pile', 'mini piling', 'underpinning', 'foundation repair', 'foundation repairs', 'raft foundation'],
  ['drain', 'drains', 'drainage', 'blocked drain', 'sewer', 'soakaway', 'cctv drain survey'],
  ['septic', 'septic tank', 'septic tanks', 'cesspit', 'cesspits', 'sewage treatment', 'treatment plant', 'drainage field'],
  ['window', 'windows', 'door', 'doors', 'glazing', 'glazier', 'double glazing', 'upvc', 'bifold', 'bi-fold'],
  ['lock', 'locks', 'locksmith', 'locked out', 'security lock', 'door lock'],
  ['damp', 'damp proofing', 'mould', 'mold', 'rising damp', 'tanking', 'waterproofing'],
  ['basement', 'basements', 'cellar', 'cellars', 'basement conversion', 'cellar conversion', 'basement waterproofing'],
  ['insulation', 'insulate', 'loft insulation', 'wall insulation', 'soundproofing', 'thermal'],
  ['loft boarding', 'loft board', 'loft storage', 'loft ladder', 'loft hatch', 'raised loft boarding'],
  ['solar', 'solar panels', 'battery', 'battery storage', 'renewable', 'renewables', 'heat pump'],
  ['air conditioning', 'aircon', 'air con', 'ventilation', 'extractor', 'extractor fan', 'mvhr'],
  ['cctv', 'alarm', 'alarms', 'security', 'smart home', 'doorbell', 'video doorbell', 'access control'],
  ['handyman', 'odd jobs', 'small repairs', 'shelves', 'flat pack', 'assembly', 'picture hanging'],
  ['property maintenance', 'maintenance', 'reactive repairs', 'planned maintenance', 'landlord maintenance', 'building maintenance'],
  ['shopfitting', 'shop fitting', 'shopfit', 'fit out', 'fit-out', 'commercial fit out', 'office fit out', 'retail fit out', 'commercial refurbishment'],
  ['scaffold', 'scaffolder', 'scaffolding', 'access tower'],
  ['demolition', 'demolish', 'strip out', 'strip-out', 'site clearance'],
  ['asbestos', 'asbestos survey', 'asbestos surveys', 'asbestos removal', 'asbestos testing', 'asbestos sampling', 'garage roof asbestos'],
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
];

function normalise(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, ' ').replace(/\s+/g, ' ').trim();
}

function termsForQuery(query: string) {
  const raw = normalise(query);
  if (!raw) return [];

  const terms = new Set<string>([raw, ...raw.split(' ')]);
  for (const group of SEARCH_GROUPS) {
    const matchesGroup = group.some((term) => {
      const normalisedTerm = normalise(term);
      return raw.includes(normalisedTerm) || normalisedTerm.includes(raw);
    });
    if (matchesGroup) group.forEach((term) => terms.add(normalise(term)));
  }
  return [...terms].filter((term) => term.length > 1);
}

export function scoreTraderSearch(trader: TraderProfile, query: string) {
  const raw = normalise(query);
  if (!raw) return 1;

  const category = normalise(trader.tradeCategory);
  const business = normalise(trader.businessName);
  const skills = normalise(trader.subSkills.join(' '));
  const bio = normalise(trader.bio || '');
  const haystack = `${business} ${category} ${skills} ${bio}`;

  let score = 0;
  if (business.includes(raw)) score += 120;
  if (category === raw) score += 110;
  else if (category.includes(raw)) score += 90;
  if (skills.includes(raw)) score += 70;
  if (bio.includes(raw)) score += 20;

  for (const term of termsForQuery(query)) {
    if (!term || term === raw) continue;
    if (category.includes(term)) score += 32;
    if (skills.includes(term)) score += 22;
    if (business.includes(term)) score += 14;
    if (haystack.includes(term)) score += 4;
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
