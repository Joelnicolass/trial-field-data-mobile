import { useRouter } from 'expo-router';
import { useState, type ReactNode } from 'react';
import { ScrollView, View } from 'react-native';

import { useAutoDismiss } from '@/hooks/useAutoDismiss';
import { AppText } from '@/ui/AppText';
import { Banner } from '@/ui/Banner';
import { Button } from '@/ui/Button';
import { Card } from '@/ui/Card';
import { Chip } from '@/ui/Chip';
import { EmptyState } from '@/ui/EmptyState';
import { ErrorNotice } from '@/ui/ErrorNotice';
import { IconButton } from '@/ui/IconButton';
import { KeyValueRow } from '@/ui/KeyValueRow';
import { LinkRow } from '@/ui/LinkRow';
import { ScreenHeader } from '@/ui/ScreenHeader';
import { SwitchRow } from '@/ui/SwitchRow';
import { Tag } from '@/ui/Tag';
import { TextField } from '@/ui/TextField';
import { color, space } from '@/ui/theme';

const CATEGORIES = ['Todas', 'Vacas', 'Terneros', 'Toros'];

// Todas las piezas genéricas en una pantalla, para verlas y ajustarlas.
// No es parte de la app: se llega desde Opciones.
export default function CatalogScreen() {
  const router = useRouter();
  const [category, setCategory] = useState(CATEGORIES[0]);
  const [search, setSearch] = useState('');
  const [noticeVisible, setNoticeVisible] = useState(false);
  const [switchOn, setSwitchOn] = useState(false);

  // El aviso de error dura 7 segundos, como pide la guía.
  useAutoDismiss(noticeVisible, () => setNoticeVisible(false), 7000);

  return (
    <View style={{ flex: 1, backgroundColor: color.fondo }}>
      <ScreenHeader
        title="Componentes"
        subtitle="Piezas base de la guía"
        right={<IconButton icon="x" accessibilityLabel="Cerrar" tint={color.sobreNavy} onPress={() => router.back()} />}
      />

      <ScrollView contentContainerStyle={{ padding: space[16], gap: space[24] }}>
        <Section title="Texto">
          <AppText variant="h1" tone="tinta" tabular>
            411 cabezas
          </AppText>
          <AppText variant="h2" tone="tinta">
            Stock del campo
          </AppText>
          <AppText variant="h3" tone="tinta" tabular>
            83,9 %
          </AppText>
          <AppText variant="h4" tone="tinta">
            Vaquillonas reposición
          </AppText>
          <AppText>Según el tacto del 14 de abril, tenés 151 vacas preñadas de 180 tactadas.</AppText>
          <AppText variant="caption" tone="secundario">
            Último pesaje 04/11
          </AppText>
        </Section>

        <Section title="Botones">
          <Button label="Confirmar" onPress={() => {}} />
          <Button label="Cancelar" variant="outlined" onPress={() => {}} />
          <Button label="Editar" variant="neutral" icon="edit-2" onPress={() => {}} />
          <Button label="Guardando" loading onPress={() => {}} />
          <Button label="No disponible" disabled onPress={() => {}} />
        </Section>

        <Section title="Chips de filtro">
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: space[8] }}>
            {CATEGORIES.map((name) => (
              <Chip key={name} label={name} selected={name === category} onPress={() => setCategory(name)} />
            ))}
          </View>
        </Section>

        <Section title="Etiquetas de estado">
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: space[8] }}>
            <Tag label="Preñada" status="activo" />
            <Tag label="Vendida" status="vendido" />
            <Tag label="Por vencer" status="pendiente" />
            <Tag label="Sin conexión" status="error" />
            <Tag label="Dada de baja" status="archivado" />
            <Tag label="Programado" status="info" />
            <Tag label="Falta un dato" status="faltaDato" />
          </View>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: space[8] }}>
            <Tag label="Preñada" status="activo" compact />
            <Tag label="Vacía" status="archivado" compact />
          </View>
        </Section>

        <Section title="Tarjeta con filas">
          <Card title="Vaquillonas reposición">
            <View>
              <KeyValueRow label="Cabezas" value="74" />
              <KeyValueRow label="Peso promedio" value="321,1 kg" />
              <KeyValueRow label="Último pesaje" value="04/11" />
            </View>
          </Card>
        </Section>

        <Section title="Campo de texto">
          <TextField icon="search" placeholder="Buscar por caravana" value={search} onChangeText={setSearch} keyboardType="number-pad" />
          <TextField placeholder="Milímetros" value="abc" error="Tiene que ser un número." />
        </Section>

        <Section title="Error al cargar">
          <Card>
            <EmptyState
              icon="alert-triangle"
              title="No pudimos cargar el contenido"
              description="Revisá tu conexión y probá de nuevo."
              actionLabel="Reintentar"
              onAction={() => {}}
            />
          </Card>
        </Section>

        <Section title="Aviso de error">
          <Button label="Mostrar el aviso" variant="outlined" onPress={() => setNoticeVisible(true)} />
          {noticeVisible ? <ErrorNotice message="No se pudo enviar el mensaje." onClose={() => setNoticeVisible(false)} /> : null}
        </Section>

        <Section title="Aviso fijo">
          <Banner icon="wifi-off" title="Sin conexión" text="Lo que mandes sale solo cuando vuelva la señal." />
        </Section>

        <Section title="Filas de opciones">
          <Card>
            <SwitchRow label="Simular que no hay señal" description="Qué cambia al prenderlo." value={switchOn} onValueChange={setSwitchOn} />
            <LinkRow icon="grid" label="Componentes" description="Adónde lleva, en una línea." onPress={() => {}} />
          </Card>
        </Section>
      </ScrollView>
    </View>
  );
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <View style={{ gap: space[12] }}>
      <AppText variant="caption" weight="600" tone="secundarioFuerte">
        {title.toUpperCase()}
      </AppText>
      {children}
    </View>
  );
}
