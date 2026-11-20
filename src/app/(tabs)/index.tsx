import { useRouter } from 'expo-router';
import { useCallback } from 'react';
import { ActivityIndicator, View } from 'react-native';

import { opensToParams } from '@/features/campo/target';
import { GroupChatView } from '@/features/group/GroupChatView';
import { GroupHeader } from '@/features/group/GroupHeader';
import type { OpenTarget } from '@/features/group/model';
import { useGroupStart } from '@/features/group/useGroupChat';
import { EmptyState } from '@/ui/EmptyState';
import { IconButton } from '@/ui/IconButton';
import { color } from '@/ui/theme';

// El grupo del campo. Acá solo se decide qué se muestra según cómo va la
// carga y adónde se navega. Cada parte de la pantalla (la barra, la lista,
// cada renglón) lee del store lo suyo.
export default function GroupScreen() {
  const router = useRouter();
  const { status, retry } = useGroupStart();

  // Tocar una tarjeta abre Campo en lo que esa tarjeta indica. El grupo
  // queda montado detrás: al volver está como se lo dejó.
  const openInCampo = useCallback(
    (target: OpenTarget) => {
      // Una tarjeta que lleva a un animal abre su detalle, apilado sobre el grupo.
      if (target.view === 'animal' && target.animal_id) {
        router.push({ pathname: '/animal/[id]', params: { id: target.animal_id } });
        return;
      }
      router.navigate({ pathname: '/campo', params: opensToParams(target, String(Date.now())) });
    },
    [router],
  );

  return (
    <View style={{ flex: 1, backgroundColor: color.fondo }}>
      <GroupHeader
        right={
          <View style={{ flexDirection: 'row' }}>
            <IconButton icon="info" accessibilityLabel="Info del grupo" tint={color.sobreNavy} onPress={() => router.push('/info-grupo')} />
            <IconButton icon="settings" accessibilityLabel="Opciones" tint={color.sobreNavy} onPress={() => router.push('/opciones')} />
          </View>
        }
      />

      {status === 'ready' ? (
        <GroupChatView onOpen={openInCampo} />
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
