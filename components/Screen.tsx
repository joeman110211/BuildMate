import type { PropsWithChildren, ReactNode } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { ActivityIndicator, Text } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors } from '@/constants/theme';

export function Screen({ children, title, subtitle, scroll = true }: PropsWithChildren<{ title?: string; subtitle?: string; scroll?: boolean }>) {
  const content = (
    <View style={styles.content}>
      {title || subtitle ? <View style={styles.headingBlock}>
        {title ? <Text variant="headlineMedium" style={styles.title}>{title}</Text> : null}
        {subtitle ? <Text variant="bodyLarge" style={styles.subtitle}>{subtitle}</Text> : null}
      </View> : null}
      {children}
    </View>
  );
  return <SafeAreaView style={styles.safe}>{scroll ? <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">{content}</ScrollView> : content}</SafeAreaView>;
}

export function LoadingScreen({ label = 'Loading…' }: { label?: string }) {
  return <Screen scroll={false}><View style={styles.loading}><ActivityIndicator size="large" /><Text style={styles.subtitle}>{label}</Text></View></Screen>;
}

export function EmptyState({ title, body, action }: { title: string; body: string; action?: ReactNode }) {
  return <View style={styles.empty}><View style={styles.emptyIcon}><Text style={styles.emptyIconText}>BM</Text></View><Text variant="titleLarge" style={styles.emptyTitle}>{title}</Text><Text style={[styles.subtitle, styles.emptyBody]}>{body}</Text>{action}</View>;
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  scroll: { flexGrow: 1, paddingBottom: 34 },
  content: { width: '100%', maxWidth: 1200, alignSelf: 'center', paddingHorizontal: 18, paddingTop: 20, paddingBottom: 28, gap: 20 },
  headingBlock: { gap: 7, paddingHorizontal: 2 },
  title: { color: colors.charcoal, fontWeight: '900', letterSpacing: -0.6 },
  subtitle: { color: colors.muted, lineHeight: 23 },
  loading: { flex: 1, minHeight: 420, alignItems: 'center', justifyContent: 'center', gap: 12 },
  empty: { paddingVertical: 36, paddingHorizontal: 24, borderWidth: 1, borderColor: colors.border, borderRadius: 20, backgroundColor: colors.surfaceRaised, alignItems: 'center', gap: 10 },
  emptyIcon: { width: 48, height: 48, borderRadius: 15, backgroundColor: colors.charcoal, alignItems: 'center', justifyContent: 'center' },
  emptyIconText: { color: colors.primary, fontWeight: '900' },
  emptyTitle: { fontWeight: '800', color: colors.charcoal, textAlign: 'center' },
  emptyBody: { maxWidth: 500, textAlign: 'center' },
});
