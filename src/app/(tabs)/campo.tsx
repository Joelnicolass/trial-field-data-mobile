import { useLocalSearchParams, useRouter } from 'expo-router';

import { CampoView } from '@/features/campo/CampoView';
import { paramsToTarget, type CampoParams } from '@/features/campo/target';

// La pestaña Campo. Si se llegó tocando una tarjeta del grupo, la dirección
// trae adónde abrir. `key` hace que cada visita arranque de cero: la pestaña,
// el filtro y la búsqueda vuelven a lo que pide esa tarjeta, sin efectos.
export default function CampoScreen() {
  const router = useRouter();
  const target = paramsToTarget(useLocalSearchParams<CampoParams>());

  return <CampoView key={target.visit} target={target} onBack={() => router.navigate('/')} />;
}
