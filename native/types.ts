export type UserRole = 'customer' | 'trader';

export interface Profile {
  id: string;
  user_id: string;
  role: UserRole;
  email: string;
  full_name: string;
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
  status: 'open' | 'quoted' | 'in_progress' | 'completed';
  created_at: string;
}
