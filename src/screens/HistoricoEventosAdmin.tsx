import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, Image } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../../lib/supabase';
import { useNavigation, useFocusEffect } from '@react-navigation/native';

export default function HistoricoEventosAdmin() {
  const navigation = useNavigation<any>();
  const [eventos, setEventos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useFocusEffect(
    useCallback(() => {
      carregarHistorico();
    }, [])
  );

  const carregarHistorico = async () => {
    setLoading(true);
    try {
      const hoje = new Date().toISOString().split('T')[0];

      const { data, error } = await supabase
        .from('eventos')
        .select('id, titulo, data, imagem, participantes_atual, participantes_max, local')
        .lt('data', hoje) // ← só eventos antes de hoje
        .order('data', { ascending: false }); // ← mais recentes primeiro

      if (error) throw error;
      setEventos(data || []);
    } catch (error) {
      console.error("Erro ao carregar histórico:", error);
    } finally {
      setLoading(false);
    }
  };

  const renderEvento = ({ item }: { item: any }) => {
    const dataFormatada = item.data ? item.data.split("-").reverse().join("/") : "S/D";
    const atual = item.participantes_atual || 0;
    const max = item.participantes_max || 0;
    const taxaOcupacao = max > 0 ? Math.round((atual / max) * 100) : 0;

    return (
      <TouchableOpacity
        style={styles.card}
        activeOpacity={0.8}
        onPress={() => navigation.navigate('InscritosPorEvento', { evento: item })}
      >
        {item.imagem ? (
          <Image source={{ uri: item.imagem }} style={styles.cardImage} />
        ) : (
          <View style={[styles.cardImage, styles.cardImagePlaceholder]}>
            <Ionicons name="calendar" size={24} color="#999" />
          </View>
        )}

        <View style={styles.cardInfo}>
          <Text style={styles.cardTitle} numberOfLines={1}>{item.titulo}</Text>
          <Text style={styles.cardSub}>{dataFormatada} • {item.local}</Text>

          {/* Barra de ocupação */}
          <View style={styles.ocupacaoRow}>
            <View style={styles.ocupacaoBar}>
              <View style={[styles.ocupacaoFill, { width: `${taxaOcupacao}%` as any }]} />
            </View>
            <Text style={styles.ocupacaoText}>{atual}/{max}</Text>
          </View>
        </View>

        <View style={styles.pastBadge}>
          <Text style={styles.pastBadgeText}>Passado</Text>
        </View>
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
        <Text style={styles.headerTitle}>Histórico de Eventos</Text>
        <View style={{ width: 40 }} />
      </View>

      {/* RESUMO */}
      <View style={styles.resumoContainer}>
        <Ionicons name="time-outline" size={16} color="#666" />
        <Text style={styles.resumoText}>
          {loading ? '...' : `${eventos.length} eventos realizados`}
        </Text>
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
              <Ionicons name="time-outline" size={50} color="#ccc" />
              <Text style={styles.emptyText}>Nenhum evento passado.</Text>
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

  resumoContainer: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 20, paddingVertical: 12, backgroundColor: '#fff', borderBottomWidth: 1, borderColor: '#eee' },
  resumoText: { fontSize: 13, color: '#666' },

  list: { padding: 15, paddingBottom: 40 },
  card: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', padding: 12, borderRadius: 16, marginBottom: 12, elevation: 2, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 5 },
  cardImage: { width: 65, height: 65, borderRadius: 12, marginRight: 12 },
  cardImagePlaceholder: { backgroundColor: '#f0f0f0', justifyContent: 'center', alignItems: 'center' },
  cardInfo: { flex: 1 },
  cardTitle: { fontSize: 15, fontWeight: 'bold', color: '#333', marginBottom: 3 }, // ← cinzento em vez de preto
  cardSub: { fontSize: 12, color: '#999', marginBottom: 8 },

  ocupacaoRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  ocupacaoBar: { flex: 1, height: 4, backgroundColor: '#eee', borderRadius: 2, overflow: 'hidden' },
  ocupacaoFill: { height: '100%', backgroundColor: '#1157ed', borderRadius: 2 },
  ocupacaoText: { fontSize: 11, color: '#999', minWidth: 35 },

  pastBadge: { backgroundColor: '#f0f0f0', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8, marginLeft: 8 },
  pastBadgeText: { fontSize: 11, color: '#999', fontWeight: 'bold' },

  emptyContainer: { alignItems: 'center', marginTop: 80 },
  emptyText: { color: '#999', fontSize: 15, marginTop: 10 },
});