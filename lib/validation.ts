import { z } from 'zod';
import { BUDGET_OPTIONS, PROPERTY_TYPES, TRADE_CATEGORIES, URGENCY_OPTIONS } from '@/constants/options';

export const roleSchema = z.object({ role: z.enum(['customer', 'trader']) });

export const traderProfileSchema = z.object({
  businessName: z.string().trim().min(2).max(100),
  tradeCategory: z.enum(TRADE_CATEGORIES),
  subSkills: z.array(z.string().min(1)).max(12),
  bio: z.string().trim().min(30).max(1500),
  radiusMiles: z.number().int().min(1).max(150),
  qualifications: z.array(z.string().trim().min(2)).max(20),
  externalLinks: z.record(z.string(), z.url().or(z.literal(''))),
  photos: z.array(z.url()).max(20),
  selfCertified: z.literal(true),
});

export const jobSchema = z.object({
  targetTraderId: z.string().min(1).nullable().optional(),
  title: z.string().trim().min(5).max(120),
  category: z.enum(TRADE_CATEGORIES),
  propertyType: z.enum(PROPERTY_TYPES),
  urgency: z.enum(URGENCY_OPTIONS),
  description: z.string().trim().min(30).max(5000),
  aiGeneratedSpec: z.string().trim().max(5000).nullable().optional(),
  budgetRange: z.enum(BUDGET_OPTIONS),
  photos: z.array(z.url()).max(8).default([]),
});

export const quoteSchema = z.object({
  jobId: z.uuid(),
  laborCost: z.number().int().nonnegative(),
  materialsCost: z.number().int().nonnegative(),
  vatAmount: z.number().int().nonnegative(),
  depositAmount: z.number().int().nonnegative(),
  paymentTerms: z.string().trim().min(5).max(1000),
  notes: z.string().trim().max(2000).optional(),
  validUntil: z.iso.datetime().optional(),
}).superRefine((data, ctx) => {
  const total = data.laborCost + data.materialsCost + data.vatAmount;
  if (data.depositAmount > total) ctx.addIssue({ code: 'custom', path: ['depositAmount'], message: 'Deposit cannot exceed total' });
});

export const reviewSchema = z.object({
  jobId: z.uuid(),
  traderId: z.string().min(1),
  rating: z.number().int().min(1).max(5),
  comment: z.string().trim().min(10).max(2000),
});

export const aiSpecSchema = z.object({
  category: z.string().min(2).max(80),
  propertyType: z.string().min(2).max(80),
  answers: z.array(z.object({ question: z.string().max(200), answer: z.string().max(1000) })).min(3).max(6),
});

export const invoiceSchema = z.object({
  invoiceNumber: z.string().trim().min(1).max(40),
  customerId: z.string().optional(),
  customerName: z.string().trim().min(2).max(100),
  customerEmail: z.email(),
  jobId: z.uuid().optional(),
  items: z.array(z.object({
    description: z.string().trim().min(2).max(300),
    quantity: z.number().positive().max(10000),
    unitPrice: z.number().int().nonnegative(),
  })).min(1).max(100),
  vatAmount: z.number().int().nonnegative(),
  depositAmount: z.number().int().nonnegative(),
  notes: z.string().max(2000).optional(),
  dueAt: z.iso.datetime().optional(),
  sendNow: z.boolean().default(false),
});
