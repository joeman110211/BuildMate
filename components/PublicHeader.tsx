import { useClerk } from '@clerk/expo';
import type { Href } from 'expo-router';
import { Link, useRouter } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, useWindowDimensions, View } from 'react-native';
import { Button, Divider, IconButton, Menu, Text } from 'react-native-paper';
import { BuildPairLogo } from '@/components/BuildPairLogo';
import { colors } from '@/constants/theme';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { dashboardHref } from '@/lib/account-mode';
import type { UserRole } from '@/types';

const authConfigured = Boolean(process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY);

const NAV_ITEMS: { label: string; href: Href }[] = [
  { label: 'Home', href: '/' },
  { label: 'Find Trades', href: '/(public)/directory' },
  { label: 'Jobs', href: '/(public)/jobs' },
  { label: 'How It Works', href: '/(public)/how-it-works' },
  { label: 'For Trades', href: '/(public)/for-tradespeople' },
  { label: 'About', href: '/(public)/about' },
];

const SUPPORT_ITEMS: { label: string; href: Href }[] = [
  { label: 'For Homeowners', href: '/(public)/for-homeowners' },
  { label: 'Download App', href: '/(public)/download' },
  { label: 'Contact Us', href: '/(public)/contact' },
];

const LEGAL_ITEMS: { label: string; href: Href }[] = [
  { label: 'Terms & Conditions', href: '/(public)/terms' },
  { label: 'Privacy Policy', href: '/(public)/privacy' },
  { label: 'Cookie Policy', href: '/(public)/cookies' },
  { label: 'Disclaimer', href: '/(public)/disclaimer' },
];

function HeaderBrand() {
  return <Link href="/" asChild><Pressable style={styles.brandPressable} accessibilityLabel="BuildPair home"><BuildPairLogo compact /></Pressable></Link>;
}

function NavMenu({ dashboard, signedIn, onSignOut, preview = false }: { dashboard?: Href; signedIn?: boolean; onSignOut?: () => void; preview?: boolean }) {
  const [open, setOpen] = useState(false);
  const router = useRouter();

  const go = (href: Href) => {
    setOpen(false);
    router.push(href);
  };

  return <Menu
    visible={open}
    onDismiss={() => setOpen(false)}
    anchor={<IconButton icon={open ? 'close' : 'menu'} size={27} onPress={() => setOpen((value) => !value)} accessibilityLabel="Open navigation menu" />}
    contentStyle={styles.menuContent}
  >
    {NAV_ITEMS.map((item) => <Menu.Item key={item.label} title={item.label} onPress={() => go(item.href)} />)}
    <Divider />
    {SUPPORT_ITEMS.map((item) => <Menu.Item key={item.label} title={item.label} onPress={() => go(item.href)} />)}
    <Divider />
    {LEGAL_ITEMS.map((item) => <Menu.Item key={item.label} title={item.label} onPress={() => go(item.href)} />)}
    <Divider />
    {preview ? <Menu.Item title="Sign in (preview unavailable)" disabled /> : signedIn && dashboard ? <>
      <Menu.Item title="Dashboard" leadingIcon="view-dashboard-outline" onPress={() => go(dashboard)} />
      <Menu.Item title="Sign out" leadingIcon="logout" onPress={() => { setOpen(false); onSignOut?.(); }} />
    </> : <>
      <Menu.Item title="Sign in" leadingIcon="login" onPress={() => go('/auth/account')} />
      <Menu.Item title="Join BuildPair" leadingIcon="account-plus-outline" onPress={() => go('/auth/account')} />
    </>}
  </Menu>;
}

function DesktopNav() {
  return <View style={styles.desktopNav}>
    {NAV_ITEMS.slice(1, 5).map((item) => <Link href={item.href} asChild key={item.label}><Button compact>{item.label}</Button></Link>)}
  </View>;
}

function AuthenticatedHeader() {
  const { width } = useWindowDimensions();
  const { user, isSignedIn } = useCurrentUser();
  const { signOut } = useClerk();
  const router = useRouter();
  const compact = width < 920;

  let mode: UserRole | null = null;
  if (user?.activeMode === 'customer' && user.customerEnabled) mode = 'customer';
  else if (user?.activeMode === 'trader' && user.traderEnabled) mode = 'trader';
  else if (user?.customerEnabled) mode = 'customer';
  else if (user?.traderEnabled) mode = 'trader';

  const dashboard = (mode ? dashboardHref(mode) : '/auth/choose-role') as Href;
  const doSignOut = () => signOut(() => router.replace('/'));

  return <View style={styles.header}>
    <HeaderBrand />
    {compact ? <NavMenu dashboard={dashboard} signedIn={isSignedIn} onSignOut={doSignOut} /> : <View style={styles.actions}>
      <DesktopNav />
      {isSignedIn ? <>
        <Button mode="contained" onPress={() => router.push(dashboard)}>Dashboard</Button>
        <NavMenu dashboard={dashboard} signedIn onSignOut={doSignOut} />
      </> : <>
        <Link href="/auth/account" asChild><Button>Sign in</Button></Link>
        <Link href="/auth/account" asChild><Button mode="contained">Join</Button></Link>
        <NavMenu />
      </>}
    </View>}
  </View>;
}

function PreviewHeader() {
  const { width } = useWindowDimensions();
  const compact = width < 920;
  return <View style={styles.header}>
    <HeaderBrand />
    {compact ? <NavMenu preview /> : <View style={styles.actions}>
      <DesktopNav />
      <Text variant="bodySmall" style={styles.preview}>Public preview</Text>
      <NavMenu preview />
    </View>}
  </View>;
}

export function PublicHeader() {
  return authConfigured ? <AuthenticatedHeader /> : <PreviewHeader />;
}

const styles = StyleSheet.create({
  header: { minHeight: 72, paddingHorizontal: 16, borderBottomWidth: 1, borderColor: colors.border, backgroundColor: 'rgba(255,255,255,0.97)', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  brandPressable: { minHeight: 56, justifyContent: 'center', paddingHorizontal: 3 },
  actions: { flexDirection: 'row', alignItems: 'center', gap: 4, justifyContent: 'flex-end' },
  desktopNav: { flexDirection: 'row', alignItems: 'center', gap: 1 },
  preview: { opacity: 0.65, marginLeft: 4 },
  menuContent: { backgroundColor: colors.surfaceRaised, borderRadius: 18, minWidth: 250, paddingVertical: 6 },
});
