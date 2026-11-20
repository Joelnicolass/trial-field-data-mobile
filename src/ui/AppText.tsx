import { Text, type TextProps, type TextStyle } from 'react-native';

import { color, tipo } from './theme';

// Con una fuente propia, Android no elige el archivo por `fontWeight`:
// cada peso es una familia distinta. Por eso el peso se traduce acá.
const FAMILY = {
  '400': 'Inter_400Regular',
  '500': 'Inter_500Medium',
  '600': 'Inter_600SemiBold',
  '700': 'Inter_700Bold',
} as const;

export type Weight = keyof typeof FAMILY;
export type Variant = keyof typeof tipo;
export type Tone = keyof typeof color;

export function fontFamily(weight: Weight): string {
  return FAMILY[weight];
}

type Props = TextProps & {
  variant?: Variant;
  weight?: Weight;
  tone?: Tone;
  /** Cifras del mismo ancho, para números que cambian. */
  tabular?: boolean;
};

export function AppText({ variant = 'body1', weight, tone = 'cuerpo', tabular, style, ...rest }: Props) {
  const base = tipo[variant];
  const textStyle: TextStyle = {
    fontSize: base.fontSize,
    lineHeight: base.lineHeight,
    fontFamily: FAMILY[weight ?? base.fontWeight],
    color: color[tone],
    fontVariant: tabular ? ['tabular-nums'] : undefined,
  };
  return <Text {...rest} style={[textStyle, style]} />;
}
