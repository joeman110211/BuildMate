export type UserRole = 'customer' | 'trader';
export type SubscriptionTier = 'free' | 'basic' | 'featured';
export type JobStatus = 'open' | 'quoted' | 'in_progress' | 'completed' | 'cancelled';
export type QuoteStatus = 'pending' | 'accepted' | 'declined' | 'withdrawn';
export type TraderProfileTemplate = 'classic' | 'portfolio' | 'modern';
export type TraderProfileColour = 'burnt_orange' | 'navy' | 'forest' | 'charcoal' | 'burgundy';

export interface CurrentUser {
  id: string;
  email: string | null;
  phone: string | null;
  role: UserRole | null;
  isAdmin: boolean;
  isSuspended: boolean;
  createdAt: string;
}

export interface BeforeAfterProject {
  before: string;
  after: string;
  caption?: string;
}

export interface TraderProfile {
  id: string;
  userId: string;
  businessName: string;
  tradeCategory: string;
  subSkills: string[];
  bio: string;
  radiusMiles: number;
  postcode?: string | null;
  locationLabel?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  qualifications?: string[];
  externalLinks: Record<string, string>;
  photos: string[];
  template?: TraderProfileTemplate;
  colourTheme?: TraderProfileColour;
  coverPhotoUrl?: string | null;
  profileImageUrl?: string | null;
  logoUrl?: string | null;
  yearsExperience?: number;
  yearEstablished?: number | null;
  serviceAreas?: string[];
  beforeAfterProjects?: BeforeAfterProject[];
  createdAt?: string;
  subscriptionTier: SubscriptionTier;
  isSubscriptionActive: boolean;
  trialEndsAt?: string | null;
  averageRating: number;
  reviewCount: number;
  stripeAccountId?: string | null;
}

export interface Job {
  id: string;
  customerId: string;
  targetTraderId: string | null;
  title: string;
  category: string;
  propertyType: string;
  postcode: string | null;
  locationLabel: string | null;
  latitude?: number | null;
  longitude?: number | null;
  urgency: string;
  description: string;
  aiGeneratedSpec: string | null;
  budgetRange: string;
  photos: string[];
  status: JobStatus;
  acceptedQuoteId?: string | null;
  createdAt: string;
  quotes?: Quote[];
}

export interface Quote {
  id: string;
  jobId: string;
  traderId: string;
  businessName?: string;
  laborCost: number;
  materialsCost: number;
  vatAmount: number;
  depositAmount: number;
  totalAmount: number;
  paymentTerms: string;
  notes?: string | null;
  validUntil?: string | null;
  status: QuoteStatus;
}
