import { useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { Button, Chip, DataTable, Text } from 'react-native-paper';
import { AppCard } from '@/components/AppCard';
import { colors } from '@/constants/theme';
import { formatMoney } from '@/lib/money';
import type { Quote } from '@/types';

export function QuoteComparison({ quotes, accepting, messaging, onAccept, onMessage }: { quotes: Quote[]; accepting?: string; messaging?: string; onAccept: (quote: Quote) => void; onMessage?: (quote: Quote) => void }) {
  const [renderedAt] = useState(() => Date.now());
  return <ScrollView horizontal showsHorizontalScrollIndicator contentContainerStyle={styles.row}>
    {quotes.map((quote) => {
      const expired = Boolean(quote.validUntil && new Date(quote.validUntil).getTime() < renderedAt);
      return <View key={quote.id} style={styles.column}><AppCard>
        <View style={styles.heading}><Text variant="titleLarge" style={styles.title}>{quote.businessName ?? 'Trade quote'}</Text><Chip>{expired && quote.status === 'pending' ? 'expired' : quote.status}</Chip></View>
        <DataTable>
          <DataTable.Row><DataTable.Cell>Labour</DataTable.Cell><DataTable.Cell numeric>{formatMoney(quote.laborCost)}</DataTable.Cell></DataTable.Row>
          <DataTable.Row><DataTable.Cell>Materials</DataTable.Cell><DataTable.Cell numeric>{formatMoney(quote.materialsCost)}</DataTable.Cell></DataTable.Row>
          <DataTable.Row><DataTable.Cell>VAT</DataTable.Cell><DataTable.Cell numeric>{formatMoney(quote.vatAmount)}</DataTable.Cell></DataTable.Row>
          <DataTable.Row><DataTable.Cell><Text style={styles.total}>Total</Text></DataTable.Cell><DataTable.Cell numeric><Text style={styles.total}>{formatMoney(quote.totalAmount)}</Text></DataTable.Cell></DataTable.Row>
          <DataTable.Row><DataTable.Cell>Deposit</DataTable.Cell><DataTable.Cell numeric>{formatMoney(quote.depositAmount)}</DataTable.Cell></DataTable.Row>
        </DataTable>
        {quote.validUntil ? <Text variant="bodySmall" style={expired ? styles.expired : styles.muted}>{expired ? 'Expired' : 'Valid until'} {new Date(quote.validUntil).toLocaleDateString('en-GB')}</Text> : null}
        <Text variant="labelLarge">Payment terms</Text><Text>{quote.paymentTerms}</Text>{quote.notes ? <Text style={styles.muted}>{quote.notes}</Text> : null}
        <View style={styles.actions}>
          {onMessage ? <Button mode="outlined" icon="message-text" loading={messaging === quote.id} disabled={Boolean(messaging)} onPress={() => onMessage(quote)}>Message trader</Button> : null}
          {quote.status === 'pending' && !expired ? <Button mode="contained" loading={accepting === quote.id} disabled={Boolean(accepting)} onPress={() => onAccept(quote)}>Accept quote</Button> : null}
        </View>
      </AppCard></View>;
    })}
  </ScrollView>;
}

const styles = StyleSheet.create({ row: { gap: 12, paddingBottom: 8 }, column: { width: 320 }, heading: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 6 }, title: { fontWeight: '800', flex: 1 }, total: { color: colors.primary, fontWeight: '900' }, muted: { color: colors.muted }, expired: { color: colors.danger, fontWeight: '700' }, actions: { gap: 8 } });
