export const TRADE_CATEGORIES = [
  'Tiling',
  'Bathrooms',
  'Kitchens',
  'Plumbing',
  'Heating & Gas',
  'Electrical',
  'Renewables & EV',
  'Building & Extensions',
  'Conversions',
  'Brickwork & Masonry',
  'Carpentry & Joinery',
  'Plastering, Rendering & Dry Lining',
  'Painting & Decorating',
  'Roofing & Roofline',
  'Windows, Doors & Glazing',
  'Flooring & Screeding',
  'Landscaping & Gardening',
  'Tree Surgery',
  'Fencing & Decking',
  'Driveways, Paving & Groundworks',
  'Drainage & Sewage',
  'Damp Proofing & Insulation',
  'Cladding & Exterior Finishes',
  'Chimneys & Fireplaces',
  'Air Conditioning & Ventilation',
  'Security, Smart Home & Locksmiths',
  'Handyman & Property Maintenance',
  'Commercial Fit-Out & Access',
  'Demolition, Asbestos & Waste',
  'Cleaning, Exterior Care & Pest Control',
  'Garden Buildings & Leisure',
  'Accessibility Adaptations',
  'Professional Building Services',
] as const;

export type TradeCategory = (typeof TRADE_CATEGORIES)[number];

export const SUB_SKILLS: Record<TradeCategory, string[]> = {
  Tiling: [
    'Bathroom tiling', 'Kitchen tiling', 'Wall tiling', 'Floor tiling', 'Wet rooms', 'Mosaic tiling',
    'Large-format tiles', 'Porcelain', 'Ceramic', 'Natural stone', 'Outdoor tiling', 'Splashbacks',
    'Tile repairs', 'Regrouting', 'Waterproofing & tanking', 'Commercial tiling',
  ],
  Bathrooms: [
    'Full bathroom refits', 'Bathroom design', 'Showers', 'Wet rooms', 'Baths', 'Toilets', 'Basins',
    'Vanity units', 'Bathroom furniture', 'Bathroom tiling', 'Waterproofing & tanking', 'Accessible bathrooms',
  ],
  Kitchens: [
    'Full kitchen fitting', 'Kitchen renovations', 'Cabinet fitting', 'Worktops', 'Kitchen sinks',
    'Splashbacks', 'Appliance installation', 'Kitchen islands', 'Flat-pack kitchens', 'Bespoke kitchens',
  ],
  Plumbing: [
    'Leaks', 'Pipework', 'Taps', 'Sinks', 'Toilets', 'Showers', 'Baths', 'Radiators', 'Water tanks',
    'Outside taps', 'Emergency plumbing', 'Bathroom plumbing', 'Kitchen plumbing',
  ],
  'Heating & Gas': [
    'Boiler installation', 'Boiler servicing', 'Boiler repairs', 'Central heating', 'Radiators',
    'Gas appliances', 'Gas safety checks', 'Underfloor heating', 'Heating controls', 'Power flushing',
  ],
  Electrical: [
    'Domestic electrics', 'Full rewires', 'Partial rewires', 'Sockets', 'Lighting', 'Consumer units',
    'EICR testing', 'Fault finding', 'Outdoor electrics', 'Smoke alarms', 'Commercial electrics',
  ],
  'Renewables & EV': [
    'Home EV chargers', 'Commercial EV chargers', 'Solar panels', 'Battery storage', 'Heat pumps',
    'Solar servicing', 'Load management', 'Renewable energy systems',
  ],
  'Building & Extensions': [
    'General building', 'Single-storey extensions', 'Double-storey extensions', 'Rear extensions',
    'Side-return extensions', 'Wraparound extensions', 'Structural alterations', 'Open-plan conversions',
    'Property refurbishment', 'Renovations', 'Building repairs',
  ],
  Conversions: [
    'Loft conversions', 'Dormers', 'Hip-to-gable', 'Velux conversions', 'Garage conversions',
    'Basement conversions', 'Cellar conversions', 'Home office conversions', 'Annexes', 'Loft boarding & storage',
  ],
  'Brickwork & Masonry': [
    'Bricklaying', 'Blockwork', 'Garden walls', 'Repointing', 'Brick repairs', 'Stone walls',
    'Stone repairs', 'Natural stone', 'Chimney masonry', 'Restoration masonry',
  ],
  'Carpentry & Joinery': [
    'First fix carpentry', 'Second fix carpentry', 'Internal doors', 'External doors', 'Skirting & architraves',
    'Stairs', 'Bespoke cabinetry', 'Built-in storage', 'Wardrobes', 'Timber framing', 'Kitchen carpentry',
  ],
  'Plastering, Rendering & Dry Lining': [
    'Skimming', 'Plaster repairs', 'Ceilings', 'External rendering', 'Internal rendering', 'Plasterboard',
    'Stud walls', 'Partition walls', 'Dot and dab', 'Suspended ceilings', 'Office partitions',
  ],
  'Painting & Decorating': [
    'Interior painting', 'Exterior painting', 'Wallpapering', 'Woodwork painting', 'Feature walls',
    'Spray painting', 'Commercial decorating', 'Wallpaper removal', 'Surface preparation',
  ],
  'Roofing & Roofline': [
    'Pitched roofs', 'Flat roofs', 'Roof repairs', 'Roof leaks', 'Leadwork', 'Roof tiles', 'Slates',
    'Guttering', 'Downpipes', 'Fascias', 'Soffits', 'Roof cleaning',
  ],
  'Windows, Doors & Glazing': [
    'Windows', 'Front doors', 'French doors', 'Bi-fold doors', 'UPVC', 'Composite doors', 'Double glazing',
    'Glass replacement', 'Mirrors', 'Shopfront glass', 'Emergency glazing', 'Garage doors', 'Automated gates',
  ],
  'Flooring & Screeding': [
    'Laminate flooring', 'LVT', 'Vinyl flooring', 'Wood flooring', 'Carpet fitting', 'Carpet tiles',
    'Floor repairs', 'Floor preparation', 'Floor screeding', 'Self-levelling compound', 'Latex screed', 'DPM installation',
  ],
  'Landscaping & Gardening': [
    'Garden design', 'Garden maintenance', 'Lawns', 'Turfing', 'Artificial grass', 'Planting', 'Patios',
    'Raised beds', 'Garden clearance', 'Irrigation', 'Garden drainage',
  ],
  'Tree Surgery': [
    'Tree removal', 'Tree pruning', 'Crown reduction', 'Stump grinding', 'Hedge reduction',
    'Hedge trimming', 'Emergency tree work', 'Tree surveys',
  ],
  'Fencing & Decking': [
    'Timber fencing', 'Composite fencing', 'Fence repairs', 'Garden gates', 'Timber decking',
    'Composite decking', 'Balustrades', 'Privacy screening',
  ],
  'Driveways, Paving & Groundworks': [
    'Block paving', 'Tarmac', 'Resin driveways', 'Patios', 'Paths', 'Paving repairs', 'Excavation',
    'Foundations', 'Footings', 'Concrete slabs', 'Concrete bases', 'Site preparation', 'Mini piling', 'Underpinning',
  ],
  'Drainage & Sewage': [
    'Blocked drains', 'Drain repairs', 'CCTV drain surveys', 'Drain replacement', 'Soakaways',
    'Septic tanks', 'Treatment plants', 'Cesspits', 'Drainage fields', 'Septic servicing',
  ],
  'Damp Proofing & Insulation': [
    'Rising damp', 'Penetrating damp', 'Tanking', 'Mould treatment', 'Basement waterproofing',
    'Loft insulation', 'Wall insulation', 'Floor insulation', 'Sound insulation', 'Thermal upgrades',
  ],
  'Cladding & Exterior Finishes': [
    'External cladding', 'Timber cladding', 'Composite cladding', 'Cladding repairs', 'Render finishes',
    'Exterior panels', 'Weatherproofing',
  ],
  'Chimneys & Fireplaces': [
    'Chimney repairs', 'Chimney sweeping', 'Fireplace installation', 'Flue work', 'Wood-burning stoves',
    'Chimney pots', 'Chimney removal',
  ],
  'Air Conditioning & Ventilation': [
    'Air conditioning installation', 'Air conditioning servicing', 'MVHR', 'Extractor fans',
    'Domestic ventilation', 'Commercial ventilation', 'Ductwork',
  ],
  'Security, Smart Home & Locksmiths': [
    'CCTV', 'Burglar alarms', 'Smart lighting', 'Video doorbells', 'Access control', 'Home automation',
    'Lock changes', 'Emergency entry', 'UPVC locks', 'Security upgrades', 'Automated gates',
  ],
  'Handyman & Property Maintenance': [
    'Small repairs', 'Shelves', 'Flat-pack assembly', 'Curtain poles', 'Picture hanging', 'Odd jobs',
    'Reactive maintenance', 'Planned maintenance', 'Landlord maintenance', 'Minor building repairs', 'Property inspections',
  ],
  'Commercial Fit-Out & Access': [
    'Retail fit-outs', 'Office fit-outs', 'Shopfitting', 'Commercial refurbishments', 'Office partitions',
    'Suspended ceilings', 'Domestic scaffolds', 'Commercial scaffolds', 'Access towers', 'Roof scaffolds',
  ],
  'Demolition, Asbestos & Waste': [
    'Internal strip-out', 'Outbuilding demolition', 'Wall removal', 'Site clearance', 'Asbestos surveys',
    'Asbestos sampling', 'Asbestos removal', 'Garage roof removal', 'Builders waste', 'House clearance', 'Garden waste',
  ],
  'Cleaning, Exterior Care & Pest Control': [
    'End-of-build cleaning', 'Deep cleaning', 'Carpet cleaning', 'Window cleaning', 'Gutter cleaning',
    'Pressure washing', 'Driveway cleaning', 'Patio cleaning', 'Rodent control', 'Wasp removal', 'Insect control', 'Bird control',
  ],
  'Garden Buildings & Leisure': [
    'Garden offices', 'Garden rooms', 'Summerhouses', 'Sheds', 'Studios', 'Conservatories', 'Orangeries',
    'Swimming pools', 'Hot tubs', 'Pool maintenance', 'Outdoor kitchens',
  ],
  'Accessibility Adaptations': [
    'Grab rails', 'Access ramps', 'Accessible bathrooms', 'Door widening', 'Mobility adaptations',
    'Level-access showers', 'Accessible kitchens',
  ],
  'Professional Building Services': [
    'Planning drawings', 'Building regulations drawings', 'Planning applications', 'Architectural design',
    'Structural calculations', 'Steel beam design', 'Foundation design', 'Structural surveys',
    'Building surveys', 'Defect inspections', 'Snagging', 'Party wall', 'Condition reports',
  ],
};

export const PROPERTY_TYPES = ['House', 'Flat', 'Bungalow', 'Commercial', 'Other'] as const;
export const URGENCY_OPTIONS = ['Flexible', 'Within 1 month', 'Within 2 weeks', 'Urgent'] as const;
export const BUDGET_OPTIONS = ['Not sure / discuss', 'Under £500', '£500–£1,500', '£1,500–£5,000', '£5,000–£15,000', '£15,000+'] as const;
export const RADIUS_OPTIONS = ['5', '10', '15', '25', '50', '75'] as const;
export const TRADER_BIO_MIN_LENGTH = 50;

// Database values remain free/basic/featured for compatibility. Product names are Starter/Plus/Pro.
export const SUBSCRIPTION_TIERS = {
  free: {
    name: 'Starter Free',
    shortName: 'Starter',
    price: '£0',
    categoryLimit: 2,
    monthlyMarketplaceQuotes: 0,
    features: ['Full profile setup', 'Browse marketplace jobs', 'External profile sharing'],
  },
  basic: {
    name: 'BuildPair Plus',
    shortName: 'Plus',
    price: '£19.99/mo',
    categoryLimit: 4,
    monthlyMarketplaceQuotes: 15,
    features: ['Public searchable profile', '15 marketplace quotes per month', 'Direct quote requests', 'AI-assisted messaging'],
  },
  featured: {
    name: 'BuildPair Pro',
    shortName: 'Pro',
    price: '£29.99/mo',
    categoryLimit: 6,
    monthlyMarketplaceQuotes: 35,
    features: ['Everything in Plus', '35 marketplace quotes per month', 'Priority search placement', 'Advanced analytics', 'Priority new-job alerts'],
  },
} as const;
