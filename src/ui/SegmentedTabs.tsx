import { Pressable, View } from 'react-native';

import { AppText } from './AppText';
import { color, toqueMinimo } from './theme';

type Props<Key extends string> = {
  options: { key: Key; label: string }[];
  value: Key;
  onChange: (key: Key) => void;
};

// Pestañas dentro de una pantalla. La activa va en teal, como pide la guía.
export function SegmentedTabs<Key extends string>({ options, value, onChange }: Props<Key>) {
  return (
    <View style={{ flexDirection: 'row', backgroundColor: color.superficie, borderBottomWidth: 1, borderBottomColor: color.divisor }}>
      {options.map((option) => {
        const active = option.key === value;
        return (
          <Pressable
            key={option.key}
            accessibilityRole="tab"
            accessibilityState={{ selected: active }}
            onPress={() => onChange(option.key)}
            style={{
              flex: 1,
              height: toqueMinimo,
              alignItems: 'center',
              justifyContent: 'center',
              borderBottomWidth: 2,
              borderBottomColor: active ? color.teal : 'transparent',
            }}
          >
            <AppText weight="600" style={{ color: active ? color.teal : color.secundario }}>
              {option.label}
            </AppText>
          </Pressable>
        );
      })}
    </View>
  );
}
