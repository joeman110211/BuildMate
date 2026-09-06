function isTruthy(value: string | undefined) {
  const normalised = value?.trim().toLowerCase();
  return normalised === 'true' || normalised === '1' || normalised === 'yes';
}

export function previewDataEnabled() {
  if (isTruthy(process.env.BUILDPAIR_PREVIEW_DATA_ENABLED)) return true;

  // The staging host is deliberately a no-index preview environment. Keep demo
  // marketplace data available there even when the production-safe default flag
  // remains false in the shared environment template.
  if (!isTruthy(process.env.BUILDPAIR_NOINDEX)) return false;

  try {
    const appUrl = process.env.APP_URL;
    if (!appUrl) return false;
    return new URL(appUrl).hostname === 'staging.buildpair.co.uk';
  } catch {
    return false;
  }
}
