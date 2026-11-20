import { View } from 'react-native';

import { AppText } from '@/ui/AppText';
import { Card } from '@/ui/Card';
import { color, space } from '@/ui/theme';

import type { TableModel } from './model';

type Props = {
  table: TableModel;
};

type Column = TableModel['columns'][number];

// Una tabla del agente. Dibuja las columnas y las filas que vengan, con las
// celdas ya formateadas.
export function TableCard({ table }: Props) {
  return (
    <Card title={table.title}>
      <View>
        <View style={{ flexDirection: 'row', gap: space[8], paddingBottom: space[8] }}>
          {table.columns.map((column) => (
            <AppText key={column.label} variant="caption" weight="600" tone="secundario" style={[cellStyle(column), { lineHeight: 16 }]}>
              {column.label}
            </AppText>
          ))}
        </View>

        {table.rows.map((cells, rowIndex) => (
          <View
            key={rowIndex}
            style={{ flexDirection: 'row', gap: space[8], paddingVertical: space[8], borderTopWidth: 1, borderTopColor: color.divisor }}
          >
            {cells.map((cell, columnIndex) => (
              <AppText key={columnIndex} tone="tinta" tabular style={cellStyle(table.columns[columnIndex])}>
                {cell}
              </AppText>
            ))}
          </View>
        ))}
      </View>
    </Card>
  );
}

// Las columnas alineadas a la izquierda (texto) ocupan más; las de la
// derecha (números y fechas) quedan encolumnadas.
function cellStyle(column: Column) {
  return { flex: column.align === 'left' ? 1.4 : 1, textAlign: column.align } as const;
}
