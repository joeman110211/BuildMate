export const TRADE_CATEGORIES = [
  'Tiling',
  'Plastering',
  'Electrical',
  'Plumbing',
  'Joinery',
  'Roofing',
  'General Building',
] as const;

export const SUB_SKILLS: Record<(typeof TRADE_CATEGORIES)[number], string[]> = {
  Tiling: ['Bathrooms', 'Wet rooms', 'Floors', 'Natural stone', 'Exterior'],
  Plastering: ['Skimming', 'Rendering', 'Dry lining', 'Repair work'],
  Electrical: ['Domestic', 'Commercial', 'Rewires', 'EV chargers', 'Testing'],
  Plumbing: ['Bathrooms', 'Boilers', 'Heating', 'Leaks', 'Emergency callout'],
  Joinery: ['First fix', 'Second fix', 'Cabinetry', 'Flooring', 'Doors'],
  Roofing: ['Pitched', 'Flat', 'Leadwork', 'Repairs', 'Guttering'],
  'General Building': ['Extensions', 'Renovations', 'Brickwork', 'Groundworks'],
};

export const PROPERTY_TYPES = ['House', 'Flat', 'Bungalow', 'Commercial', 'Other'] as const;
export const URGENCY_OPTIONS = ['Flexible', 'Within 1 month', 'Within 2 weeks', 'Urgent'] as const;
export const BUDGET_OPTIONS = ['Under £500', '£500–£1,500', '£1,500–£5,000', '£5,000–£15,000', '£15,000+'] as const;
export const RADIUS_OPTIONS = ['5', '10', '15', '25', '50', '75'] as const;
export const TRADER_BIO_MIN_LENGTH = 50;

export const SUBSCRIPTION_TIERS = {
  free: { name: 'Free', price: '£0', features: ['Shareable public profile', 'Gallery and reviews'] },
  basic: { name: 'Basic Direct Leads', price: '£19.99/mo', features: ['Direct contact form', 'Receive customer leads'] },
  featured: { name: 'Featured Search', price: '£29.99/mo', features: ['Featured directory position', 'Unlimited direct quotes', 'Everything in Basic'] },
} as const;
