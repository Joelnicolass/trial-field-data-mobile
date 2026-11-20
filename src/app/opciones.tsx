import { useRouter } from 'expo-router';

import { OptionsView } from '@/features/options/OptionsView';
import { useChatStore } from '@/store/chatStore';

// Opciones para probar la app: cortar la señal y ver los componentes.
// Lee la señal del store y la cambia ahí: el grupo se entera solo.
export default function OptionsScreen() {
  const router = useRouter();
  const online = useChatStore((state) => state.online);
  const setOnline = useChatStore((state) => state.setOnline);

  return (
    <OptionsView
      offline={!online}
      onToggleOffline={(offline) => setOnline(!offline)}
      onOpenCatalog={() => router.push('/catalogo')}
      onClose={() => router.back()}
    />
  );
}
