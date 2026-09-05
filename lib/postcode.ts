export type PostcodeLocation = {
  postcode: string;
  latitude: number;
  longitude: number;
  locationLabel: string;
};

type PostcodesIoResult = {
  postcode: string;
  latitude: number;
  longitude: number;
  admin_district?: string | null;
  region?: string | null;
  country?: string | null;
};

type PostcodesIoResponse = {
  status: number;
  result?: PostcodesIoResult | null;
  error?: string;
};

export class InvalidPostcodeError extends Error {
  constructor(message = 'Enter a valid UK postcode') {
    super(message);
  }
}

export async function lookupPostcode(input: string): Promise<PostcodeLocation> {
  const postcode = input.trim().toUpperCase().replace(/\s+/g, ' ');
  if (postcode.length < 5 || postcode.length > 8) throw new InvalidPostcodeError();

  // Deterministic CI fixture. Never active on Vercel, including previews.
  if (
    process.env.CI === 'true'
    && process.env.BUILDPAIR_E2E_MODE === '1'
    && !process.env.VERCEL_ENV
    && postcode === 'TW18 4AB'
  ) {
    return {
      postcode,
      latitude: 51.4335,
      longitude: -0.5155,
      locationLabel: 'Spelthorne',
    };
  }

  let response: Response;
  try {
    response = await fetch(`https://api.postcodes.io/postcodes/${encodeURIComponent(postcode)}`, {
      headers: { accept: 'application/json' },
      signal: AbortSignal.timeout(5000),
    });
  } catch {
    throw new Error('Postcode lookup is temporarily unavailable');
  }

  const body = await response.json() as PostcodesIoResponse;
  if (!response.ok || !body.result) throw new InvalidPostcodeError();

  const result = body.result;
  if (!Number.isFinite(result.latitude) || !Number.isFinite(result.longitude)) throw new InvalidPostcodeError();

  return {
    postcode: result.postcode,
    latitude: result.latitude,
    longitude: result.longitude,
    locationLabel: result.admin_district || result.region || result.country || result.postcode.split(' ')[0] || result.postcode,
  };
}

export function outwardCode(postcode: string | null | undefined) {
  return postcode?.trim().toUpperCase().split(/\s+/)[0] ?? '';
}
