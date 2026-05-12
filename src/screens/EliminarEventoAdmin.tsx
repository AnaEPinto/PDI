import React, { useState, useEffect } from 'react';
import { 
  View, Text, StyleSheet, TouchableOpacity, Alert, ActivityIndicator, Image, FlatList 
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { supabase } from '../../lib/supabase';

export default function EliminarEventoAdmin() {
  const navigation = useNavigation<any>();
  const [eventos, setEventos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchEventos();
  }, []);

  const fetchEventos = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('eventos')
        .select('*')
        .eq('ativo', true) // ← só mostra os ativos
        .order('data', { ascending: false });

      if (error) throw error;
      setEventos(data || []);
    } catch (error) {
      console.error("Erro ao buscar eventos:", error);
      Alert.alert("Erro", "Não foi possível carregar a lista de eventos.");
    } finally {
      setLoading(false);
    }
  };

  const confirmarEliminacao = (evento: any) => {
    Alert.alert(
      "Remover Evento",
      `Tens a certeza que queres remover "${evento.titulo}"? O evento ficará oculto mas os dados são preservados.`,
      [
        { text: "Cancelar", style: "cancel" },
        { 
          text: "Sim, Remover", 
          style: "destructive",
          onPress: () => ocultarEvento(evento.id)
        }
      ]
    );
  };

  const ocultarEvento = async (id: number) => {
    try {
      setLoading(true);

      // ← em vez de DELETE, faz UPDATE para ativo = false
      const { error } = await supabase
        .from('eventos')
        .update({ ativo: false })
        .eq('id', id);

      if (error) throw error;

      setEventos(prev => prev.filter(e => e.id !== id));
      Alert.alert("Removido", "O evento foi ocultado com sucesso. Os dados ficam guardados.");

    } catch (error: any) {
      console.error("Erro ao ocultar:", error);
      Alert.alert("Erro", error.message || "Não foi possível remover o evento.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />
      
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#111" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Remover Eventos</Text>
        <View style={{ width: 40 }} />
      </View>

      <View style={styles.listContainer}>
        {loading ? (
          <ActivityIndicator size="large" color="#e11d48" style={{ marginTop: 50 }} />
        ) : eventos.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="calendar-outline" size={50} color="#ccc" />
            <Text style={styles.emptyText}>Não tens eventos ativos.</Text>
          </View>
        ) : (
          <FlatList
            data={eventos}
            keyExtractor={(item) => item.id.toString()}
            contentContainerStyle={{ paddingBottom: 40 }}
            renderItem={({ item }) => (
              <View style={styles.eventCard}>
                {item.imagem ? (
                  <Image source={{ uri: item.imagem }} style={styles.eventCardImage} />
                ) : (
                  <View style={[styles.eventCardImage, styles.imagePlaceholder]}>
                    <Ionicons name="calendar" size={30} color="#e11d48" />
                  </View>
                )}
                <View style={styles.eventCardInfo}>
                  <Text style={styles.eventCardTitle} numberOfLines={1}>{item.titulo}</Text>
                  <Text style={styles.eventCardSub}>
                    {item.data ? item.data.split("-").reverse().join("/") : "S/D"} • {item.local}
                  </Text>
                </View>
                <TouchableOpacity 
                  style={styles.deleteBtn} 
                  onPress={() => confirmarEliminacao(item)}
                >
                  <Ionicons name="eye-off-outline" size={20} color="#fff" />
                </TouchableOpacity>
              </View>
            )}
          />
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8f9fa' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingTop: 60, paddingBottom: 20, backgroundColor: '#fff', borderBottomWidth: 1, borderColor: '#eee' },
  backBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#f5f5f5', justifyContent: 'center', alignItems: 'center' },
  headerTitle: { fontSize: 20, fontWeight: 'bold', color: '#111' },
  listContainer: { flex: 1, padding: 20 },
  emptyContainer: { alignItems: 'center', marginTop: 80 },
  emptyText: { textAlign: 'center', color: '#999', marginTop: 10, fontSize: 15 },
  eventCard: { flexDirection: 'row', backgroundColor: '#fff', padding: 12, borderRadius: 16, marginBottom: 15, alignItems: 'center', elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 5 },
  eventCardImage: { width: 60, height: 60, borderRadius: 12, marginRight: 15 },
  imagePlaceholder: { backgroundColor: '#ffe4e6', justifyContent: 'center', alignItems: 'center' },
  eventCardInfo: { flex: 1, marginRight: 10 },
  eventCardTitle: { fontSize: 16, fontWeight: 'bold', color: '#111', marginBottom: 4 },
  eventCardSub: { fontSize: 13, color: '#666' },
  deleteBtn: { backgroundColor: '#e11d48', width: 40, height: 40, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
});