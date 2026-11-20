import { View } from 'react-native';

import { formatValue } from '@/domain/format';
import { useNow } from '@/hooks/useNow';
import type { Table } from '@/server/mock-server';
import { AppText } from '@/ui/AppText';
import { Card } from '@/ui/Card';
import { color, space } from '@/ui/theme';

type Props = {
  table: Table;
};

type Column = Table['columns'][number];

// Una tabla del agente. Las columnas y las filas vienen del servidor: no se
// asume cuántas son ni qué traen. Cada celda se formatea por el tipo de su columna.
export function TableCard({ table }: Props) {
  const now = useNow();

  return (
    <Card title={table.title}>
      <View>
        <View style={{ flexDirection: 'row', gap: space[8], paddingBottom: space[8] }}>
          {table.columns.map((column) => (
            <AppText key={column.key} variant="caption" weight="600" tone="secundario" style={[cellStyle(column), { lineHeight: 16 }]}>
              {column.label}
            </AppText>
          ))}
        </View>

        {table.rows.map((row, index) => (
          <View
            key={index}
            style={{ flexDirection: 'row', gap: space[8], paddingVertical: space[8], borderTopWidth: 1, borderTopColor: color.divisor }}
          >
            {table.columns.map((column) => (
              <AppText key={column.key} tone="tinta" tabular style={cellStyle(column)}>
                {formatValue(row[column.key] ?? null, column.type, now, column.unit)}
              </AppText>
            ))}
          </View>
        ))}
      </View>
    </Card>
  );
}

// El texto va a la izquierda y ocupa más; los números y las fechas, a la
// derecha, para que las cifras queden encolumnadas.
function cellStyle(column: Column) {
  const isText = column.type === 'text';
  return { flex: isText ? 1.4 : 1, textAlign: isText ? 'left' : 'right' } as const;
}
