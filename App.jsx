import React, { useRef } from 'react';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import AppNavigator from './src/navigation/AppNavigator';
import Toast from './src/components/Toast';
import { toastRef } from './src/hooks/useToast';

export default function App() {
  const ref = useRef(null);

  React.useLayoutEffect(() => {
    toastRef.current = ref.current;
  }, []);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <StatusBar style="light" backgroundColor="#0D0D0D" />
        <AppNavigator />
        <Toast ref={ref} />
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
