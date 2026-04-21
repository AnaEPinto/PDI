import React from "react";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { Ionicons } from "@expo/vector-icons";

import HomeScreen from "../screens/HomeScreen";
import EventosScreen from "../screens/EventosScreen";
import CalendarioScreen from "../screens/CalendarioScreen";
import PerfilScreen from "../screens/PerfilScreen";
import EventoDetalhesScreen from "../screens/EventoDetalhesScreen";
import InscricoesScreen from '../screens/InscricoesScreen';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

function TabNavigator() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: "#1157ed",
        tabBarInactiveTintColor: "#888",
      }}
    >
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={{
          tabBarIcon: ({ color }) => (
            <Ionicons name="home-outline" size={24} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="Eventos"
        component={EventosScreen}
        options={{
          tabBarIcon: ({ color }) => (
            <Ionicons name="ticket-outline" size={24} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="Calendario"
        component={CalendarioScreen}
        options={{
          tabBarIcon: ({ color }) => (
            <Ionicons name="calendar-outline" size={24} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="Perfil"
        component={PerfilScreen}
        options={{
          tabBarIcon: ({ color }) => (
            <Ionicons name="person-outline" size={24} color={color} />
          ),
        }}
      />
    </Tab.Navigator>
  );
}

export default function AppNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="MainTabs" component={TabNavigator} />
      <Stack.Screen name="Detalhes" component={EventoDetalhesScreen} />
    </Stack.Navigator>
  );
}