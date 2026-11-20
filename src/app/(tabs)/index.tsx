import { useRouter } from 'expo-router';
import { useCallback } from 'react';
import { ActivityIndicator, View } from 'react-native';

import { opensToParams } from '@/features/campo/target';
import { GroupChatView } from '@/features/group/GroupChatView';
import type { OpenTarget } from '@/features/group/model';
import { useGroupScreen } from '@/features/group/useGroupScreen';
import { EmptyState } from '@/ui/EmptyState';
import { IconButton } from '@/ui/IconButton';
import { ScreenHeader } from '@/ui/ScreenHeader';
import { color } from '@/ui/theme';

// El grupo del campo. Recibe del hook un modelo listo y lo dibuja.
export default function GroupScreen() {
  const router = useRouter();
  const { status, model, retry, newCount, atBottom, onScroll, onListReady, sendText, sendVoice, retrySend, completeDato, dismissNotice } = useGroupScreen();

  // Tocar una tarjeta abre Campo en lo que esa tarjeta indica. El grupo
  // queda montado detrás: al volver está como se lo dejó.
  const openInCampo = useCallback(
    (target: OpenTarget) => router.navigate({ pathname: '/campo', params: opensToParams(target, String(Date.now())) }),
    [router],
  );

  return (
    <View style={{ flex: 1, backgroundColor: color.fondo }}>
      <ScreenHeader
        title={model?.title ?? 'Grupo'}
        subtitle={model?.statusLine}
        right={
          <View style={{ flexDirection: 'row' }}>
            <IconButton icon="info" accessibilityLabel="Info del grupo" tint={color.sobreNavy} onPress={() => router.push('/info-grupo')} />
            <IconButton icon="settings" accessibilityLabel="Opciones" tint={color.sobreNavy} onPress={() => router.push('/opciones')} />
          </View>
        }
      />

      {model ? (
        <GroupChatView
          model={model}
          newCount={newCount}
          atBottom={atBottom}
          onScroll={onScroll}
          onListReady={onListReady}
          onOpen={openInCampo}
          onSend={sendText}
          onSendVoice={sendVoice}
          onRetry={retrySend}
          onComplete={(dato, values) => completeDato(dato.datoId, dato.version, values)}
          onDismissNotice={dismissNotice}
        />
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
