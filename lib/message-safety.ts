export type MessageRiskLevel = 'none' | 'low' | 'medium' | 'high' | 'severe';

export type MessageSafetyResult = {
  riskLevel: MessageRiskLevel;
  reason: string;
  reportReason: 'fraud' | 'abuse_or_harassment' | 'unsafe_content' | 'other';
};

const SEVERE_THREATS = [
  /\bi(?:'|’)ll\s+(?:kill|stab|shoot|hurt)\s+you\b/i,
  /\bi(?:'|’)m\s+going\s+to\s+(?:kill|stab|shoot|hurt)\s+you\b/i,
  /\bi\s+will\s+(?:kill|stab|shoot|hurt)\s+you\b/i,
  /\bburn\s+(?:your|the)\s+(?:house|home|van|car)\b/i,
  /\bsmash\s+your\s+(?:face|head)\b/i,
  /\byou(?:'|’)re\s+dead\b/i,
];

const SCAM_PRESSURE = [
  /\b(?:avoid|skip|bypass)\s+(?:the\s+)?buildpair\s+(?:fee|fees|payment|payments)\b/i,
  /\b(?:pay|send)\s+(?:me\s+)?(?:by\s+)?(?:gift\s*card|crypto|bitcoin)\b/i,
  /\bcancel\s+(?:the\s+)?buildpair\s+(?:job|booking|payment).*(?:cash|bank\s+transfer)\b/i,
  /\b(?:take|move)\s+(?:this|the\s+job)\s+off\s+buildpair\b/i,
  /\bdon(?:'|’)t\s+(?:pay|book|message)\s+(?:through|on)\s+buildpair\b/i,
];

const TARGETED_ABUSE = [
  /\bfuck\s+you\b/i,
  /\byou(?:'|’)?re\s+(?:a\s+)?(?:fucking\s+)?(?:idiot|moron|scumbag|liar)\b/i,
  /\byou\s+(?:stupid|useless|pathetic)\s+(?:idiot|moron|bastard|prick)\b/i,
  /\bpiss\s+off\b/i,
];

const HARASSING_PRESSURE = [
  /\bi\s+know\s+where\s+you\s+live\b/i,
  /\bi(?:'|’)ll\s+come\s+(?:to|round\s+to)\s+your\s+(?:house|home)\b/i,
  /\byou\s+better\s+(?:answer|reply|pay)\b/i,
];

export function classifyMessageSafety(body: string): MessageSafetyResult {
  const text = body.trim();
  if (SEVERE_THREATS.some((pattern) => pattern.test(text))) {
    return { riskLevel: 'severe', reason: 'Possible explicit threat of violence', reportReason: 'abuse_or_harassment' };
  }
  if (SCAM_PRESSURE.some((pattern) => pattern.test(text))) {
    return { riskLevel: 'high', reason: 'Possible scam or pressure to bypass BuildPair safeguards', reportReason: 'fraud' };
  }
  if (HARASSING_PRESSURE.some((pattern) => pattern.test(text))) {
    return { riskLevel: 'high', reason: 'Possible intimidation or harassing pressure', reportReason: 'abuse_or_harassment' };
  }
  if (TARGETED_ABUSE.some((pattern) => pattern.test(text))) {
    return { riskLevel: 'medium', reason: 'Possible targeted abuse or hostile personal attack', reportReason: 'abuse_or_harassment' };
  }

  // Swearing by itself is deliberately not treated as abuse. Construction jobs,
  // delayed deliveries and crooked walls have historically caused vocabulary.
  return { riskLevel: 'none', reason: '', reportReason: 'other' };
}

export function isRiskAtLeast(level: MessageRiskLevel, minimum: MessageRiskLevel) {
  const order: Record<MessageRiskLevel, number> = { none: 0, low: 1, medium: 2, high: 3, severe: 4 };
  return order[level] >= order[minimum];
}
