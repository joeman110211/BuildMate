import { GoogleGenAI } from '@google/genai';
import { z } from 'zod';
import { assertRateLimit } from '@/lib/rate-limit';
import { jsonError, requireRole } from '@/lib/server';

const schema = z.object({
  jobTitle: z.string().trim().min(3).max(160),
  jobDescription: z.string().trim().min(10).max(6000),
  tradeCategory: z.string().trim().min(2).max(120),
  labourDays: z.number().min(0.5).max(365).optional(),
  dayRate: z.number().int().min(0).max(500000).optional(),
  materialsEstimate: z.number().int().min(0).max(100000000).optional(),
  vatRegistered: z.boolean().default(false),
});

function fallback(input: z.infer<typeof schema>) {
  const labourCost = input.labourDays && input.dayRate ? Math.round(input.labourDays * input.dayRate) : 0;
  const materialsCost = input.materialsEstimate ?? 0;
  const subtotal = labourCost + materialsCost;
  const vatAmount = input.vatRegistered ? Math.round(subtotal * 0.2) : 0;
  return {
    laborCost,
    materialsCost,
    vatAmount,
    depositAmount: Math.round((subtotal + vatAmount) * 0.2),
    scope: `Complete the agreed ${input.tradeCategory.toLowerCase()} work described in the BuildPair job, including normal preparation and finishing required for the quoted scope.`,
    exclusions: 'Hidden defects, additional work discovered after opening up, and customer-requested changes are excluded unless agreed as a variation.',
    paymentTerms: '20% deposit on acceptance, balance by agreed milestones or on completion.',
    durationDays: input.labourDays ? Math.max(1, Math.ceil(input.labourDays)) : undefined,
    warrantyMonths: 12,
    notes: 'Final measurements, access, materials and site condition to be confirmed before work starts.',
    source: 'rules' as const,
  };
}

export async function POST(request: Request) {
  try {
    const trader = await requireRole(request, 'trader');
    await assertRateLimit(request, 'ai-quote-assistant', 20, 3600, trader.id);
    const input = schema.parse(await request.json());
    const base = fallback(input);
    const key = process.env.GEMINI_API_KEY;
    if (!key) return Response.json(base);

    const ai = new GoogleGenAI({ apiKey: key });
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: `You are BuildPair's UK trade quote drafting assistant. Draft commercial wording only, not legal advice. Never invent measurements, certifications, materials quantities or safety assurances.\n\nTrade: ${input.tradeCategory}\nJob: ${input.jobTitle}\nDescription: ${input.jobDescription}\nLabour days supplied: ${input.labourDays ?? 'not supplied'}\nDay rate in pennies: ${input.dayRate ?? 'not supplied'}\nMaterials estimate in pennies: ${input.materialsEstimate ?? 'not supplied'}\nVAT registered: ${input.vatRegistered}\n\nReturn ONLY JSON with keys scope, exclusions, paymentTerms, durationDays, warrantyMonths, notes. Scope should be concise but professional. Exclusions should protect against hidden defects and unagreed extras. Payment terms should be practical. Do not return monetary totals because BuildPair calculates those deterministically.`,
      config: { temperature: 0.2, maxOutputTokens: 700 },
    });
    const raw = response.text?.trim().replace(/^```json\s*/i, '').replace(/```$/i, '');
    if (!raw) return Response.json(base);
    const parsed = JSON.parse(raw) as Partial<typeof base>;
    return Response.json({
      ...base,
      scope: typeof parsed.scope === 'string' ? parsed.scope.slice(0, 4000) : base.scope,
      exclusions: typeof parsed.exclusions === 'string' ? parsed.exclusions.slice(0, 3000) : base.exclusions,
      paymentTerms: typeof parsed.paymentTerms === 'string' ? parsed.paymentTerms.slice(0, 2000) : base.paymentTerms,
      durationDays: typeof parsed.durationDays === 'number' ? Math.max(1, Math.min(3650, Math.round(parsed.durationDays))) : base.durationDays,
      warrantyMonths: typeof parsed.warrantyMonths === 'number' ? Math.max(0, Math.min(240, Math.round(parsed.warrantyMonths))) : base.warrantyMonths,
      notes: typeof parsed.notes === 'string' ? parsed.notes.slice(0, 3000) : base.notes,
      source: 'ai',
    });
  } catch (error) { return jsonError(error); }
}
