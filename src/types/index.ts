export type UserRole = "customer" | "trader";
export type JobStatus = "open" | "quoted" | "in_progress" | "completed";
export type QuoteStatus = "pending" | "accepted" | "declined";
export type SubscriptionTier = "standard" | "premium";

export interface Profile {
  id: string;
  user_id: string;
  role: UserRole;
  email: string;
  full_name: string;
  created_at: string;
}

export interface TraderProfile {
  id: string;
  user_id: string;
  business_name: string;
  trade_category: string;
  bio: string | null;
  radius_miles: number;
  external_links: Record<string, string>;
  photos: string[];
  subscription_status: boolean;
  subscription_tier: SubscriptionTier;
  stripe_customer_id: string | null;
  created_at: string;
}

export interface Job {
  id: string;
  customer_id: string;
  title: string;
  category: string;
  description: string | null;
  budget_range: string | null;
  property_type: string | null;
  status: JobStatus;
  created_at: string;
}

export interface Quote {
  id: string;
  job_id: string;
  trader_id: string;
  labor_cost: number;
  materials_cost: number;
  total_amount: number;
  payment_terms: string | null;
  status: QuoteStatus;
  created_at: string;
}

export interface Review {
  id: string;
  job_id: string;
  customer_id: string;
  trader_id: string;
  rating: number;
  comment: string | null;
  verified_completion: boolean;
  created_at: string;
}

export interface QuoteWithTrader extends Quote {
  trader_profile?: TraderProfile;
  trader?: Profile;
}

export interface JobWithQuotes extends Job {
  quotes?: QuoteWithTrader[];
  customer?: Profile;
}

export interface ReviewWithCustomer extends Review {
  customer?: Profile;
}
