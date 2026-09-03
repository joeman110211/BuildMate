import { useAuth } from '@clerk/expo';
import { useState } from 'react';
import { Button } from 'react-native-paper';
import { apiFetch, errorMessage } from '@/lib/api';

export function PayMilestoneButton({ milestoneId }: { milestoneId: string; onPaid: () => void }) {
  const { getToken } = useAuth();
  const [busy, setBusy] = useState(false);
  async function pay() {
    try {
      setBusy(true);
      const { url } = await apiFetch<{ url: string }>('/api/stripe/payment-intent', { method: 'POST', body: JSON.stringify({ milestoneId, platform: 'web' }) }, getToken);
      window.location.assign(url);
    } catch (e) { window.alert(errorMessage(e)); setBusy(false); }
  }
  return <Button mode="contained" icon="credit-card" loading={busy} disabled={busy} onPress={pay}>Pay securely</Button>;
}
