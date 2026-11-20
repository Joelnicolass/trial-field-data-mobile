import { useRouter } from 'expo-router';
import { View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { GroupInfoView } from '@/features/groupInfo/GroupInfoView';
import { useGroupInfoScreen } from '@/features/groupInfo/useGroupInfoScreen';
import { EmptyState } from '@/ui/EmptyState';
import { IconButton } from '@/ui/IconButton';
import { ScreenHeader } from '@/ui/ScreenHeader';
import { color } from '@/ui/theme';

// La info del grupo: quiénes están, en qué modo está el agente y quién vio
// lo que mandé. Recibe del hook un modelo listo y lo dibuja.
export default function GroupInfoScreen() {
  const router = useRouter();
  const { model, setAgentMode } = useGroupInfoScreen();
  // Esta pantalla no tiene pestañas abajo: se deja libre el lugar de la barra del sistema.
  const insets = useSafeAreaInsets();

  return (
    <View style={{ flex: 1, backgroundColor: color.fondo, paddingBottom: insets.bottom }}>
      <ScreenHeader
        title="Info del grupo"
        subtitle={model?.groupName}
        left={<IconButton icon="arrow-left" accessibilityLabel="Volver" tint={color.sobreNavy} onPress={() => router.back()} />}
      />

      {model ? (
        <GroupInfoView model={model} onChangeAgentMode={setAgentMode} />
      ) : (
        // Acá se llega desde el grupo, ya cargado. Sin grupo se ve solo si se
        // abre esta dirección directo, por ejemplo al recargar en la web.
        <View style={{ flex: 1, justifyContent: 'center' }}>
          <EmptyState
            icon="users"
            title="Todavía no cargó el grupo"
            description="Abrí el grupo y volvé a entrar acá."
            actionLabel="Ir al grupo"
            onAction={() => router.replace('/')}
          />
        </View>
      )}
    </View>
  );
}
