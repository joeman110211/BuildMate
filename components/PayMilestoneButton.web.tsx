import { useAuth } from '@clerk/expo';
import { useState } from 'react';
import { Button } from 'react-native-paper';
import { apiFetch, errorMessage } from '@/lib/api';

export function PayMilestoneButton({ milestoneId, onPaid }: { milestoneId: string; onPaid: () => void }) {
  const { getToken } = useAuth();
  const [busy, setBusy] = useState(false);
  const stripeEnabled = Boolean(process.env.EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY?.trim());

  async function confirmExternalPayment() {
    const confirmed = window.confirm('Confirm that you have already paid the tradesperson outside BuildPair. BuildPair will only record your confirmation and will not process any money.');
    if (!confirmed) return;
    try {
      setBusy(true);
      await apiFetch('/api/payments/external-confirm', { method: 'POST', body: JSON.stringify({ milestoneId }) }, getToken);
      onPaid();
    } catch (e) {
      window.alert(errorMessage(e));
    } finally {
      setBusy(false);
    }
  }

  async function payWithStripe() {
    try {
      setBusy(true);
      const { url } = await apiFetch<{ url: string }>('/api/stripe/payment-intent', { method: 'POST', body: JSON.stringify({ milestoneId, platform: 'web' }) }, getToken);
      window.location.assign(url);
    } catch (e) {
      window.alert(errorMessage(e));
      setBusy(false);
    }
  }

  return stripeEnabled
    ? <Button mode="contained" icon="credit-card" loading={busy} disabled={busy} onPress={payWithStripe}>Pay securely</Button>
    : <Button mode="contained" icon="check-circle-outline" loading={busy} disabled={busy} onPress={confirmExternalPayment}>Confirm paid outside BuildPair</Button>;
}
