  import React from 'react';
  import { LogBox } from 'react-native';
  import { createNativeStackNavigator } from '@react-navigation/native-stack';
  import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
  import { Ionicons } from '@expo/vector-icons';

  import LoginScreen from '../screens/LoginScreen';
  import HomeScreen from '../screens/HomeScreen';
  import EventosScreen from '../screens/EventosScreen';
  import EventoDetalhesScreen from '../screens/EventoDetalhesScreen';
  import CalendarioScreen from '../screens/CalendarioScreen';
  import PerfilScreen from '../screens/PerfilScreen';
  import FavoritosScreen from '../screens/FavoritosScreen'; 
  import PainelAdminScreen from '../screens/PainelAdminScreen';
  import InscricoesAdmin from '../screens/InscricoesAdmin';
  import AddEventoAdmin from '../screens/AddEventoAdmin';
  import EditEventoAdmin from '../screens/EditEventoAdmin';
  import EliminarEventoAdmin from '../screens/EliminarEventoAdmin';
  import MeusEventosScreen from '../screens/MeusEventosScreen';
  import EventosListaAdminScreen from '../screens/EventosListaAdminScreen';
  import InscritosPorEventoScreen from '../screens/InscritosPorEventoScreen';
  import HistoricoEventosAdmin from '../screens/HistoricoEventosAdmin';

  const Stack = createNativeStackNavigator();
  const Tab = createBottomTabNavigator();
    
  function MainTabs() {
    return (
      <Tab.Navigator
        screenOptions={({ route }) => ({
          headerShown: false,
          tabBarActiveTintColor: '#1157ed',
          tabBarInactiveTintColor: '#999',
          tabBarStyle: { paddingBottom: 5, height: 60 },
          tabBarIcon: ({ color, size }) => {
            const icons: Record<string, string> = {
              Home: 'home-outline',
              Eventos: 'calendar-outline',
              Favoritos: 'heart-outline',
              Calendário: 'calendar-number-outline',
              Perfil: 'person-outline',
            };
            return <Ionicons name={icons[route.name] as any} size={size} color={color} />;
          },
        })}
      >
        <Tab.Screen name="Home" component={HomeScreen} />
        <Tab.Screen name="Eventos" component={EventosScreen} />
        <Tab.Screen name="Favoritos" component={FavoritosScreen} /> 
        <Tab.Screen name="Calendário" component={CalendarioScreen} />
        <Tab.Screen name="Perfil" component={PerfilScreen} />
      </Tab.Navigator>
    );
  }

  export default function AppNavigator() {
    return (
      <Stack.Navigator initialRouteName="Login" screenOptions={{ headerShown: false }}>
        <Stack.Screen name="Login" component={LoginScreen} />
        <Stack.Screen name="MainApp" component={MainTabs} />
        <Stack.Screen name="Detalhes" component={EventoDetalhesScreen} />
        <Stack.Screen name="PainelAdmin" component={PainelAdminScreen} />
        <Stack.Screen name="InscricoesAdmin" component={InscricoesAdmin} />
        <Stack.Screen name="AddEventoAdmin" component={AddEventoAdmin} />
        <Stack.Screen name="EditEventoAdmin" component={EditEventoAdmin} />
        <Stack.Screen name="EliminarEventoAdmin" component={EliminarEventoAdmin} /> 
        <Stack.Screen name="MeusEventos" component={MeusEventosScreen} />
        <Stack.Screen name="EventosListaAdmin" component={EventosListaAdminScreen} />
        <Stack.Screen name="InscritosPorEvento" component={InscritosPorEventoScreen} />
        <Stack.Screen name="HistoricoEventosAdmin" component={HistoricoEventosAdmin} />
      </Stack.Navigator>
    );
  }