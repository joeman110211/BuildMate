export type UserRole = 'customer' | 'trader';
export type SubscriptionTier = 'free' | 'basic' | 'featured';
export type JobStatus = 'open' | 'quoted' | 'in_progress' | 'completed' | 'cancelled';
export type QuoteStatus = 'pending' | 'accepted' | 'declined' | 'withdrawn';

export interface CurrentUser {
  id: string;
  email: string | null;
  phone: string | null;
  role: UserRole | null;
  isAdmin: boolean;
  isSuspended: boolean;
  createdAt: string;
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
  externalLinks: Record<string, string>;
  photos: string[];
  subscriptionTier: SubscriptionTier;
  isSubscriptionActive: boolean;
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
  status: QuoteStatus;
}
