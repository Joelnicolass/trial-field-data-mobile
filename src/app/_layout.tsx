import { Inter_400Regular, Inter_500Medium, Inter_600SemiBold, Inter_700Bold, useFonts } from '@expo-google-fonts/inter';
import { Stack } from 'expo-router/stack';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { KeyboardProvider } from 'react-native-keyboard-controller';

// El splash se queda hasta que carga la tipografía: sin esto el primer cuadro
// sale con la fuente del sistema y después salta a Inter.
SplashScreen.preventAutoHideAsync();

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
        <Stack screenOptions={{ headerShown: false }} />
      </KeyboardProvider>
    </GestureHandlerRootView>
  );
}
