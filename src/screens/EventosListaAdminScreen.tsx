import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, Image } from 'react-native'; // ← adiciona Image
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../../lib/supabase';
import { useNavigation, useFocusEffect } from '@react-navigation/native';

export default function EventosListaAdminScreen() {
  const navigation = useNavigation<any>();
  const [eventos, setEventos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useFocusEffect(
    useCallback(() => {
      carregarEventos();
    }, [])
  );

  const carregarEventos = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('eventos')
        .select('id, titulo, data, participantes_atual, participantes_max, imagem') // ← adiciona imagem
        .order('data', { ascending: true });

      if (error) throw error;
      setEventos(data || []);
    } catch (error) {
      console.error("Erro ao carregar eventos:", error);
    } finally {
      setLoading(false);
    }
  };

  const renderEvento = ({ item }: { item: any }) => {
    const dataFormatada = item.data ? item.data.split("-").reverse().join("/") : "S/D";
    const atual = item.participantes_atual || 0;
    const max = item.participantes_max || 0;

    return (
      <TouchableOpacity
        style={styles.card}
        activeOpacity={0.8}
        onPress={() => navigation.navigate('InscritosPorEvento', { evento: item })}
      >
        {/* ← imagem igual ao EditEventoAdmin */}
        {item.imagem ? (
          <Image source={{ uri: item.imagem }} style={styles.cardImage} />
        ) : (
          <View style={[styles.cardImage, styles.cardImagePlaceholder]}>
            <Ionicons name="calendar" size={24} color="#1157ed" />
          </View>
        )}

        <View style={styles.cardInfo}>
          <Text style={styles.cardTitle} numberOfLines={1}>{item.titulo}</Text>
          <Text style={styles.cardSub}>
            {dataFormatada} • <Text style={{ fontWeight: 'bold', color: '#1157ed' }}>{atual}/{max}</Text> inscritos
          </Text>
        </View>
        <Ionicons name="chevron-forward" size={20} color="#ccc" />
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />

      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#111" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Escolher Evento</Text>
        <View style={{ width: 40 }} />
      </View>

      {loading ? (
        <ActivityIndicator size="large" color="#1157ed" style={{ marginTop: 50 }} />
      ) : (
        <FlatList
          data={eventos}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={styles.list}
          renderItem={renderEvento}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="calendar-outline" size={50} color="#ccc" />
              <Text style={styles.emptyText}>Não há eventos registados.</Text>
            </View>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8f9fa' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingTop: 60, paddingBottom: 20, backgroundColor: '#fff', borderBottomWidth: 1, borderColor: '#eee' },
  backButton: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#f5f5f5', justifyContent: 'center', alignItems: 'center' },
  headerTitle: { fontSize: 20, fontWeight: 'bold', color: '#111' },
  list: { padding: 20, paddingBottom: 40 },
  card: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', padding: 12, borderRadius: 16, marginBottom: 12, elevation: 2, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 5 },
  cardImage: { width: 60, height: 60, borderRadius: 12, marginRight: 15 }, // ← igual ao EditEventoAdmin
  cardImagePlaceholder: { backgroundColor: '#eef2ff', justifyContent: 'center', alignItems: 'center' },
  cardInfo: { flex: 1 },
  cardTitle: { fontSize: 16, fontWeight: 'bold', color: '#111', marginBottom: 4 },
  cardSub: { fontSize: 13, color: '#666' },
  emptyContainer: { alignItems: 'center', marginTop: 80 },
  emptyText: { color: '#999', fontSize: 15, marginTop: 10 }
});