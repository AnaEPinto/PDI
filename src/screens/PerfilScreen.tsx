import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert, ImageBackground, ActivityIndicator } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../../lib/supabase';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation } from '@react-navigation/native';

export default function PerfilScreen() {
  const navigation = useNavigation<any>();
  
  // Estados para os dados reais
  const [nomeUtilizador, setNomeUtilizador] = useState("A carregar...");
  const [emailUtilizador, setEmailUtilizador] = useState("");
  const [loading, setLoading] = useState(true);

  // Carregar dados da Base de Dados ao abrir o ecrã
  useEffect(() => {
    fetchUserData();
  }, []);

  const fetchUserData = async () => {
    try {
      setLoading(true);
      
      // 1. Ir buscar o ID guardado no telemóvel
      const userId = await AsyncStorage.getItem('userId');
      
      if (!userId) {
        Alert.alert("Erro", "Sessão expirada.");
        navigation.replace('Login');
        return;
      }

      // 2. Consultar a tabela 'utilizadores' no Supabase
      const { data, error } = await supabase
        .from('utilizadores')
        .select('nome, email')
        .eq('id', userId)
        .single();

      if (error) throw error;

      if (data) {
        setNomeUtilizador(data.nome);
        setEmailUtilizador(data.email);
      }
    } catch (error: any) {
      console.error("Erro ao carregar perfil:", error.message);
      setNomeUtilizador("Erro no Perfil");
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    Alert.alert(
      "Terminar Sessão",
      "Tens a certeza que queres sair da tua conta?",
      [
        { text: "Cancelar", style: "cancel" },
        { 
          text: "Sair", 
          style: "destructive", 
          onPress: async () => {
            await AsyncStorage.removeItem('userId'); // Limpa o ID
            navigation.replace('Login'); // Volta para o Login
          } 
        }
      ]
    );
  };

  const MenuItem = ({ icon, title, onPress }: { icon: keyof typeof Ionicons.glyphMap, title: string, onPress: () => void }) => (
    <TouchableOpacity activeOpacity={0.7} style={styles.menuItem} onPress={onPress}>
      <View style={styles.menuItemLeft}>
        <Ionicons name={icon} size={22} color="#333" />
        <Text style={styles.menuItemText}>{title}</Text>
      </View>
      <Ionicons name="chevron-forward-outline" size={20} color="#999" />
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <StatusBar style="light" backgroundColor="transparent" translucent={true} />
      
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <ImageBackground source={require("../../assets/header_home.jpg")} style={styles.headerBackground}>
            <View style={styles.imageFilter} />
            <View style={styles.overlay}>
              <View style={styles.titleContainer}>
                <Text style={styles.headerTitle}>Perfil do Aluno</Text>
              </View>
            </View>
          </ImageBackground>
        </View>

        <View style={styles.content}>
          <View style={styles.userCard}>
            <Ionicons name="person-circle-outline" size={60} color="#5d5d5d" />
            <View style={styles.userInfo}>
              {loading ? (
                <ActivityIndicator color="#1157ed" size="small" style={{ alignSelf: 'flex-start' }} />
              ) : (
                <>
                  <Text style={styles.userName}>{nomeUtilizador}</Text>
                  <Text style={styles.userEmail}>{emailUtilizador}</Text>
                </>
              )}
            </View>
          </View>

          <View style={styles.menuContainer}>
            <MenuItem icon="calendar-outline" title="Meus Eventos" onPress={() => {}} />
            <MenuItem icon="notifications-outline" title="Notificações" onPress={() => {}} />
            <MenuItem icon="settings-outline" title="Definições" onPress={() => {}} />
          </View>

          <TouchableOpacity activeOpacity={0.8} style={styles.logoutButton} onPress={handleLogout}>
            <Ionicons name="log-out-outline" size={20} color="#e53935" />
            <Text style={styles.logoutText}>Terminar Sessão</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f5f5f5" },
  header: { backgroundColor: "transparent", paddingBottom: 10 },
  headerBackground: { width: "100%", height: 160, overflow: "hidden", borderBottomLeftRadius: 15, borderBottomRightRadius: 15 },
  imageFilter: { ...StyleSheet.absoluteFillObject, backgroundColor: "#00000044" },
  overlay: { flex: 1, paddingHorizontal: 15, paddingBottom: 30, justifyContent: "flex-end" },
  titleContainer: { backgroundColor: "#ffffffa8", paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8, alignSelf: 'flex-start' },
  headerTitle: { color: "#000", fontSize: 18, fontWeight: "bold" },
  content: { paddingHorizontal: 20, paddingTop: 10 },
  userCard: { flexDirection: "row", alignItems: "center", backgroundColor: "#fff", padding: 20, borderRadius: 12, marginBottom: 25, elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 5 },
  userInfo: { marginLeft: 15, flex: 1 },
  userName: { fontSize: 18, fontWeight: "bold", color: "#000", marginBottom: 4 },
  userEmail: { fontSize: 14, color: "#666" },
  menuContainer: { marginBottom: 30 },
  menuItem: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", backgroundColor: "#fff", paddingVertical: 16, paddingHorizontal: 20, borderRadius: 12, marginBottom: 10, elevation: 1, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 3 },
  menuItemLeft: { flexDirection: "row", alignItems: "center" },
  menuItemText: { fontSize: 15, fontWeight: "600", color: "#333", marginLeft: 15 },
  logoutButton: { flexDirection: "row", alignItems: "center", justifyContent: "center", backgroundColor: "#ffebee", paddingVertical: 16, borderRadius: 12, elevation: 1, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 3   },
  logoutText: { fontSize: 16, fontWeight: "bold", color: "#e53935", marginLeft: 10 }
});