import { StyleSheet, Text, View, type StyleProp, type ViewStyle } from 'react-native';
import { colors } from '@/constants/theme';

type Props = {
  compact?: boolean;
  tagline?: boolean;
  style?: StyleProp<ViewStyle>;
};

export function BuildMateLogo({ compact = false, tagline = false, style }: Props) {
  const size = compact ? 34 : 58;
  const wordSize = compact ? 22 : 36;

  return (
    <View style={[styles.wrap, style]} accessibilityLabel="BuildMate">
      <View style={[styles.mark, { width: size, height: size, borderRadius: size * 0.24 }]}>
        <View style={[styles.roof, {
          width: size * 0.34,
          height: Math.max(3, size * 0.065),
          left: size * 0.17,
          top: size * 0.25,
          transform: [{ rotate: '-40deg' }],
        }]} />
        <View style={[styles.roof, {
          width: size * 0.34,
          height: Math.max(3, size * 0.065),
          left: size * 0.44,
          top: size * 0.25,
          transform: [{ rotate: '40deg' }],
        }]} />
        <View style={[styles.chimney, {
          width: size * 0.07,
          height: size * 0.16,
          left: size * 0.66,
          top: size * 0.19,
        }]} />
        <View style={[styles.house, {
          width: size * 0.43,
          height: size * 0.33,
          left: size * 0.285,
          top: size * 0.42,
          borderRadius: Math.max(2, size * 0.045),
        }]}>
          <View style={[styles.door, { width: size * 0.11, height: size * 0.19 }]} />
          <View style={styles.windows}>
            <View style={styles.window} /><View style={styles.window} />
            <View style={styles.window} /><View style={styles.window} />
          </View>
        </View>
      </View>
      <View style={styles.copy}>
        <Text style={[styles.wordmark, { fontSize: wordSize, lineHeight: wordSize * 1.05 }]}>
          <Text style={styles.build}>Build</Text><Text style={styles.mate}>Mate</Text>
        </Text>
        {tagline && !compact ? <Text style={styles.tagline}>BUILD  •  CONNECT  •  GET IT DONE</Text> : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  mark: { backgroundColor: colors.charcoal, position: 'relative', overflow: 'hidden' },
  roof: { position: 'absolute', backgroundColor: colors.primary, borderRadius: 99 },
  chimney: { position: 'absolute', backgroundColor: colors.primary, borderRadius: 2 },
  house: { position: 'absolute', backgroundColor: '#FFFFFF', flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-around', paddingHorizontal: '10%' },
  door: { backgroundColor: colors.primary, borderTopLeftRadius: 2, borderTopRightRadius: 2 },
  windows: { width: '33%', aspectRatio: 1, flexDirection: 'row', flexWrap: 'wrap', gap: 1, marginBottom: '14%' },
  window: { width: '44%', height: '44%', backgroundColor: colors.charcoal },
  copy: { justifyContent: 'center' },
  wordmark: { fontWeight: '900', letterSpacing: -1.1 },
  build: { color: colors.charcoal },
  mate: { color: colors.primary },
  tagline: { color: colors.muted, fontSize: 9, lineHeight: 12, fontWeight: '800', letterSpacing: 1.3, marginTop: 2 },
});
