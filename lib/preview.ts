export function previewDataEnabled() {
  const configured = process.env.BUILDPAIR_PREVIEW_DATA_ENABLED?.trim().toLowerCase();
  return configured === 'true' || configured === '1' || configured === 'yes';
}
