import { useState } from 'react';
import { Pressable, View } from 'react-native';

import { formatQuantity, formatValue } from '@/domain/format';
import { useNow } from '@/hooks/useNow';
import type { Dato, Field } from '@/server/mock-server';
import { AppText } from '@/ui/AppText';
import { Button } from '@/ui/Button';
import { Card } from '@/ui/Card';
import { Icon } from '@/ui/Icon';
import { KeyValueRow } from '@/ui/KeyValueRow';
import { Tag, type TagStatus } from '@/ui/Tag';
import { color, estado, space } from '@/ui/theme';

import { MissingField } from './MissingField';

type Props = {
  /** El dato como está ahora: si alguien lo corrigió, esta misma tarjeta cambia. */
  dato: Dato;
  /** Lo que dice el agente al anotarlo: "Anoté la lluvia." */
  intro?: string | null;
  /** Lleva a ese dato en la vista Campo. */
  onOpen?: () => void;
  /** Completa lo que falta, sin escribir otro mensaje: campo → valor. */
  onComplete?: (values: Record<string, string>) => void;
  /** Mientras se guarda lo que se completó. */
  saving?: boolean;
};

const STATUS: Record<Dato['status'], { label: string; tag: TagStatus }> = {
  saved: { label: 'Guardado', tag: 'activo' },
  incomplete: { label: 'Falta un dato', tag: 'faltaDato' },
  deleted: { label: 'Eliminado', tag: 'archivado' },
};

// Lo que anota el agente. No asume qué campos trae: muestra los que vengan,
// cada uno según su tipo. Si falta algo, la tarjeta queda en naranja y deja
// completarlo ahí mismo.
export function DatoCard({ dato, intro, onOpen, onComplete, saving = false }: Props) {
  const now = useNow();
  const [answers, setAnswers] = useState<Record<string, string>>({});

  const status = STATUS[dato.status];
  const incomplete = dato.status === 'incomplete';
  const headline = findHeadline(dato.fields);
  const filled = dato.fields.filter((field) => field.value !== null && field !== headline);
  const missing = dato.fields.filter((field) => field.value === null);
  const hasAnswers = Object.values(answers).some((answer) => answer.trim() !== '');

  return (
    <Card style={incomplete ? { borderColor: estado.faltaDato.borde } : undefined}>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: space[8] }}>
        <AppText variant="h4" tone="tinta">
          {dato.title}
        </AppText>
        <Tag label={status.label} status={status.tag} />
      </View>

      {intro ? <AppText>{intro}</AppText> : null}

      {headline ? (
        <AppText variant="h2" tone="tinta" tabular>
          {formatQuantity(headline.value as number, headline.unit)}
        </AppText>
      ) : null}

      <View>
        {filled.map((field) => (
          <KeyValueRow key={field.key} label={field.label} value={formatValue(field.value, field.type, now, field.unit)} />
        ))}
      </View>

      {incomplete
        ? missing.map((field) => (
            <MissingField
              key={field.key}
              field={field}
              suggestions={dato.suggestions[field.key] ?? []}
              value={answers[field.key] ?? ''}
              onChange={(value) => setAnswers((current) => ({ ...current, [field.key]: value }))}
            />
          ))
        : null}

      {incomplete && onComplete ? (
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

// Si el dato tiene un número con unidad (23 mm), ese es el titular y va grande.
// Si no lo tiene, todos los campos van como filas.
function findHeadline(fields: Field[]): Field | undefined {
  return fields.find((field) => field.type === 'number' && typeof field.value === 'number' && field.unit !== undefined);
}
