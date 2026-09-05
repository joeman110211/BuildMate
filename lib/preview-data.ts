export type PreviewDataMode = 'off' | 'append';

export function getPreviewDataMode(): PreviewDataMode {
  const configured = (process.env.BUILDPAIR_PREVIEW_DATA ?? '').trim().toLowerCase();

  if (['1', 'true', 'on', 'append'].includes(configured)) return 'append';
  if (['0', 'false', 'off'].includes(configured)) return 'off';

  // Preview records must never silently appear in production. Developers still get
  // useful sample data locally unless they explicitly turn it off.
  return process.env.NODE_ENV === 'production' ? 'off' : 'append';
}

export function previewDataEnabled() {
  return getPreviewDataMode() === 'append';
}
