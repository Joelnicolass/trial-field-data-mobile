import { View } from 'react-native';

import { AppText } from './AppText';
import { Button } from './Button';
import { Icon, type IconName } from './Icon';
import { color, space } from './theme';

type Props = {
  icon: IconName;
  title: string;
  description?: string;
  /** Los dos juntos: el texto del botón y qué hace. */
  actionLabel?: string;
  onAction?: () => void;
};

// Ocupa el lugar de un contenido que no está: no cargó, o no hay nada.
// Según la guía un error de carga no es rojo: es este estado, con "Reintentar".
export function EmptyState({ icon, title, description, actionLabel, onAction }: Props) {
  return (
    <View style={{ alignItems: 'center', padding: space[24], gap: space[8] }}>
      <View
        style={{
          width: 88,
          height: 88,
          borderRadius: 44,
          borderWidth: 2,
          borderStyle: 'dashed',
          borderColor: color.chipBorde,
          backgroundColor: color.inset,
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: space[16],
        }}
      >
        <Icon name={icon} size={36} />
      </View>
      <AppText weight="600" style={{ textAlign: 'center' }}>
        {title}
      </AppText>
      {description ? (
        <AppText tone="secundario" style={{ textAlign: 'center' }}>
          {description}
        </AppText>
      ) : null}
      {actionLabel && onAction ? (
        <View style={{ marginTop: space[16] }}>
          <Button label={actionLabel} onPress={onAction} />
        </View>
      ) : null}
    </View>
  );
}
