import { Text } from 'react-native';
import { colors } from '@/constants/theme';

type Props = {
  name: string;
  color?: string;
  size: number;
  direction?: 'ltr' | 'rtl';
};

const glyphs: Record<string, string> = {
  'home-outline': '⌂',
  'home': '⌂',
  'briefcase-search-outline': '⌕',
  'briefcase-outline': '▣',
  'briefcase-plus-outline': '+',
  'message-text-outline': '●',
  'message-outline': '●',
  'account-circle-outline': '○',
  'account-outline': '○',
  'account-plus': '+',
  'account-group-outline': '◎',
  'account-arrow-right': '›',
  'account-arrow-left': '‹',
  'account-edit-outline': '✎',
  'magnify': '⌕',
  'clipboard-text-outline': '▤',
  'file-document-edit-outline': '▤',
  'file-edit-outline': '✎',
  'check-circle-outline': '✓',
  'check-circle': '✓',
  'check': '✓',
  'check-decagram-outline': '✓',
  'star': '★',
  'star-outline': '☆',
  'image-multiple-outline': '▧',
  'image-outline': '▧',
  'camera-outline': '◉',
  'gift-outline': '✦',
  'plus': '+',
  'plus-circle-outline': '+',
  'close': '×',
  'logout': '↪',
  'open-in-new': '↗',
  'phone': '☎',
  'email-outline': '@',
  'bank': '£',
  'cash': '£',
  'currency-gbp': '£',
  'credit-card': '£',
  'credit-card-outline': '£',
  'map-marker-outline': '•',
  'map-marker-radius': '•',
  'map-marker': '•',
  'clock-outline': '◷',
  'calendar-clock': '◷',
  'calendar-outline': '□',
  'calendar': '□',
  'creation': '✦',
  'hammer-wrench': '✦',
  'tools': '✦',
  'eye-outline': '○',
  'information-outline': 'i',
  'alert-circle-outline': '!',
  'chevron-right': '›',
  'chevron-left': '‹',
  'arrow-right': '→',
  'arrow-left': '←',
  'send': '↑',
  'delete-outline': '×',
  'trash-can-outline': '×',
  'pencil-outline': '✎',
  'pencil': '✎',
  'refresh': '↻',
  'filter-variant': '≡',
  'dots-horizontal': '•••',
  'menu': '≡',
  'cancel': '×',
};

export function PaperIcon({ name, color = colors.muted, size }: Props) {
  const glyph = glyphs[name] ?? '•';
  return (
    <Text
      accessibilityElementsHidden
      importantForAccessibility="no"
      style={{
        color,
        fontSize: Math.max(12, size * 0.82),
        lineHeight: size,
        width: size,
        height: size,
        textAlign: 'center',
        fontWeight: '800',
      }}
    >
      {glyph}
    </Text>
  );
}
