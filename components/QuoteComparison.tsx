import { useMemo, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { Button, Chip, Text } from 'react-native-paper';
import { AppCard } from '@/components/AppCard';
import { colors } from '@/constants/theme';
import { formatMoney } from '@/lib/money';
import type { Quote } from '@/types';

export function QuoteComparison({ quotes, accepting, messaging, onAccept, onMessage }: { quotes: Quote[]; accepting?: string; messaging?: string; onAccept: (quote: Quote) => void; onMessage?: (quote: Quote) => void }) {
  const [renderedAt] = useState(() => Date.now());
  const lowestTotal = useMemo(() => Math.min(...quotes.filter((quote) => quote.status === 'pending').map((quote) => quote.totalAmount), Number.POSITIVE_INFINITY), [quotes]);

  return <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.row}>
    {quotes.map((quote) => {
      const expired = Boolean(quote.validUntil && new Date(quote.validUntil).getTime() < renderedAt);
      const lowest = quote.status === 'pending' && quote.totalAmount === lowestTotal && Number.isFinite(lowestTotal);
      return <View key={quote.id} style={styles.column}><AppCard style={[styles.card, lowest && styles.lowestCard]}>
        <View style={styles.heading}><View style={styles.flex}><Text variant="titleLarge" style={styles.title}>{quote.businessName ?? 'Trade quote'}</Text><Text variant="headlineMedium" style={styles.total}>{formatMoney(quote.totalAmount)}</Text></View><View style={styles.badges}>{lowest ? <Chip compact icon="cash-check">Lowest total</Chip> : null}<Chip compact>{expired && quote.status === 'pending' ? 'expired' : quote.status}</Chip></View></View>

        <View style={styles.breakdown}>
          <PriceRow label="Labour" value={formatMoney(quote.laborCost)} />
          <PriceRow label="Materials" value={formatMoney(quote.materialsCost)} />
          <PriceRow label="VAT" value={formatMoney(quote.vatAmount)} />
          <View style={styles.divider} />
          <PriceRow label="Deposit" value={formatMoney(quote.depositAmount)} strong />
        </View>

        {quote.validUntil ? <Text variant="bodySmall" style={expired ? styles.expired : styles.muted}>{expired ? 'Expired' : 'Valid until'} {new Date(quote.validUntil).toLocaleDateString('en-GB')}</Text> : null}
        <View style={styles.terms}><Text variant="labelLarge" style={styles.title}>Payment terms</Text><Text style={styles.body}>{quote.paymentTerms}</Text>{quote.notes ? <Text style={styles.muted}>{quote.notes}</Text> : null}</View>
        <View style={styles.actions}>
          {onMessage ? <Button mode="outlined" icon="message-text-outline" loading={messaging === quote.id} disabled={Boolean(messaging)} onPress={() => onMessage(quote)}>Message</Button> : null}
          {quote.status === 'pending' && !expired ? <Button mode="contained" icon="check-circle-outline" loading={accepting === quote.id} disabled={Boolean(accepting)} onPress={() => onAccept(quote)}>Accept Quote</Button> : null}
        </View>
      </AppCard></View>;
    })}
  </ScrollView>;
}

function PriceRow({ label, value, strong = false }: { label: string; value: string; strong?: boolean }) {
  return <View style={styles.priceRow}><Text style={strong ? styles.strong : styles.muted}>{label}</Text><Text style={strong ? styles.strong : styles.body}>{value}</Text></View>;
}

const styles = StyleSheet.create({
  row: { gap: 14, paddingBottom: 10, paddingHorizontal: 1 },
  column: { width: 340 },
  card: { minHeight: 400 },
  lowestCard: { borderColor: colors.primary, borderWidth: 2 },
  heading: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8, flexWrap: 'wrap' },
  flex: { flex: 1, minWidth: 180, gap: 4 },
  badges: { gap: 5, alignItems: 'flex-end' },
  title: { fontWeight: '900', color: colors.text },
  total: { color: colors.primary, fontWeight: '900' },
  breakdown: { backgroundColor: colors.background, borderRadius: 14, padding: 12, gap: 8 },
  priceRow: { flexDirection: 'row', justifyContent: 'space-between', gap: 10 },
  divider: { height: 1, backgroundColor: colors.border },
  body: { color: colors.text, lineHeight: 21 },
  strong: { color: colors.text, fontWeight: '900' },
  muted: { color: colors.muted, lineHeight: 21 },
  expired: { color: colors.danger, fontWeight: '800' },
  terms: { gap: 5 },
  actions: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 'auto' },
});
