import { useState } from 'react';
import { View } from 'react-native';

import { AppText } from '@/ui/AppText';
import { Chip } from '@/ui/Chip';
import { Tag } from '@/ui/Tag';
import { TextField } from '@/ui/TextField';
import { space } from '@/ui/theme';

import type { MissingFieldModel } from './model';

type Props = {
  field: MissingFieldModel;
  /** Lo elegido hasta ahora; vacío si todavía nada. */
  value: string;
  onChange: (value: string) => void;
};

// Un campo que falta en un dato: se completa tocando una sugerencia o,
// si no está entre ellas, escribiendo el valor.
export function MissingField({ field, value, onChange }: Props) {
  const { suggestions } = field;
  // Sin sugerencias no hay nada que elegir: se escribe directo.
  const [writing, setWriting] = useState(suggestions.length === 0);

  return (
    <View style={{ gap: space[8] }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: space[8] }}>
        <AppText weight="600" tone="tinta">
          {field.label}
        </AppText>
        <Tag label="Falta" status="faltaDato" compact />
      </View>

      {suggestions.length > 0 ? (
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: space[8] }}>
          {suggestions.map((suggestion) => (
            <Chip
              key={suggestion}
              label={suggestion}
              selected={!writing && value === suggestion}
              onPress={() => {
                setWriting(false);
                onChange(suggestion);
              }}
            />
          ))}
          <Chip
            label="Otra"
            selected={writing}
            onPress={() => {
              setWriting(true);
              onChange('');
            }}
          />
        </View>
      ) : null}

      {writing ? (
        <TextField placeholder={field.placeholder} value={value} onChangeText={onChange} keyboardType={field.numeric ? 'decimal-pad' : 'default'} />
      ) : null}
    </View>
  );
}
