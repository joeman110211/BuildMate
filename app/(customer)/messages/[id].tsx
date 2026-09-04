import { useLocalSearchParams } from 'expo-router';
import { MessageThread } from '@/components/MessageThread';
export default function CustomerMessageThread() { const { id } = useLocalSearchParams<{ id: string }>(); return <MessageThread conversationId={id} />; }
