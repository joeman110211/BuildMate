import type { Href } from 'expo-router';
import { usePathname, useRouter } from 'expo-router';
import { Pressable, StyleSheet, useWindowDimensions, View } from 'react-native';
import { Icon, Text } from 'react-native-paper';
import { colors } from '@/constants/theme';
import type { UserRole } from '@/types';

type NavItem = { label: string; icon: string; href: Href; match: string };

const traderItems: NavItem[] = [
  { label: 'Home', icon: 'home-outline', href: '/trader/dashboard', match: '/trader/dashboard' },
  { label: 'Job Board', icon: 'briefcase-search-outline', href: '/trader/job-board', match: '/trader/job-board' },
  { label: 'My Jobs', icon: 'briefcase-outline', href: '/trader/my-jobs', match: '/trader/my-jobs' },
  { label: 'Messages', icon: 'message-text-outline', href: '/trader/messages', match: '/trader/messages' },
  { label: 'Profile', icon: 'account-circle-outline', href: '/trader/profile', match: '/trader/profile' },
];

const customerItems: NavItem[] = [
  { label: 'Home', icon: 'home-outline', href: '/customer/dashboard', match: '/customer/dashboard' },
  { label: 'Find Trades', icon: 'magnify', href: '/(public)/directory', match: '/directory' },
  { label: 'My Jobs', icon: 'clipboard-text-outline', href: '/customer/jobs', match: '/customer/jobs' },
  { label: 'Messages', icon: 'message-text-outline', href: '/customer/messages', match: '/customer/messages' },
  { label: 'Profile', icon: 'account-circle-outline', href: '/customer/profile', match: '/customer/profile' },
];

const detailPaths = ['/onboarding', '/quotes/', '/invoices/new', '/new-job', '/compare/', '/messages/'];

export function AppBottomNav({ role }: { role: UserRole }) {
  const router = useRouter();
  const pathname = usePathname();
  const { width } = useWindowDimensions();
  if (width >= 900 || detailPaths.some((path) => pathname.includes(path))) return null;

  const items = role === 'trader' ? traderItems : customerItems;
  return <View style={styles.wrap}>
    {items.map((item) => {
      const active = pathname.includes(item.match);
      return <Pressable key={item.label} onPress={() => router.push(item.href)} style={styles.item} accessibilityRole="button" accessibilityState={{ selected: active }}>
        <View style={[styles.iconWrap, active && styles.iconWrapActive]}><Icon source={item.icon} size={23} color={active ? colors.primary : colors.muted} /></View>
        <Text variant="labelSmall" style={[styles.label, active && styles.labelActive]}>{item.label}</Text>
      </Pressable>;
    })}
  </View>;
}

const styles = StyleSheet.create({
  wrap: { minHeight: 70, paddingHorizontal: 6, paddingTop: 7, paddingBottom: 7, borderTopWidth: 1, borderTopColor: colors.border, backgroundColor: colors.surface, flexDirection: 'row', justifyContent: 'space-around', shadowColor: '#111827', shadowOpacity: 0.07, shadowRadius: 12, shadowOffset: { width: 0, height: -3 }, elevation: 8 },
  item: { flex: 1, minWidth: 60, alignItems: 'center', justifyContent: 'center', gap: 2 },
  iconWrap: { minWidth: 38, height: 30, borderRadius: 15, alignItems: 'center', justifyContent: 'center' },
  iconWrapActive: { backgroundColor: colors.surfaceSoft },
  label: { color: colors.muted, fontWeight: '700' },
  labelActive: { color: colors.primary, fontWeight: '900' },
});
