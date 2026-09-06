function isTruthy(value: string | undefined) {
  const normalised = value?.trim().toLowerCase();
  return normalised === 'true' || normalised === '1' || normalised === 'yes';
}

function stagingHostFromRequest(request?: Request | string) {
  if (!request) return false;

  try {
    if (typeof request === 'string') {
      return new URL(request).hostname === 'staging.buildpair.co.uk';
    }

    const forwardedHost = request.headers.get('x-forwarded-host')?.split(',')[0]?.trim().split(':')[0];
    const host = request.headers.get('host')?.trim().split(':')[0];
    const urlHost = new URL(request.url).hostname;

    return [forwardedHost, host, urlHost].some((value) => value === 'staging.buildpair.co.uk');
  } catch {
    return false;
  }
}

export function previewDataEnabled(request?: Request | string) {
  if (isTruthy(process.env.BUILDPAIR_PREVIEW_DATA_ENABLED)) return true;

  // Staging should always show realistic preview marketplace data. Detect it from
  // the actual request first so stale local environment values cannot disable it.
  if (stagingHostFromRequest(request)) return true;

  // Environment fallback for server-side contexts where no Request is available.
  if (!isTruthy(process.env.BUILDPAIR_NOINDEX)) return false;

  try {
    const appUrl = process.env.APP_URL;
    if (!appUrl) return false;
    return new URL(appUrl).hostname === 'staging.buildpair.co.uk';
  } catch {
    return false;
  }
}
