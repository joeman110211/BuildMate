import { Alert, Linking, Platform, Share, StyleSheet, View } from 'react-native';
import { Button, Text } from 'react-native-paper';
import { colors } from '@/constants/theme';

export function ProfileShareButtons({ profileId, businessName }: { profileId: string; businessName: string }) {
  const url = `https://www.buildpair.co.uk/traders/${encodeURIComponent(profileId)}`;
  const text = `Find ${businessName} on BuildPair: ${url}`;

  async function open(target: string) {
    try { await Linking.openURL(target); }
    catch { Alert.alert('Could not open sharing app', 'Copy the BuildPair profile link instead.'); }
  }

  async function shareMore() {
    try {
      if (Platform.OS === 'web' && typeof navigator !== 'undefined' && navigator.share) {
        await navigator.share({ title: `${businessName} on BuildPair`, text, url });
        return;
      }
      await Share.share({ title: `${businessName} on BuildPair`, message: text, url });
    } catch { /* user cancelled the share sheet */ }
  }

  async function copyLink() {
    try {
      if (Platform.OS === 'web' && typeof navigator !== 'undefined' && navigator.clipboard) {
        await navigator.clipboard.writeText(url);
        Alert.alert('Link copied', 'The BuildPair profile link is ready to paste.');
        return;
      }
      await Share.share({ title: `${businessName} on BuildPair`, message: text, url });
    } catch { Alert.alert('Could not copy link', url); }
  }

  return <View style={styles.wrapper}>
    <Text variant="labelLarge" style={styles.label}>Share this BuildPair profile</Text>
    <View style={styles.actions}>
      <Button compact mode="outlined" icon="whatsapp" onPress={() => void open(`https://wa.me/?text=${encodeURIComponent(text)}`)}>WhatsApp</Button>
      <Button compact mode="outlined" icon="facebook" onPress={() => void open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`)}>Facebook</Button>
      <Button compact mode="outlined" icon="facebook-messenger" onPress={() => void shareMore()}>Messenger / More</Button>
      <Button compact mode="outlined" icon="email-outline" onPress={() => void open(`mailto:?subject=${encodeURIComponent(`${businessName} on BuildPair`)}&body=${encodeURIComponent(text)}`)}>Email</Button>
      <Button compact mode="outlined" icon="message-text-outline" onPress={() => void open(`sms:?body=${encodeURIComponent(text)}`)}>SMS</Button>
      <Button compact mode="outlined" icon="content-copy" onPress={() => void copyLink()}>Copy Link</Button>
    </View>
  </View>;
}

const styles = StyleSheet.create({
  wrapper: { gap: 8 },
  label: { color: colors.charcoal, fontWeight: '800' },
  actions: { flexDirection: 'row', flexWrap: 'wrap', gap: 7 },
});
