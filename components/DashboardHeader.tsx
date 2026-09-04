import { useClerk } from '@clerk/expo';
import type { Href } from 'expo-router';
import { Link, useRouter } from 'expo-router';
import { StyleSheet, View } from 'react-native';
import { Button, Text } from 'react-native-paper';
import { colors } from '@/constants/theme';

export function DashboardHeader({ home }: { home: '/(customer)/dashboard' | '/(trader)/dashboard' }) {
  const { signOut } = useClerk();
  const router = useRouter();
  const messagesHref = (home.startsWith('/(customer)') ? '/(customer)/messages' : '/(trader)/messages') as Href;
  return <View style={styles.header}>
    <Link href={home} asChild><Button><Text variant="titleLarge" style={styles.brand}>BuildMate</Text></Button></Link>
    <View style={styles.actions}><Link href="/(public)/directory" asChild><Button>Directory</Button></Link><Link href={messagesHref} asChild><Button>Messages</Button></Link><Button onPress={() => signOut(() => router.replace('/(public)/directory'))}>Sign out</Button></View>
  </View>;
}

const styles = StyleSheet.create({ header: { minHeight: 66, paddingHorizontal: 12, backgroundColor: colors.surface, borderBottomWidth: 1, borderColor: colors.border, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }, brand: { color: colors.primary, fontWeight: '900' }, actions: { flexDirection: 'row', flexWrap: 'wrap' } });
