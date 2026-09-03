import type { PropsWithChildren, ReactNode } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { ActivityIndicator, Text } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors } from '@/constants/theme';

export function Screen({ children, title, subtitle, scroll = true }: PropsWithChildren<{ title?: string; subtitle?: string; scroll?: boolean }>) {
  const content = (
    <View style={styles.content}>
      {title ? <Text variant="headlineMedium" style={styles.title}>{title}</Text> : null}
      {subtitle ? <Text variant="bodyLarge" style={styles.subtitle}>{subtitle}</Text> : null}
      {children}
    </View>
  );
  return <SafeAreaView style={styles.safe}>{scroll ? <ScrollView contentContainerStyle={styles.scroll}>{content}</ScrollView> : content}</SafeAreaView>;
}

export function LoadingScreen({ label = 'Loading…' }: { label?: string }) {
  return <Screen scroll={false}><View style={styles.loading}><ActivityIndicator size="large" /><Text>{label}</Text></View></Screen>;
}

export function EmptyState({ title, body, action }: { title: string; body: string; action?: ReactNode }) {
  return <View style={styles.empty}><Text variant="titleMedium">{title}</Text><Text style={styles.subtitle}>{body}</Text>{action}</View>;
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  scroll: { flexGrow: 1 },
  content: { width: '100%', maxWidth: 1100, alignSelf: 'center', padding: 20, gap: 14 },
  title: { color: colors.text, fontWeight: '800' },
  subtitle: { color: colors.muted, lineHeight: 23 },
  loading: { flex: 1, minHeight: 420, alignItems: 'center', justifyContent: 'center', gap: 12 },
  empty: { padding: 28, borderWidth: 1, borderColor: colors.border, borderRadius: 14, backgroundColor: colors.surface, alignItems: 'center', gap: 10 },
});
