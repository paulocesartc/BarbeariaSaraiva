import React, { useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import AppNavigator from './src/navigation/AppNavigator';
import Toast from './src/components/Toast';
import { toastRef } from './src/hooks/useToast';
import { setupNotifications } from './src/services/notifications';

export default function App() {
  useEffect(() => {
    setupNotifications();
  }, []);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <StatusBar style="light" backgroundColor="#0D0D0D" />
        <AppNavigator />
        <Toast
          ref={(instance) => {
            toastRef.current = instance;
          }}
        />
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
