import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ImageBackground, FlatList, ActivityIndicator, Image, TouchableOpacity } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../../lib/supabase';
import { useNavigation } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage'; // <-- Importação necessária

export interface Evento {
  id: number;
  titulo: string;
  data: string;
  hora: string;
  local: string;
  categoria: string;
  imagem: string | null;
  organizador: string;
}

export default function HomeScreen() {
  const [eventosDestaque, setEventosDestaque] = useState<Evento[]>([]);
  const [loading, setLoading] = useState(true);
  const [nomeUtilizador, setNomeUtilizador] = useState("Utilizador"); 
  const navigation = useNavigation<any>();

  useEffect(() => {
    async function carregarPerfil() {
      try {
        const userId = await AsyncStorage.getItem('userId');
        if (userId) {
          const { data, error } = await supabase
            .from('utilizadores')
            .select('nome')
            .eq('id', userId)
            .single();

          if (data && !error) {
            const nome = data.nome;
            setNomeUtilizador(nome);
          }
        }
      } catch (err) {
        console.error("Erro ao carregar nome:", err);
      }
    }

    async function carregarDestaques() {
      try {
        const { data, error } = await supabase
          .from('eventos')
          .select('*')
          .order('data', { ascending: true })
          .limit(5);
        if (error) throw error;
        setEventosDestaque(data || []);
      } catch (err) {
        console.error("Erro ao carregar destaques:", err);
      } finally {
        setLoading(false);
      }
    }

    carregarPerfil();
    carregarDestaques();
  }, []);

  return (
    <View style={styles.container}>
      <StatusBar style="light" />

      <ImageBackground
        source={require("../../assets/header_home.jpg")}
        style={styles.headerBackground}
      >
        <View style={styles.imageFilter} />
        <View style={styles.overlay}>
          <View style={styles.titleContainer}>
            <Text style={styles.headerTitle}>Coimbra Business School | ISCAC</Text>
          </View>
        </View>
      </ImageBackground>

      <View style={styles.welcomeSection}>
        <Text style={styles.welcomeText}>Olá, {nomeUtilizador}! </Text>
        <Text style={styles.subtitleText}>Vê o que está prestes a acontecer no ISCAC.</Text>
      </View>

      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Próximos Eventos</Text>
        <TouchableOpacity onPress={() => navigation.navigate('Eventos')}>
          <Text style={styles.seeAllText}>Ver todos</Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <ActivityIndicator size="large" color="#1157ed" style={{ marginTop: 50 }} />
      ) : (
        <FlatList
          data={eventosDestaque}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 20 }}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => {
            const dataFormatada = item.data.split("-").reverse().join("/");
            return (
              <TouchableOpacity 
                activeOpacity={0.9} 
                style={styles.card}
                onPress={() => navigation.navigate('Detalhes', { evento: item })}
              >
                {item.imagem ? (
                  <Image source={{ uri: item.imagem }} style={styles.cardImage} />
                ) : (
                  <View style={[styles.cardImage, styles.imagePlaceholder]}>
                    <Ionicons name="images-outline" size={30} color="#999" />
                  </View>
                )}
                <View style={styles.cardBody}>
                  <Text style={styles.cardOrg}>{item.organizador || "ISCAC"}</Text>
                  <Text style={styles.cardTitle} numberOfLines={2}>{item.titulo}</Text>
                  <View style={styles.cardFooter}>
                    <View style={styles.infoRow}>
                      <Ionicons name="calendar-outline" size={14} color="#666" />
                      <Text style={styles.cardInfo}>{dataFormatada}</Text>
                    </View>
                    <View style={styles.infoRow}>
                      <Ionicons name="location-outline" size={14} color="#666" />
                      <Text style={styles.cardInfo} numberOfLines={1}>{item.local}</Text>
                    </View>
                  </View>
                </View>
              </TouchableOpacity>
            );
          }}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="calendar-clear-outline" size={40} color="#ccc" />
              <Text style={styles.emptyText}>Não há eventos próximos agendados.</Text>
            </View>
          }
        />
      )}
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

  welcomeSection: { paddingHorizontal: 20, marginTop: 20, marginBottom: 20 },
  welcomeText: { fontSize: 24, fontWeight: 'bold', color: '#333' },
  subtitleText: { fontSize: 14, color: '#666', marginTop: 4 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, marginBottom: 15 },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', color: '#333' },
  seeAllText: { fontSize: 14, color: '#1157ed', fontWeight: 'bold' },
  card: { backgroundColor: '#fff', borderRadius: 12, marginBottom: 20, elevation: 3, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, overflow: 'hidden' },
  cardImage: { width: '100%', height: 140 },
  imagePlaceholder: { backgroundColor: "#eee", justifyContent: "center", alignItems: "center" },
  cardBody: { padding: 15 },
  cardOrg: { fontSize: 10, fontWeight: 'bold', color: '#1157ed', textTransform: 'uppercase', marginBottom: 4 },
  cardTitle: { fontSize: 18, fontWeight: 'bold', color: '#333', marginBottom: 12 },
  cardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderTopWidth: 1, borderTopColor: '#f0f0f0', paddingTop: 10 },
  infoRow: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  cardInfo: { fontSize: 12, color: '#666', marginLeft: 4 },
  emptyContainer: { alignItems: 'center', justifyContent: 'center', marginTop: 30 },
  emptyText: { color: '#999', marginTop: 10, fontSize: 14 },
});