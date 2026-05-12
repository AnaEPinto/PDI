import React, { useState, useCallback } from 'react';
import { 
  View, Text, StyleSheet, FlatList, TouchableOpacity, Image, ActivityIndicator 
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { supabase } from '../../lib/supabase';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function MeusEventosScreen() {
  const navigation = useNavigation<any>();
  const [inscricoes, setInscricoes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useFocusEffect(
    useCallback(() => {
      fetchMeusEventos();
    }, [])
  );

  const fetchMeusEventos = async () => {
    setLoading(true);
    try {
      const userId = await AsyncStorage.getItem('userId');
      
      if (!userId) {
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from('inscricoes')
        .select('estado, eventos(*)')
        .eq('id_utilizador', Number(userId))
        .neq('estado', 'Cancelado') 
        .neq('estado', 'cancelado') 
        .neq('estado', 'Rejeitada') 
        .order('data_inscricao', { ascending: false });

      if (error) {
        console.error("Erro do Supabase:", error.message);
        throw error;
      }

      const dadosValidos = data?.filter(item => item.eventos != null) || [];
      setInscricoes(dadosValidos);

    } catch (error) {
      console.error("Erro ao buscar meus eventos:", error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (estado: string) => {
    const status = estado ? estado.toLowerCase() : '';
    if (status === 'confirmado' || status === 'aprovada') return '#22c55e'; // Verde
    return '#f59e0b'; // Amarelo (Pendente)
  };

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />

      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#111" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Os Meus Eventos</Text>
        <View style={{ width: 40 }} />
      </View>

      {loading ? (
        <ActivityIndicator size="large" color="#1157ed" style={{ marginTop: 50 }} />
      ) : inscricoes.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="ticket-outline" size={60} color="#ccc" />
          <Text style={styles.emptyText}>Não tens inscrições ativas no momento.</Text>
          <TouchableOpacity style={styles.exploreBtn} onPress={() => navigation.navigate('Eventos')}>
            <Text style={styles.exploreBtnText}>Explorar Eventos</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={inscricoes}
          keyExtractor={(item, index) => index.toString()}
          contentContainerStyle={{ padding: 20, paddingBottom: 40 }}
          renderItem={({ item }) => {
            const evento = item.eventos;
            return (
              <TouchableOpacity
                style={styles.card}
                activeOpacity={0.8}
                onPress={() => navigation.navigate('Detalhes', { evento })}
              >
                {evento.imagem ? (
                  <Image source={{ uri: evento.imagem }} style={styles.cardImage} />
                ) : (
                  <View style={[styles.cardImage, styles.placeholderImage]}>
                    <Ionicons name="calendar" size={30} color="#1157ed" />
                  </View>
                )}

                <View style={styles.cardInfo}>
                  <Text style={styles.cardTitle} numberOfLines={1}>{evento.titulo}</Text>
                  <Text style={styles.cardSub}>{evento.data} • {evento.local}</Text>

                  <View style={styles.statusRow}>
                    <View style={[styles.statusDot, { backgroundColor: getStatusColor(item.estado) }]} />
                    <Text style={[styles.statusText, { color: getStatusColor(item.estado) }]}>
                      {item.estado}
                    </Text>
                  </View>
                </View>
              </TouchableOpacity>
            );
          }}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8f9fa' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingTop: 60, paddingBottom: 20, backgroundColor: '#fff', borderBottomWidth: 1, borderColor: '#eee' },
  backBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#f5f5f5', justifyContent: 'center', alignItems: 'center' },
  headerTitle: { fontSize: 20, fontWeight: 'bold', color: '#111' },
  emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  emptyText: { textAlign: 'center', color: '#666', marginTop: 15, fontSize: 16, marginBottom: 20 },
  exploreBtn: { backgroundColor: '#1157ed', paddingHorizontal: 20, paddingVertical: 12, borderRadius: 12 },
  exploreBtnText: { color: '#fff', fontWeight: 'bold' },
  card: { flexDirection: 'row', backgroundColor: '#fff', padding: 12, borderRadius: 16, marginBottom: 15, alignItems: 'center', elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 5 },
  cardImage: { width: 70, height: 70, borderRadius: 12, marginRight: 15 },
  placeholderImage: { backgroundColor: '#eef2ff', justifyContent: 'center', alignItems: 'center' },
  cardInfo: { flex: 1 },
  cardTitle: { fontSize: 16, fontWeight: 'bold', color: '#111', marginBottom: 4 },
  cardSub: { fontSize: 13, color: '#666', marginBottom: 8 },
  statusRow: { flexDirection: 'row', alignItems: 'center' },
  statusDot: { width: 8, height: 8, borderRadius: 4, marginRight: 6 },
  statusText: { fontSize: 12, fontWeight: 'bold' }
});