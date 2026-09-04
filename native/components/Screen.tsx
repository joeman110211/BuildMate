import type { ReactNode } from 'react';
import { ScrollView, StyleSheet, View, type ViewStyle } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colours } from '@/native/theme';

export function Screen({ children, contentStyle }: { children: ReactNode; contentStyle?: ViewStyle }) {
  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView contentContainerStyle={[styles.content, contentStyle]} keyboardShouldPersistTaps="handled">
        <View>{children}</View>
      </ScrollView>
    </SafeAreaView>
  );
}
const styles = StyleSheet.create({ safe: { flex: 1, backgroundColor: colours.cream }, content: { padding: 18, paddingBottom: 48 } });
