import React, { useState, useCallback } from 'react';
import { 
  View, Text, StyleSheet, FlatList, TouchableOpacity, Image, TextInput, 
  ActivityIndicator, ScrollView, ImageBackground 
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../../lib/supabase';
import { useNavigation, useFocusEffect } from '@react-navigation/native';

export interface EventoType {
  id: number;
  titulo: string;
  data: string; 
  hora: string; 
  local: string;
  imagem: string;
  participantes_atual: number; 
  participantes_max: number;   
  tipo_evento: string;                
  descricao: string;
}

const EventCard = ({ evento }: { evento: EventoType }) => {
  const navigation = useNavigation<any>();
  
  const dataFormatada = evento.data ? evento.data.split("-").reverse().join("/") : "S/D";
  
  const inscritos = evento.participantes_atual || 0;
  const lotacao = evento.participantes_max || 0;

  return (
    <TouchableOpacity 
      activeOpacity={0.9} 
      style={styles.card}
      onPress={() => navigation.navigate('Detalhes', { evento })} 
    >
      <View style={styles.imageContainer}>
        {evento.imagem ? (
          <Image 
            source={{ uri: evento.imagem }} 
            style={styles.cardImage} 
            resizeMode="cover" 
          />
        ) : (
          <View style={[styles.cardImage, styles.imagePlaceholder]}>
            <Ionicons name="images-outline" size={30} color="#999" />
          </View>
        )}
        
        <View style={styles.tagBadge}>
          <Text style={styles.tagText}>{evento.tipo_evento}</Text>
        </View>
      </View>

      <View style={styles.cardContent}>
        <Text style={styles.eventTitle} numberOfLines={1}>{evento.titulo}</Text>
        
        <View style={styles.infoRow}>
          <Ionicons name="calendar-outline" size={16} color="#666" />
          <Text style={styles.infoText}>{dataFormatada} • {evento.hora?.substring(0, 5) || "--:--"}</Text>
        </View>
        
        <View style={styles.infoRow}>
          <Ionicons name="location-outline" size={16} color="#666" />
          <Text style={styles.infoText} numberOfLines={1}>{evento.local || "ISCAC"}</Text>
        </View>
        
        <View style={styles.infoRow}>
          <Ionicons name="people-outline" size={16} color="#666" />
          <Text style={styles.infoText}>{inscritos}/{lotacao} inscritos</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
};

export default function EventosScreen() {
  const [eventos, setEventos] = useState<EventoType[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filtroAtivo, setFiltroAtivo] = useState("Todos");
  const [busca, setBusca] = useState("");

  const carregarDados = async (showRefreshIndicator = false) => {
  try {
    if (!showRefreshIndicator) setLoading(true);
    
    const hoje = new Date().toISOString().split('T')[0]; 

    const { data, error } = await supabase
      .from("eventos")
      .select("*")
      .gte("data", hoje) 
      .order("data", { ascending: true });

    if (error) throw error;
    setEventos(data || []);
  } catch (err: any) {
    console.error("Erro ao carregar:", err.message);
  } finally {
    setLoading(false);
    setRefreshing(false);
  }
  };

  useFocusEffect(
    useCallback(() => {
      carregarDados();
    }, [])
  );

  const eventosFiltrados = eventos.filter(evento => {
    const categoriaBate = filtroAtivo === "Todos" || evento.tipo_evento === filtroAtivo;
    const buscaBate = (evento.titulo || "").toLowerCase().includes(busca.toLowerCase()) || 
      (evento.local && evento.local.toLowerCase().includes(busca.toLowerCase()));
    return categoriaBate && buscaBate;
  });

  return (
    <View style={styles.container}>
      <StatusBar style="light" backgroundColor="transparent" translucent={true} />
      
       <View style={styles.header}>
        <ImageBackground
          source={require('../../assets/header_home.jpg')}
          style={styles.headerBackground}
        >
          <View style={styles.imageFilter} />
          <View style={styles.overlay}>
            <Text style={styles.headerSubtitle}>ISCAC</Text>
            <Text style={styles.headerTitle}>Eventos</Text>
          </View>
        </ImageBackground>
      
        <View style={styles.searchBar}>
          <Ionicons name="search-outline" size={18} color="#999" />
          <TextInput 
            placeholder="Pesquisar eventos..." 
            style={styles.searchInput} 
            placeholderTextColor="#999"
            value={busca}
            onChangeText={setBusca}
          />
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterBar}>
          {["Todos", "Conferência", "Networking", "Seminário", "Workshop"].map((cat) => (
            <TouchableOpacity 
              key={cat} 
              onPress={() => setFiltroAtivo(cat)} 
              style={[styles.filterBtn, filtroAtivo === cat && styles.activeFilter]}
            >
              <Text style={[styles.filterText, filtroAtivo === cat && { color: 'white' }]}>
                {cat}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <FlatList
        data={eventosFiltrados}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => <EventCard evento={item} />}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        refreshing={refreshing} 
        onRefresh={() => { setRefreshing(true); carregarDados(true); }}
        ListEmptyComponent={() => (
          loading ? <ActivityIndicator size="large" color="#1157ed" style={{ marginTop: 50 }} /> : 
          <View style={styles.emptyContainer}>
            <Ionicons name="ticket-outline" size={50} color="#ccc" />
            <Text style={styles.emptyText}>Nenhum evento encontrado.</Text>
          </View>
        )}
      />
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

  searchBar: { backgroundColor: "#fff", flexDirection: "row", alignItems: "center", padding: 12, marginHorizontal: 15, borderRadius: 10, marginTop: -25, elevation: 5, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 10 },
  searchInput: { flex: 1, marginLeft: 10, fontSize: 15 },
  filterBar: { padding: 15, paddingBottom: 10 },
  filterBtn: { backgroundColor: "white", paddingHorizontal: 16, paddingVertical: 8, marginRight: 10, borderRadius: 20, borderWidth: 1, borderColor: "#eee" },
  activeFilter: { backgroundColor: "#1157ed", borderColor: "#1157ed" },
  filterText: { color: "#666", fontWeight: "bold", fontSize: 13 },
  listContent: { padding: 15, paddingBottom: 80 },
  card: { backgroundColor: '#fff', borderRadius: 12, marginBottom: 20, elevation: 3, overflow: 'hidden' },
  imageContainer: { width: "100%", height: 170 },
  cardImage: { width: '100%', height: '100%' },
  imagePlaceholder: { backgroundColor: "#eee", justifyContent: "center", alignItems: "center" },
  tagBadge: { position: "absolute", top: 12, left: 12, backgroundColor: "#1157ed", paddingHorizontal: 10, paddingVertical: 5, borderRadius: 6 },
  tagText: { color: "white", fontSize: 11, fontWeight: "bold" },
  cardContent: { padding: 15 },
  eventTitle: { fontSize: 17, fontWeight: "bold", marginBottom: 10, color: "#333" },
  infoRow: { flexDirection: "row", alignItems: "center", marginBottom: 6 },
  infoText: { marginLeft: 10, fontSize: 13, color: "#666" },
  emptyContainer: { alignItems: "center", justifyContent: "center", marginTop: 60 },
  emptyText: { color: "#999", marginTop: 15, fontSize: 14 },
});