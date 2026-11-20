import { View } from 'react-native';

import { AppText } from '@/ui/AppText';
import { Icon, type IconName } from '@/ui/Icon';
import { color, space } from '@/ui/theme';

type Props = {
  text: string;
  icon?: IconName;
};

// Una línea centrada, sin globo: el día ("Hoy"), un aviso del grupo
// ("Mariano agregó a Lucía") o quién cambió un dato.
export function CenterLine({ text, icon }: Props) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: space[4], paddingHorizontal: space[16] }}>
      {icon ? <Icon name={icon} size={14} tint={color.secundarioFuerte} /> : null}
      <AppText variant="caption" weight="500" tone="secundarioFuerte" style={{ textAlign: 'center', flexShrink: 1, lineHeight: 16 }}>
        {text}
      </AppText>
    </View>
  );
}
