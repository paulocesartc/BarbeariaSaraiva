import React from 'react';
import { View, TouchableOpacity, StyleSheet } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors } from '../theme/colors';
import { useTheme } from '../theme/ThemeContext';

import DashboardScreen from '../screens/DashboardScreen';
import AgendaScreen from '../screens/AgendaScreen';
import ClientesScreen from '../screens/ClientesScreen';
import ClientePerfilScreen from '../screens/ClientePerfilScreen';
import ServicosScreen from '../screens/ServicosScreen';
import NovoAgendamentoScreen from '../screens/NovoAgendamentoScreen';
import ConfiguracoesScreen from '../screens/ConfiguracoesScreen';
import DiasBloqueadosScreen from '../screens/DiasBloqueadosScreen';
import HorariosScreen from '../screens/HorariosScreen';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

function CustomTabButton({ children, onPress }) {
  const { primaryColor } = useTheme();
  return (
    <TouchableOpacity
      style={styles.customTabBtn}
      onPress={onPress}
      activeOpacity={0.8}
    >
      <View style={[
        styles.customTabBtnInner,
        { backgroundColor: primaryColor, shadowColor: primaryColor },
      ]}>
        {children}
      </View>
    </TouchableOpacity>
  );
}

function TabNavigator() {
  const insets = useSafeAreaInsets();
  const { primaryColor } = useTheme();

  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          ...styles.tabBar,
          height: 70 + insets.bottom,
          paddingBottom: insets.bottom + 10,
        },
        tabBarActiveTintColor: primaryColor,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarLabelStyle: styles.tabLabel,
      }}
    >
      <Tab.Screen
        name="Home"
        component={DashboardScreen}
        options={{
          tabBarLabel: 'Inicio',
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="home" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="Agenda"
        component={AgendaScreen}
        options={{
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons
              name="calendar-month"
              size={size}
              color={color}
            />
          ),
        }}
      />
      <Tab.Screen
        name="NovoAgendamentoTab"
        component={NovoAgendamentoScreen}
        options={{
          tabBarLabel: '',
          tabBarIcon: () => (
            <View style={{ marginTop: 4 }}>
              <MaterialCommunityIcons
                name="plus"
                size={30}
                color={colors.background}
              />
            </View>
          ),
          tabBarButton: (props) => <CustomTabButton {...props} />,
        }}
      />
      <Tab.Screen
        name="Clientes"
        component={ClientesScreen}
        options={{
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons
              name="account-group"
              size={size}
              color={color}
            />
          ),
        }}
      />
      <Tab.Screen
        name="Servicos"
        component={ServicosScreen}
        options={{
          tabBarLabel: 'Servicos',
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons
              name="content-cut"
              size={size}
              color={color}
            />
          ),
        }}
      />
    </Tab.Navigator>
  );
}

export default function AppNavigator() {
  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="MainTabs" component={TabNavigator} />
        <Stack.Screen
          name="NovoAgendamento"
          component={NovoAgendamentoScreen}
          options={{ presentation: 'modal', animation: 'slide_from_bottom' }}
        />
        <Stack.Screen
          name="ClientePerfil"
          component={ClientePerfilScreen}
          options={{ animation: 'slide_from_right' }}
        />
        <Stack.Screen
          name="Configuracoes"
          component={ConfiguracoesScreen}
          options={{ animation: 'slide_from_right' }}
        />
        <Stack.Screen
          name="DiasBloqueados"
          component={DiasBloqueadosScreen}
          options={{ animation: 'slide_from_right' }}
        />
        <Stack.Screen
          name="Horarios"
          component={HorariosScreen}
          options={{ animation: 'slide_from_right' }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    height: 70,
    paddingBottom: 10,
    paddingTop: 6,
    position: 'absolute',
    elevation: 0,
  },
  tabLabel: {
    fontSize: 11,
    fontWeight: '600',
  },
  customTabBtn: {
    top: -20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  customTabBtnInner: {
    width: 58,
    height: 58,
    borderRadius: 29,
    justifyContent: 'center',
    alignItems: 'center',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 8,
  },
});
