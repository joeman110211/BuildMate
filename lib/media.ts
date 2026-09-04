import * as ImagePicker from 'expo-image-picker';
import { Platform } from 'react-native';
import { apiFetch } from '@/lib/api';

export type MediaKind = 'job' | 'trader';
type TokenGetter = () => Promise<string | null>;

type UploadSignature = {
  cloudName: string;
  apiKey: string;
  timestamp: number;
  signature: string;
  assetFolder: string;
};

type CloudinaryResponse = {
  secure_url?: string;
  error?: { message?: string };
};

export async function pickAndUploadImage(kind: MediaKind, getToken: TokenGetter) {
  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ['images'],
    allowsEditing: false,
    quality: 0.85,
  });
  if (result.canceled || !result.assets[0]) return null;

  const asset = result.assets[0];
  if (asset.fileSize && asset.fileSize > 10 * 1024 * 1024) throw new Error('Choose an image smaller than 10 MB');

  const signed = await apiFetch<UploadSignature>('/api/uploads/sign', {
    method: 'POST',
    body: JSON.stringify({ kind }),
  }, getToken);

  const form = new FormData();
  if (Platform.OS === 'web' && asset.file) {
    form.append('file', asset.file);
  } else {
    form.append('file', {
      uri: asset.uri,
      name: asset.fileName ?? `buildmate-${Date.now()}.jpg`,
      type: asset.mimeType ?? 'image/jpeg',
    } as unknown as Blob);
  }
  form.append('api_key', signed.apiKey);
  form.append('timestamp', String(signed.timestamp));
  form.append('signature', signed.signature);
  form.append('asset_folder', signed.assetFolder);

  const response = await fetch(`https://api.cloudinary.com/v1_1/${signed.cloudName}/image/upload`, {
    method: 'POST',
    body: form,
  });
  const body = await response.json() as CloudinaryResponse;
  if (!response.ok || !body.secure_url) throw new Error(body.error?.message ?? 'Image upload failed');
  return body.secure_url;
}
