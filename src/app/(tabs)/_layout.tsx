import { Tabs } from 'expo-router/js-tabs';

import { fontFamily } from '@/ui/AppText';
import { Icon, type IconName } from '@/ui/Icon';
import { color } from '@/ui/theme';

export default function TabsLayout() {
  return (
    <Tabs
      // Si llegaste a Campo desde una tarjeta del grupo, "atrás" vuelve al grupo.
      backBehavior="history"
      screenOptions={{
        // Cada vista dibuja su propia barra superior.
        headerShown: false,
        // Con el teclado abierto las pestañas se esconden: el campo de texto queda pegado al teclado.
        tabBarHideOnKeyboard: true,
        tabBarActiveTintColor: color.teal,
        tabBarInactiveTintColor: color.secundario,
        tabBarStyle: { backgroundColor: color.superficie, borderTopColor: color.divisor },
        tabBarLabelStyle: { fontFamily: fontFamily('600'), fontSize: 12 },
      }}
    >
      <Tabs.Screen name="index" options={{ title: 'Grupo', tabBarIcon: ({ focused }) => <TabIcon name="message-circle" focused={focused} /> }} />
      <Tabs.Screen name="campo" options={{ title: 'Campo', tabBarIcon: ({ focused }) => <TabIcon name="bar-chart-2" focused={focused} /> }} />
    </Tabs>
  );
}

// La pestaña activa va en teal, como pide la guía para "filtro o pestaña activa".
function TabIcon({ name, focused }: { name: IconName; focused: boolean }) {
  return <Icon name={name} size={22} tint={focused ? color.teal : color.secundario} />;
}
