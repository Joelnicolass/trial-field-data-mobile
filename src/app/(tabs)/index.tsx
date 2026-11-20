import { useRouter } from 'expo-router';
import { useCallback } from 'react';
import { ActivityIndicator, View } from 'react-native';

import { GroupChatView } from '@/features/group/GroupChatView';
import { statusLine } from '@/features/group/statusLine';
import { useGroupChat } from '@/features/group/useGroupChat';
import { EmptyState } from '@/ui/EmptyState';
import { IconButton } from '@/ui/IconButton';
import { ScreenHeader } from '@/ui/ScreenHeader';
import { color } from '@/ui/theme';

// El grupo del campo. Lee del servidor: carga el historial y después muestra
// lo que va llegando.
export default function GroupScreen() {
  const router = useRouter();
  const { status, chat, datos, timeline, membersById, messagesBySeq, retry } = useGroupChat();

  // Por ahora cualquier tarjeta lleva a Campo; abrir la sección exacta es el paso que sigue.
  const openInCampo = useCallback(() => router.navigate('/campo'), [router]);

  return (
    <View style={{ flex: 1, backgroundColor: color.fondo }}>
      <ScreenHeader
        title={chat?.name ?? 'Grupo'}
        subtitle={chat ? statusLine(chat) : undefined}
        right={<IconButton icon="grid" accessibilityLabel="Ver los componentes" tint={color.sobreNavy} onPress={() => router.push('/catalogo')} />}
      />

      {chat ? (
        <GroupChatView chat={chat} timeline={timeline} datos={datos} membersById={membersById} messagesBySeq={messagesBySeq} onOpen={openInCampo} />
      ) : (
        <View style={{ flex: 1, justifyContent: 'center' }}>
          {status === 'error' ? (
            <EmptyState
              icon="alert-triangle"
              title="No pudimos cargar el contenido"
              description="Revisá tu conexión y probá de nuevo."
              actionLabel="Reintentar"
              onAction={retry}
            />
          ) : (
            <ActivityIndicator size="large" color={color.primarioOscuro} />
          )}
        </View>
      )}
    </View>
  );
}
