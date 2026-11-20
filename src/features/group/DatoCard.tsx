import { useState } from 'react';
import { Pressable, View } from 'react-native';

import { AppText } from '@/ui/AppText';
import { Button } from '@/ui/Button';
import { Card } from '@/ui/Card';
import { Icon } from '@/ui/Icon';
import { KeyValueRow } from '@/ui/KeyValueRow';
import { Tag } from '@/ui/Tag';
import { color, estado, space } from '@/ui/theme';

import { MissingField } from './MissingField';
import type { DatoModel } from './model';

type Props = {
  dato: DatoModel;
  /** Lleva a ese dato en la vista Campo. */
  onOpen?: () => void;
  /** Completa lo que falta, sin escribir otro mensaje: campo → valor. */
  onComplete?: (values: Record<string, string>) => void;
  /** Mientras se guarda lo que se completó. */
  saving?: boolean;
};

// Lo que anota el agente. Si alguien lo corrige, esta misma tarjeta cambia.
// Si falta algo, queda en naranja y deja completarlo ahí mismo.
export function DatoCard({ dato, onOpen, onComplete, saving = false }: Props) {
  // Lo que se va eligiendo para los campos que faltan.
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const hasAnswers = Object.values(answers).some((answer) => answer.trim() !== '');

  return (
    <Card style={dato.incomplete ? { borderColor: estado.faltaDato.borde } : undefined}>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: space[8] }}>
        <AppText variant="h4" tone="tinta">
          {dato.title}
        </AppText>
        <Tag label={dato.status.label} status={dato.status.tag} />
      </View>

      {dato.intro ? <AppText>{dato.intro}</AppText> : null}

      {dato.headline ? (
        <AppText variant="h2" tone="tinta" tabular>
          {dato.headline}
        </AppText>
      ) : null}

      <View>
        {dato.fields.map((field) => (
          <KeyValueRow key={field.label} label={field.label} value={field.value} />
        ))}
      </View>

      {dato.missing.map((field) => (
        <MissingField
          key={field.key}
          field={field}
          value={answers[field.key] ?? ''}
          onChange={(value) => setAnswers((current) => ({ ...current, [field.key]: value }))}
        />
      ))}

      {dato.incomplete && onComplete ? (
        <Button label="Completar" disabled={!hasAnswers} loading={saving} onPress={() => onComplete(answers)} />
      ) : null}

      {onOpen ? (
        <Pressable
          accessibilityRole="link"
          onPress={onOpen}
          hitSlop={8}
          style={{ flexDirection: 'row', alignItems: 'center', gap: space[4], paddingTop: space[4] }}
        >
          <AppText weight="600" tone="primario">
            Ver en el campo
          </AppText>
          <Icon name="chevron-right" size={16} tint={color.primario} />
        </Pressable>
      ) : null}
    </Card>
  );
}
