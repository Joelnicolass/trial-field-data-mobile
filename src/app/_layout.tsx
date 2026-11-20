import { Inter_400Regular, Inter_500Medium, Inter_600SemiBold, Inter_700Bold, useFonts } from '@expo-google-fonts/inter';
import { Stack } from 'expo-router/stack';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { KeyboardProvider } from 'react-native-keyboard-controller';

import { color } from '@/ui/theme';

// El splash se queda hasta que carga la tipografía: sin esto el primer cuadro
// sale con la fuente del sistema y después salta a Inter.
SplashScreen.preventAutoHideAsync();

/** El ancho máximo de la app. Un teléfono nunca llega; una ventana de escritorio, sí. */
const MAX_APP_WIDTH = 480;

export default function RootLayout() {
  const [loaded, error] = useFonts({ Inter_400Regular, Inter_500Medium, Inter_600SemiBold, Inter_700Bold });

  useEffect(() => {
    if (loaded || error) SplashScreen.hideAsync();
  }, [loaded, error]);

  if (!loaded && !error) return null;

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      {/* Sin estas dos opciones, en Android el proveedor del teclado deja una franja
          vacía en el lugar de la barra de estado y de la de navegación. */}
      <KeyboardProvider statusBarTranslucent navigationBarTranslucent>
        {/* La barra superior es navy: los íconos del sistema van claros. */}
        <StatusBar style="light" />
        {/* En una pantalla ancha (la web, una tablet) la app no se estira: queda
            en una columna del ancho de un teléfono, centrada. */}
        <View style={{ flex: 1, alignItems: 'center', backgroundColor: color.divisor }}>
          <View style={{ flex: 1, width: '100%', maxWidth: MAX_APP_WIDTH }}>
            <Stack screenOptions={{ headerShown: false }} />
          </View>
        </View>
      </KeyboardProvider>
    </GestureHandlerRootView>
  );
}
