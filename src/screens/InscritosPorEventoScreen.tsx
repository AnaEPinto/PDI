import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../../lib/supabase';
import { useNavigation, useRoute, useFocusEffect } from '@react-navigation/native';

export default function InscritosPorEventoScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const evento = route.params?.evento;

  const [inscritos, setInscritos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filtroAtivo, setFiltroAtivo] = useState('Todos'); // ← novo

  useFocusEffect(
    useCallback(() => {
      carregarInscritos();
    }, [])
  );

  const carregarInscritos = async () => {
    setLoading(true);
    try {
      const { data: inscricoesData, error } = await supabase
        .from('inscricoes')
        .select('id, estado, data_inscricao, id_utilizador')
        .eq('id_evento', evento.id)
        .order('id', { ascending: true });

      if (error) throw error;

      const inscricoesComUtilizador = await Promise.all(
        (inscricoesData || []).map(async (inscricao) => {
          const { data: user } = await supabase
            .from('utilizadores')
            .select('id, nome, email')
            .eq('id', inscricao.id_utilizador)
            .single();
          return { ...inscricao, utilizadores: user };
        })
      );

      setInscritos(inscricoesComUtilizador);
    } catch (error) {
      console.error("Erro ao carregar inscritos:", error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (estado: string) => {
    if (estado === 'Confirmado') return '#22c55e';
    if (estado === 'Cancelado') return '#ef4444';
    if (estado === 'Pendente') return '#f59e0b';
    return '#999';
  };

  const getStatusIcon = (estado: string) => {
    if (estado === 'Confirmado') return 'checkmark-circle';
    if (estado === 'Cancelado') return 'close-circle';
    return 'time';
  };

  // Contagens
  const confirmados = inscritos.filter(i => i.estado === 'Confirmado').length;
  const pendentes = inscritos.filter(i => i.estado === 'Pendente').length;
  const cancelados = inscritos.filter(i => i.estado === 'Cancelado').length;

  // ← Lista filtrada conforme o botão ativo
  const inscritosFiltrados = filtroAtivo === 'Todos'
    ? inscritos
    : inscritos.filter(i => i.estado === filtroAtivo);

  const renderInscrito = ({ item }: { item: any }) => {
    const utilizador = item.utilizadores;
    const iniciais = utilizador?.nome
      ? utilizador.nome.split(' ').map((n: string) => n[0]).slice(0, 2).join('').toUpperCase()
      : '?';

    return (
      <View style={styles.card}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{iniciais}</Text>
        </View>
        <View style={styles.cardInfo}>
          <Text style={styles.cardName}>{utilizador?.nome || 'Desconhecido'}</Text>
          <Text style={styles.cardEmail}>{utilizador?.email || '-'}</Text>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.estado) + '20' }]}>
          <Ionicons name={getStatusIcon(item.estado) as any} size={14} color={getStatusColor(item.estado)} />
          <Text style={[styles.statusText, { color: getStatusColor(item.estado) }]}>{item.estado}</Text>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />

      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#111" />
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>Inscritos</Text>
        <View style={{ width: 40 }} />
      </View>

      {/* NOME DO EVENTO */}
      <View style={styles.eventoInfo}>
        <Text style={styles.eventoTitulo} numberOfLines={2}>{evento?.titulo}</Text>
        <Text style={styles.eventoData}>
          {evento?.data ? evento.data.split('-').reverse().join('/') : 'S/D'}
        </Text>
      </View>

      {/* CARDS CLICÁVEIS DE RESUMO */}
      <View style={styles.resumoRow}>
        <TouchableOpacity
          style={[styles.resumoCard, { borderColor: '#1157ed' }, filtroAtivo === 'Todos' && styles.resumoCardAtivo]}
          onPress={() => setFiltroAtivo('Todos')}
        >
          <Text style={[styles.resumoNum, { color: '#1157ed' }]}>{inscritos.length}</Text>
          <Text style={styles.resumoLabel}>Todos</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.resumoCard, { borderColor: '#22c55e' }, filtroAtivo === 'Confirmado' && styles.resumoCardAtivo]}
          onPress={() => setFiltroAtivo('Confirmado')}
        >
          <Text style={[styles.resumoNum, { color: '#22c55e' }]}>{confirmados}</Text>
          <Text style={styles.resumoLabel}>Confirmados</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.resumoCard, { borderColor: '#f59e0b' }, filtroAtivo === 'Pendente' && styles.resumoCardAtivo]}
          onPress={() => setFiltroAtivo('Pendente')}
        >
          <Text style={[styles.resumoNum, { color: '#f59e0b' }]}>{pendentes}</Text>
          <Text style={styles.resumoLabel}>Pendentes</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.resumoCard, { borderColor: '#ef4444' }, filtroAtivo === 'Cancelado' && styles.resumoCardAtivo]}
          onPress={() => setFiltroAtivo('Cancelado')}
        >
          <Text style={[styles.resumoNum, { color: '#ef4444' }]}>{cancelados}</Text>
          <Text style={styles.resumoLabel}>Cancelados</Text>
        </TouchableOpacity>
      </View>

      {/* LABEL DO FILTRO ATIVO */}
      <View style={styles.filtroLabelRow}>
        <Text style={styles.filtroLabel}>
          A mostrar: <Text style={{ fontWeight: 'bold', color: '#111' }}>{filtroAtivo}</Text>
          {' '}({inscritosFiltrados.length})
        </Text>
      </View>

      {loading ? (
        <ActivityIndicator size="large" color="#1157ed" style={{ marginTop: 50 }} />
      ) : (
        <FlatList
          data={inscritosFiltrados}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={styles.list}
          renderItem={renderInscrito}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="people-outline" size={50} color="#ccc" />
              <Text style={styles.emptyText}>Nenhum inscrito {filtroAtivo !== 'Todos' ? `com estado "${filtroAtivo}"` : 'neste evento'}.</Text>
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
  headerTitle: { fontSize: 20, fontWeight: 'bold', color: '#111', flex: 1, textAlign: 'center' },

  eventoInfo: { backgroundColor: '#fff', paddingHorizontal: 20, paddingVertical: 15, borderBottomWidth: 1, borderColor: '#eee' },
  eventoTitulo: { fontSize: 16, fontWeight: 'bold', color: '#111', marginBottom: 4 },
  eventoData: { fontSize: 13, color: '#666' },

  resumoRow: { flexDirection: 'row', padding: 12, gap: 8 },
  resumoCard: { flex: 1, backgroundColor: '#fff', borderRadius: 12, padding: 10, alignItems: 'center', borderWidth: 1.5, elevation: 1 },
  resumoCardAtivo: { backgroundColor: '#f0f4ff', elevation: 3 }, // ← destaque no ativo
  resumoNum: { fontSize: 20, fontWeight: '800' },
  resumoLabel: { fontSize: 10, color: '#666', marginTop: 2, fontWeight: '500' },

  filtroLabelRow: { paddingHorizontal: 15, paddingBottom: 8 },
  filtroLabel: { fontSize: 13, color: '#666' },

  list: { padding: 15, paddingBottom: 40 },
  card: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', padding: 14, borderRadius: 16, marginBottom: 10, elevation: 2, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 5 },
  avatar: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#eef2ff', justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  avatarText: { fontSize: 15, fontWeight: 'bold', color: '#1157ed' },
  cardInfo: { flex: 1 },
  cardName: { fontSize: 15, fontWeight: 'bold', color: '#111', marginBottom: 3 },
  cardEmail: { fontSize: 12, color: '#666' },
  statusBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20 },
  statusText: { fontSize: 12, fontWeight: 'bold' },

  emptyContainer: { alignItems: 'center', marginTop: 80 },
  emptyText: { color: '#999', fontSize: 15, marginTop: 10 }
});