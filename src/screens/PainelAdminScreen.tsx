import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { supabase } from '../../lib/supabase';

export default function PainelAdminScreen() {
  const navigation = useNavigation<any>();
  const [pendentesCount, setPendentesCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useFocusEffect(
    useCallback(() => {
      contarPendentes();
    }, [])
  );

  const contarPendentes = async () => {
    setLoading(true);
    try {
      const { count, error } = await supabase
        .from('inscricoes')
        .select('*', { count: 'exact', head: true })
        .eq('estado', 'Pendente');

      if (!error && count !== null) {
        setPendentesCount(count);
      } else {
        setPendentesCount(0);
      }
    } catch (error) {
      console.error("Erro ao contar pendentes:", error);
      setPendentesCount(0);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />

      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} activeOpacity={0.7} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={22} color="#111" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Administração</Text>
        <View style={{ width: 44 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>

        <Text style={styles.sectionTitle}>Inscrições e Alunos</Text>

        <TouchableOpacity
          style={styles.mainCard}
          activeOpacity={0.8}
          onPress={() => navigation.navigate('InscricoesAdmin')}
        >
          <View style={[styles.iconBox, { backgroundColor: '#eef2ff' }]}>
            <Ionicons name="shield-checkmark" size={28} color="#1157ed" />
          </View>
          <View style={styles.cardTextContainer}>
            <Text style={styles.cardTitle}>Inscrições Admin</Text>
            <Text style={styles.cardSubtitle}>Gere os pedidos dos alunos</Text>
          </View>
          {loading ? (
            <ActivityIndicator color="#1157ed" />
          ) : pendentesCount > 0 ? (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{pendentesCount} PENDENTES</Text>
            </View>
          ) : (
            <View style={styles.badgeEmpty}>
              <Ionicons name="checkmark-done" size={16} color="#4caf50" />
            </View>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.mainCard, { marginBottom: 35 }]}
          activeOpacity={0.8}
          onPress={() => navigation.navigate('EventosListaAdmin')}
        >
          <View style={[styles.iconBox, { backgroundColor: '#e8f5e9' }]}>
            <Ionicons name="people" size={28} color="#4caf50" />
          </View>
          <View style={styles.cardTextContainer}>
            <Text style={styles.cardTitle}>Consultar Inscritos</Text>
            <Text style={styles.cardSubtitle}>Ver alunos por evento</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color="#ccc" />
        </TouchableOpacity>

        <Text style={styles.sectionTitle}>Gestão de Eventos</Text>

        <TouchableOpacity
          style={styles.fullCard}
          activeOpacity={0.8}
          onPress={() => navigation.navigate('AddEventoAdmin')}
        >
          <View style={[styles.gridIconBox, { backgroundColor: '#e8f5e9' }]}>
            <Ionicons name="add-circle" size={28} color="#4caf50" />
          </View>
          <View style={styles.cardTextContainer}>
            <Text style={styles.gridTitle}>Criar Novo Evento</Text>
            <Text style={styles.gridSubtitle}>Adiciona um evento ao calendário</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color="#ccc" />
        </TouchableOpacity>

        <View style={styles.grid}>
          <TouchableOpacity
            style={styles.halfCard}
            activeOpacity={0.8}
            onPress={() => navigation.navigate('EditEventoAdmin')}
          >
            <View style={[styles.gridIconBox, { backgroundColor: '#fff3e0' }]}>
              <Ionicons name="create" size={26} color="#f57c00" />
            </View>
            <Text style={styles.gridTitle}>Editar</Text>
            <Text style={styles.gridSubtitle}>Alterar dados</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.halfCard}
            activeOpacity={0.8}
            onPress={() => navigation.navigate('EliminarEventoAdmin')}
          >
            <View style={[styles.gridIconBox, { backgroundColor: '#ffebee' }]}>
              <Ionicons name="trash" size={26} color="#e53935" />
            </View>
            <Text style={styles.gridTitle}>Remover</Text>
            <Text style={styles.gridSubtitle}>Apagar evento</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          style={[styles.fullCard, { marginTop: 15 }]}
          activeOpacity={0.8}
          onPress={() => navigation.navigate('HistoricoEventosAdmin')}
        >
          <View style={[styles.gridIconBox, { backgroundColor: '#f3e5f5' }]}>
            <Ionicons name="time" size={28} color="#9c27b0" />
          </View>
          <View style={styles.cardTextContainer}>
            <Text style={styles.gridTitle}>Histórico de Eventos</Text>
            <Text style={styles.gridSubtitle}>Ver eventos já realizados</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color="#ccc" />
        </TouchableOpacity>

      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f8f9fa" },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingTop: 60, paddingBottom: 15, backgroundColor: '#f8f9fa' },
  backButton: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#fff', justifyContent: 'center', alignItems: 'center', elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 4 },
  headerTitle: { fontSize: 18, fontWeight: '800', color: '#111' },
  content: { paddingHorizontal: 20, paddingBottom: 40 },
  sectionTitle: { fontSize: 16, fontWeight: '800', color: '#111', marginBottom: 15, marginTop: 10, textTransform: 'uppercase', letterSpacing: 0.5 },
  mainCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', padding: 20, borderRadius: 24, elevation: 5, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.08, shadowRadius: 10, marginBottom: 15 },
  iconBox: { width: 56, height: 56, borderRadius: 18, justifyContent: 'center', alignItems: 'center', marginRight: 15 },
  cardTextContainer: { flex: 1 },
  cardTitle: { fontSize: 16, fontWeight: 'bold', color: '#111', marginBottom: 4 },
  cardSubtitle: { fontSize: 13, color: '#666' },
  badge: { backgroundColor: '#ef4444', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12 },
  badgeText: { color: '#fff', fontSize: 10, fontWeight: '900', letterSpacing: 0.5 },
  badgeEmpty: { backgroundColor: '#e8f5e9', width: 32, height: 32, borderRadius: 16, justifyContent: 'center', alignItems: 'center' },
  fullCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', padding: 20, borderRadius: 24, elevation: 3, shadowColor: '#000', shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.05, shadowRadius: 8, marginBottom: 15 },
  grid: { flexDirection: 'row', justifyContent: 'space-between' },
  halfCard: { width: '48%', backgroundColor: '#fff', padding: 20, borderRadius: 24, elevation: 3, shadowColor: '#000', shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.05, shadowRadius: 8, alignItems: 'flex-start' },
  gridIconBox: { width: 50, height: 50, borderRadius: 16, justifyContent: 'center', alignItems: 'center', marginBottom: 15, marginRight: 15 },
  gridTitle: { fontSize: 16, fontWeight: 'bold', color: '#111', marginBottom: 4 },
  gridSubtitle: { fontSize: 13, color: '#888' },
});