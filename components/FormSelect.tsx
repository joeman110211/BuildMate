import { useState } from 'react';
import { FlatList, Pressable, StyleSheet, View } from 'react-native';
import { Button, Modal, Portal, Text } from 'react-native-paper';
import { colors } from '@/constants/theme';

export function FormSelect<T extends string>({ label, value, options, onChange, placeholder = 'Select an option' }: {
  label: string;
  value?: T;
  options: readonly T[];
  onChange: (value: T) => void;
  placeholder?: string;
}) {
  const [open, setOpen] = useState(false);
  return <View style={styles.wrapper}>
    <Text variant="labelLarge">{label}</Text>
    <Pressable accessibilityRole="button" accessibilityLabel={`${label}: ${value ?? placeholder}`} onPress={() => setOpen(true)} style={styles.select}>
      <Text style={value ? styles.value : styles.placeholder}>{value ?? placeholder}</Text><Text>⌄</Text>
    </Pressable>
    <Portal>
      <Modal visible={open} onDismiss={() => setOpen(false)} contentContainerStyle={styles.modal}>
        <Text variant="titleLarge" style={styles.modalTitle}>{label}</Text>
        <FlatList data={[...options]} keyExtractor={(item) => item} renderItem={({ item }) => (
          <Pressable style={[styles.option, item === value && styles.selected]} onPress={() => { onChange(item); setOpen(false); }}>
            <Text>{item}</Text>{item === value ? <Text style={styles.check}>✓</Text> : null}
          </Pressable>
        )} />
        <Button onPress={() => setOpen(false)}>Cancel</Button>
      </Modal>
    </Portal>
  </View>;
}

const styles = StyleSheet.create({
  wrapper: { gap: 7 },
  select: { minHeight: 52, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface, borderRadius: 10, paddingHorizontal: 14, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  value: { color: colors.text },
  placeholder: { color: colors.muted },
  modal: { backgroundColor: colors.surface, borderRadius: 16, padding: 18, width: '90%', maxWidth: 520, maxHeight: '75%', alignSelf: 'center' },
  modalTitle: { fontWeight: '700', marginBottom: 10 },
  option: { paddingVertical: 14, paddingHorizontal: 12, borderBottomWidth: StyleSheet.hairlineWidth, borderColor: colors.border, flexDirection: 'row', justifyContent: 'space-between' },
  selected: { backgroundColor: '#FFF7ED' },
  check: { color: colors.primary, fontWeight: '800' },
});
