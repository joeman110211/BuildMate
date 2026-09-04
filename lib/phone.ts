export function normalizeUkMobile(input: string) {
  const compact = input.trim().replace(/[\s()\-.]/g, '');
  if (!compact) throw new Error('Enter a UK mobile number');

  let normalized: string;
  if (compact.startsWith('+44')) normalized = compact;
  else if (compact.startsWith('0044')) normalized = `+44${compact.slice(4)}`;
  else if (compact.startsWith('44')) normalized = `+${compact}`;
  else if (compact.startsWith('07')) normalized = `+44${compact.slice(1)}`;
  else if (compact.startsWith('7')) normalized = `+44${compact}`;
  else throw new Error('Use a UK mobile number starting 07, 447 or +447');

  if (!/^\+447\d{9}$/.test(normalized)) {
    throw new Error('Enter a valid UK mobile number, for example 07911 123456');
  }

  return normalized;
}
