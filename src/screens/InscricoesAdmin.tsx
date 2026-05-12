import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../../lib/supabase';
import { useNavigation } from '@react-navigation/native';

interface Pedido {
  id: number;
  data_inscricao: string;
  utilizadores: { nome: string; email: string };
  eventos: { id: number; titulo: string; participantes_atual: string; participantes_max: string; ativo: boolean };
}

export default function InscricoesAdminScreen() {
  const navigation = useNavigation<any>();
  const [pedidos, setPedidos] = useState<Pedido[]>([]);
  const [loading, setLoading] = useState(true);
  const [processando, setProcessando] = useState<number | null>(null);

  useEffect(() => {
    carregarPedidos();
  }, []);

  const carregarPedidos = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('inscricoes')
        .select(`
          id, 
          data_inscricao,
          utilizadores (nome, email),
          eventos!inner (id, titulo, participantes_atual, participantes_max, ativo)
        `)
        .eq('estado', 'Pendente')
        .order('id', { ascending: true });

      if (error) throw error;

      const filtrados = (data || []).filter(p => (p.eventos as any)?.ativo === true);
      setPedidos(filtrados as any);

    } catch (error) {
      console.error("Erro ao carregar pedidos:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleAprovar = async (pedido: Pedido) => {
    try {
      setProcessando(pedido.id);
      
      const atual = Number(pedido.eventos.participantes_atual) || 0;
      const max = Number(pedido.eventos.participantes_max) || 0;

      if (atual >= max) {
        Alert.alert("Lotação Esgotada", "Este evento já atingiu a lotação máxima!");
        setProcessando(null);
        return;
      }

      const { error: errorInscricao } = await supabase
        .from('inscricoes')
        .update({ estado: 'Confirmado' })
        .eq('id', pedido.id);

      if (errorInscricao) {
        console.error("Erro Inscrição:", errorInscricao);
        throw errorInscricao;
      }

      const novoTotal = atual + 1;
      
      const { error: errorEvento } = await supabase
        .from('eventos')
        .update({ participantes_atual: novoTotal }) 
        .eq('id', pedido.eventos.id);

      if (errorEvento) {
        console.error("Erro Evento:", errorEvento);
        throw errorEvento;
      }

      setPedidos(prev => prev.filter(p => p.id !== pedido.id));
      Alert.alert("Aprovado!", "Aluno inscrito e vagas do evento atualizadas com sucesso.");

    } catch (error: any) {
      console.error("Erro fatal ao aprovar:", error);
      Alert.alert("Erro", "Não foi possível aprovar a inscrição. Vê a consola para mais detalhes.");
    } finally {
      setProcessando(null);
    }
  };

  const handleRejeitar = async (pedido: Pedido) => {
    try {
      setProcessando(pedido.id);
      
      const { error } = await supabase
        .from('inscricoes')
        .update({ estado: 'Cancelado' })
        .eq('id', pedido.id);

      if (error) throw error;

      setPedidos(prev => prev.filter(p => p.id !== pedido.id));
      Alert.alert("Rejeitado", "O pedido foi cancelado.");

    } catch (error: any) {
      console.error("Erro ao rejeitar:", error.message);
      Alert.alert("Erro", "Não foi possível rejeitar o pedido.");
    } finally {
      setProcessando(null);
    }
  };

  const renderPedido = ({ item }: { item: Pedido }) => (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <Ionicons name="person-circle" size={40} color="#1157ed" />
        <View style={styles.userInfo}>
          <Text style={styles.userName}>{item.utilizadores?.nome || "Aluno Desconhecido"}</Text>
          <Text style={styles.userEmail}>{item.utilizadores?.email || "Sem email"}</Text>
        </View>
      </View>
      
      <View style={styles.eventInfo}>
        <Text style={styles.eventLabel}>Quer ir a:</Text>
        <Text style={styles.eventTitle}>{item.eventos?.titulo}</Text>
        <Text style={styles.eventVagas}>Vagas preenchidas: {item.eventos?.participantes_atual}/{item.eventos?.participantes_max}</Text>
      </View>

      <View style={styles.actions}>
        <TouchableOpacity 
          style={[styles.btn, styles.btnReject]} 
          onPress={() => handleRejeitar(item)}
          disabled={processando === item.id}
        >
          <Ionicons name="close" size={20} color="#c62828" />
          <Text style={styles.textReject}>Rejeitar</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.btn, styles.btnApprove]} 
          onPress={() => handleAprovar(item)}
          disabled={processando === item.id}
        >
          {processando === item.id ? <ActivityIndicator color="#fff" size="small"/> : (
            <>
              <Ionicons name="checkmark" size={20} color="#fff" />
              <Text style={styles.textApprove}>Aprovar</Text>
            </>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />
      
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={24} color="#111" />
          </TouchableOpacity>
        </View>
        <Text style={styles.headerTitle}>Aprovações Pendentes</Text>
        <Text style={styles.headerSubtitle}>{pedidos.length} pedidos a aguardar</Text>
      </View>

      {loading ? (
        <ActivityIndicator size="large" color="#1157ed" style={{ marginTop: 50 }} />
      ) : (
        <FlatList
          data={pedidos}
          keyExtractor={item => item.id.toString()}
          renderItem={renderPedido}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="checkmark-done-circle-outline" size={60} color="#ccc" />
              <Text style={styles.empty}>Não tens pedidos pendentes.</Text>
            </View>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8f9fa' },
  header: { paddingTop: 50, paddingHorizontal: 20, paddingBottom: 20, backgroundColor: '#fff', borderBottomWidth: 1, borderColor: '#eee' },
  headerTop: { marginBottom: 10 },
  backBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#f5f5f5', justifyContent: 'center', alignItems: 'center' },
  headerTitle: { fontSize: 24, fontWeight: '800', color: '#111' },
  headerSubtitle: { color: '#666', marginTop: 5, fontSize: 14 },
  list: { padding: 15, paddingBottom: 40 },
  card: { backgroundColor: '#fff', borderRadius: 20, padding: 20, marginBottom: 15, elevation: 3, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 5 },
  cardHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 15, borderBottomWidth: 1, borderColor: '#f0f5ff', paddingBottom: 15 },
  userInfo: { marginLeft: 12 },
  userName: { fontSize: 16, fontWeight: 'bold', color: '#111' },
  userEmail: { fontSize: 13, color: '#666', marginTop: 2 },
  eventInfo: { marginBottom: 20 },
  eventLabel: { fontSize: 12, color: '#888', textTransform: 'uppercase', fontWeight: 'bold', marginBottom: 4 },
  eventTitle: { fontSize: 16, fontWeight: 'bold', color: '#1157ed', marginBottom: 6 },
  eventVagas: { fontSize: 13, color: '#f57c00', fontWeight: '600' },
  actions: { flexDirection: 'row', gap: 12 },
  btn: { flex: 1, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', padding: 14, borderRadius: 12, gap: 6 },
  btnReject: { backgroundColor: '#ffebee' },
  textReject: { color: '#c62828', fontWeight: 'bold', fontSize: 15 },
  btnApprove: { backgroundColor: '#1157ed' },
  textApprove: { color: '#fff', fontWeight: 'bold', fontSize: 15 },
  emptyContainer: { alignItems: 'center', justifyContent: 'center', marginTop: 80 },
  empty: { textAlign: 'center', color: '#999', marginTop: 10, fontSize: 16 }
});