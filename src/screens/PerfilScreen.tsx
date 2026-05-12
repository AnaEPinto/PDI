import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert, ImageBackground, ActivityIndicator } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../../lib/supabase';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation, useFocusEffect } from '@react-navigation/native';

export default function PerfilScreen() {
  const navigation = useNavigation<any>();
  const [nomeUtilizador, setNomeUtilizador] = useState("A carregar...");
  const [emailUtilizador, setEmailUtilizador] = useState("");
  const [userCargo, setUserCargo] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useFocusEffect(
    useCallback(() => {
      fetchUserData();
    }, [])
  );

  const fetchUserData = async () => {
    try {
      setLoading(true);
      const userId = await AsyncStorage.getItem('userId');
      if (!userId) {
        Alert.alert("Erro", "Sessão expirada.");
        navigation.replace('Login');
        return;
      }

      const { data, error } = await supabase
        .from('utilizadores')
        .select('nome, email, permissao')
        .eq('id', userId)
        .single();

      if (error) throw error;

      if (data) {
        setNomeUtilizador(data.nome);
        setEmailUtilizador(data.email);
        const cargoLimpo = data.permissao ? data.permissao.trim().toLowerCase() : 'normal';
        setUserCargo(cargoLimpo);
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
            await AsyncStorage.removeItem('userId');
            await AsyncStorage.removeItem('userCargo');
            navigation.replace('Login');
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

      {/* ✅ ScrollView a envolver tudo */}
      <ScrollView showsVerticalScrollIndicator={false}>

        {/* Header */}
        <View style={styles.header}>
          <ImageBackground
            source={require('../../assets/header_home.jpg')}
            style={styles.headerBackground}
          >
            <View style={styles.imageFilter} />
            <View style={styles.overlay}>
              <Text style={styles.headerSubtitle}>ISCAC</Text>
              <Text style={styles.headerTitle}>O Meu Perfil</Text>
            </View>
          </ImageBackground>
        </View>

        <View style={styles.content}>

          {/* Card do utilizador */}
          <View style={styles.userCard}>
            <Ionicons name="person-circle-outline" size={60} color="#5d5d5d" />
            <View style={styles.userInfo}>
              {loading ? (
                <ActivityIndicator color="#1157ed" size="small" style={{ alignSelf: 'flex-start' }} />
              ) : (
                <React.Fragment>
                  <Text style={styles.userName}>{nomeUtilizador}</Text>
                  <Text style={styles.userEmail}>{emailUtilizador}</Text>
                  {userCargo === 'admin' && (
                    <Text style={styles.adminTag}>Administrador</Text>
                  )}
                </React.Fragment>
              )}
            </View>
          </View>

          {/* Menu */}
          <View style={styles.menuContainer}>
            {userCargo === 'admin' && (
              <TouchableOpacity
                activeOpacity={0.7}
                style={styles.adminMenuItem}
                onPress={() => navigation.navigate('PainelAdmin')}
              >
                <View style={styles.menuItemLeft}>
                  <Ionicons name="shield-checkmark" size={22} color="#1157ed" />
                  <Text style={styles.adminMenuText}>Painel de Aprovações</Text>
                </View>
                <View style={styles.notificationBadge}>
                  <Ionicons name="chevron-forward-outline" size={20} color="#fff" />
                </View>
              </TouchableOpacity>
            )}
            <MenuItem icon="calendar-outline" title="Meus Eventos" onPress={() => navigation.navigate('MeusEventos')} />
          </View>

          {/* Logout */}
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
  header: { backgroundColor: 'transparent' },
  headerBackground: { width: '100%', height: 170, overflow: 'hidden', borderBottomLeftRadius: 20, borderBottomRightRadius: 20 },
  imageFilter: { ...StyleSheet.absoluteFillObject, backgroundColor: '#00000060' },
  overlay: { flex: 1, paddingHorizontal: 20, paddingBottom: 20, justifyContent: 'flex-end' },
  headerSubtitle: { color: '#ffffffaa', fontSize: 12, fontWeight: '600', letterSpacing: 2, textTransform: 'uppercase', marginBottom: 4 },
  headerTitle: { color: '#fff', fontSize: 22, fontWeight: '800', marginBottom: 8 },
  content: { paddingHorizontal: 20, paddingTop: 10, paddingBottom: 40 },
  userCard: { flexDirection: "row", alignItems: "center", backgroundColor: "#fff", padding: 20, borderRadius: 12, marginBottom: 25, elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 5 },
  userInfo: { marginLeft: 15, flex: 1 },
  userName: { fontSize: 18, fontWeight: "bold", color: "#000", marginBottom: 4 },
  userEmail: { fontSize: 14, color: "#666" },
  adminTag: { color: '#1157ed', fontSize: 12, fontWeight: 'bold', marginTop: 4, backgroundColor: '#e6f0ff', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6, alignSelf: 'flex-start' },
  menuContainer: { marginBottom: 30 },
  menuItem: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", backgroundColor: "#fff", paddingVertical: 16, paddingHorizontal: 20, borderRadius: 12, marginBottom: 10, elevation: 1, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 3 },
  menuItemLeft: { flexDirection: "row", alignItems: "center" },
  menuItemText: { fontSize: 15, fontWeight: "600", color: "#333", marginLeft: 15 },
  adminMenuItem: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", backgroundColor: "#e6f0ff", paddingVertical: 16, paddingHorizontal: 20, borderRadius: 12, marginBottom: 15, borderWidth: 1, borderColor: '#bbd3ff' },
  adminMenuText: { fontSize: 15, fontWeight: "bold", color: "#1157ed", marginLeft: 15 },
  notificationBadge: { backgroundColor: '#1157ed', borderRadius: 15, width: 26, height: 26, alignItems: 'center', justifyContent: 'center' },
  logoutButton: { flexDirection: "row", alignItems: "center", justifyContent: "center", backgroundColor: "#ffebee", paddingVertical: 16, borderRadius: 12, marginBottom: 30, elevation: 1 },
  logoutText: { fontSize: 16, fontWeight: "bold", color: "#e53935", marginLeft: 10 },
});