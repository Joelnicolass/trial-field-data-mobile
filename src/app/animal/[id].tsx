import { useLocalSearchParams, useRouter } from 'expo-router';

import { AnimalDetailView } from '@/features/animal/AnimalDetailView';
import { useAnimalScreen } from '@/features/animal/useAnimalScreen';

// El detalle de un animal, apilado sobre las pestañas. La dirección dice qué
// animal es; el hook entrega el modelo ya escrito y la vista lo dibuja.
export default function AnimalScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const animal = useAnimalScreen(id);

  // En web se puede entrar directo por la dirección o recargar la página: ahí
  // no hay pantalla anterior, y volver lleva a la lista de animales.
  function goBack() {
    if (router.canGoBack()) router.back();
    else router.replace({ pathname: '/campo', params: { section: 'animales' } });
  }

  return <AnimalDetailView animal={animal} onBack={goBack} />;
}
