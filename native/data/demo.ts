import type { Job } from '@/native/types';

export const demoJobs: Job[] = [
  { id: '1', customer_id: 'demo', title: 'Bathroom re-tile', category: 'Tiler', description: 'Remove old tiles and tile walls and floor.', budget_range: '£1,500–£2,500', property_type: 'House', status: 'quoted', created_at: new Date().toISOString() },
  { id: '2', customer_id: 'demo', title: 'Move kitchen sockets', category: 'Electrician', description: 'Relocate three sockets before kitchen fitting.', budget_range: '£250–£500', property_type: 'Flat', status: 'in_progress', created_at: new Date().toISOString() },
  { id: '3', customer_id: 'demo', title: 'Repair garden wall', category: 'Bricklayer', description: 'Rebuild damaged section of garden wall.', budget_range: '£600–£1,000', property_type: 'House', status: 'open', created_at: new Date().toISOString() },
];
