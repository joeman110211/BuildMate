import { sql } from 'drizzle-orm';
import { integer, jsonb, pgTable, text, timestamp } from 'drizzle-orm/pg-core';
import { users } from './schema';

export type BeforeAfterProject = {
  before: string;
  after: string;
  caption?: string;
};

export const traderProfileShowcase = pgTable('trader_profile_showcase', {
  userId: text('user_id').primaryKey().references(() => users.id, { onDelete: 'cascade' }),
  template: text('template').notNull().default('classic'),
  colourTheme: text('colour_theme').notNull().default('burnt_orange'),
  coverPhotoUrl: text('cover_photo_url'),
  profileImageUrl: text('profile_image_url'),
  logoUrl: text('logo_url'),
  yearsExperience: integer('years_experience').notNull().default(0),
  yearEstablished: integer('year_established'),
  serviceAreas: text('service_areas').array().notNull().default(sql`ARRAY[]::text[]`),
  beforeAfterProjects: jsonb('before_after_projects').$type<BeforeAfterProject[]>().notNull().default([]),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});
