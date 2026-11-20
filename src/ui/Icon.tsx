import Feather from '@expo/vector-icons/Feather';
import type { ComponentProps } from 'react';

import { color } from './theme';

// Un solo juego de íconos para toda la app (Feather: trazo fino y puntas
// redondas, como los de la guía). Si se cambia el juego, se cambia acá.
export type IconName = ComponentProps<typeof Feather>['name'];

type Props = {
  name: IconName;
  size?: number;
  tint?: string;
};

export function Icon({ name, size = 20, tint = color.cuerpo }: Props) {
  return <Feather name={name} size={size} color={tint} />;
}
