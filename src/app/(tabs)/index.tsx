import { useRouter } from 'expo-router';
import { useCallback } from 'react';
import { ActivityIndicator, View } from 'react-native';

import { GroupChatView } from '@/features/group/GroupChatView';
import { useGroupScreen } from '@/features/group/useGroupScreen';
import { EmptyState } from '@/ui/EmptyState';
import { IconButton } from '@/ui/IconButton';
import { ScreenHeader } from '@/ui/ScreenHeader';
import { color } from '@/ui/theme';

// El grupo del campo. Recibe del hook un modelo listo y lo dibuja.
export default function GroupScreen() {
  const router = useRouter();
  const { status, model, retry, newCount, onScroll, sendText, retrySend } = useGroupScreen();

  // Por ahora cualquier tarjeta lleva a Campo; abrir la sección exacta es el paso que sigue.
  const openInCampo = useCallback(() => router.navigate('/campo'), [router]);

  return (
    <View style={{ flex: 1, backgroundColor: color.fondo }}>
      <ScreenHeader
        title={model?.title ?? 'Grupo'}
        subtitle={model?.statusLine}
        right={<IconButton icon="grid" accessibilityLabel="Ver los componentes" tint={color.sobreNavy} onPress={() => router.push('/catalogo')} />}
      />

      {model ? (
        <GroupChatView model={model} newCount={newCount} onScroll={onScroll} onOpen={openInCampo} onSend={sendText} onRetry={retrySend} />
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
