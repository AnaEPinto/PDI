import React, { useState, useCallback, useMemo } from 'react';
import {
  View, Text, StyleSheet, Image, TouchableOpacity,
  ScrollView, Alert, ActivityIndicator, Share
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute, useFocusEffect } from '@react-navigation/native';
import { supabase } from '../../lib/supabase';
import AsyncStorage from '@react-native-async-storage/async-storage';

const MESES = [
  'janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho',
  'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro',
];

const formatarData = (dataStr: string): string => {
  if (!dataStr) return 'Data a definir';
  const partes = dataStr.split('-');
  if (partes.length === 3) {
    return `${partes[2]} de ${MESES[parseInt(partes[1]) - 1]} de ${partes[0]}`;
  }
  return dataStr;
};

const withLoading = async (
  setLoading: (v: boolean) => void,
  fn: () => Promise<void>
) => {
  setLoading(true);
  try {
    await fn();
  } finally {
    setLoading(false);
  }
};

const DetalheRow = ({ icon, text }: { icon: string; text: string }) => (
  <View style={styles.detailRow}>
    <Ionicons name={icon as any} size={22} color="#999" />
    <Text style={styles.detailText}>{text}</Text>
  </View>
);

export default function EventoDetalhesScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const eventoInicial = route.params?.evento;

  const [evento, setEvento] = useState(eventoInicial);
  const [isFavorito, setIsFavorito] = useState(false);
  const [favoritoId, setFavoritoId] = useState<number | null>(null);
  const [loadingFavorito, setLoadingFavorito] = useState(false);
  const [loadingEstado, setLoadingEstado] = useState(true);
  const [estadoInscricao, setEstadoInscricao] = useState<string | null>(null);
  const [loadingInscricao, setLoadingInscricao] = useState(false);
  const [inscricaoId, setInscricaoId] = useState<number | null>(null);

  const participantesAtual = useMemo(() => Number(evento?.participantes_atual) || 0, [evento]);
  const participantesMax = useMemo(() => Number(evento?.participantes_max) || 0, [evento]);
  const lotacaoEsgotada = participantesAtual >= participantesMax;
  const vagasRestantes = participantesMax - participantesAtual;

  useFocusEffect(
    useCallback(() => {
      if (!eventoInicial?.id) return;
      const id = eventoInicial.id;
      carregarEventoAtualizado(id);
      verificarSeJaInscrito(id);
      verificarSeFavorito(id);
    }, [eventoInicial?.id])
  );

  const getUserId = async (): Promise<number | null> => {
    const userId = await AsyncStorage.getItem('userId');
    return userId ? Number(userId) : null;
  };

  const carregarEventoAtualizado = useCallback(async (idEvento: number) => {
    try {
      const { data, error } = await supabase
        .from('eventos')
        .select('*')
        .eq('id', idEvento)
        .single();
      if (data && !error) setEvento(data);
    } catch (err) {
      console.error('Erro ao atualizar evento:', err);
    }
  }, []);

  const verificarSeFavorito = useCallback(async (idEvento: number) => {
    try {
      const userId = await getUserId();
      if (!userId) return;
      const { data } = await supabase
        .from('favoritos')
        .select('id')
        .eq('id_utilizador', userId)
        .eq('id_evento', idEvento)
        .maybeSingle();
      setIsFavorito(!!data);
      setFavoritoId(data?.id ?? null);
    } catch (err) {
      console.error('Erro ao verificar favorito:', err);
    }
  }, []);

  const handleFavoritoClick = useCallback(async () => {
    await withLoading(setLoadingFavorito, async () => {
      const userId = await getUserId();
      if (!userId) return;
      if (isFavorito && favoritoId) {
        const { error } = await supabase.from('favoritos').delete().eq('id', favoritoId);
        if (error) throw error;
        setIsFavorito(false);
        setFavoritoId(null);
      } else {
        const { data, error } = await supabase
          .from('favoritos')
          .insert([{ id_utilizador: userId, id_evento: evento.id }])
          .select('id')
          .single();
        if (error) throw error;
        setIsFavorito(true);
        setFavoritoId(data.id);
      }
    }).catch(() => {
      Alert.alert('Erro', 'Não foi possível atualizar os favoritos.');
    });
  }, [isFavorito, favoritoId, evento?.id]);

  const handlePartilharClick = useCallback(async () => {
    try {
      await Share.share({
        title: evento?.titulo,
        message:
          `🎉 ${evento?.titulo}\n` +
          `📅 ${formatarData(evento?.data)}\n` +
          `🕐 ${evento?.hora?.substring(0, 5) ?? '--:--'}\n` +
          `📍 ${evento?.local || 'A definir'}\n\n` +
          `https://gestao-eventos.com/evento/${evento?.id}`,
      });
    } catch {
      Alert.alert('Erro', 'Não foi possível partilhar o evento.');
    }
  }, [evento]);

  const verificarSeJaInscrito = useCallback(async (idEvento: number) => {
    await withLoading(setLoadingEstado, async () => {
      const userId = await getUserId();
      if (!userId) return;
      const { data } = await supabase
        .from('inscricoes')
        .select('id, estado')
        .eq('id_utilizador', userId)
        .eq('id_evento', idEvento)
        .order('id', { ascending: false })
        .limit(1)
        .maybeSingle();
      if (data && data.estado !== 'Cancelado') {
        setEstadoInscricao(data.estado);
        setInscricaoId(data.id);
      } else {
        setEstadoInscricao(null);
        setInscricaoId(null);
      }
    }).catch(() => {
      setEstadoInscricao(null);
      setInscricaoId(null);
    });
  }, []);

  const handleInscreverClick = useCallback(async () => {
    if (lotacaoEsgotada) {
      Alert.alert('Evento Lotado', 'Infelizmente já não existem vagas disponíveis.');
      return;
    }
    await withLoading(setLoadingInscricao, async () => {
      const userId = await getUserId();
      if (!userId) {
        Alert.alert('Erro', 'Precisas de estar logado para te inscreveres.');
        navigation.replace('Login');
        return;
      }
      const dataAtualString = new Date().toISOString().split('T')[0];
      const { data, error } = await supabase
        .from('inscricoes')
        .insert([{
          id_utilizador: userId,
          id_evento: evento.id,
          estado: 'Pendente',
          data_inscricao: dataAtualString,
        }])
        .select('id')
        .single();
      if (error) throw error;
      setInscricaoId(data.id);
      setEstadoInscricao('Pendente');
      Alert.alert('Sucesso', 'Pedido de inscrição enviado! Ficará pendente de aprovação.');
    }).catch((err) => {
      console.error('Erro ao inscrever:', err.message);
      Alert.alert('Erro', 'Falha ao comunicar com o servidor.');
    });
  }, [lotacaoEsgotada, evento?.id, navigation]);

  const confirmarCancelamento = useCallback(async () => {
    if (!inscricaoId) return;
    await withLoading(setLoadingInscricao, async () => {

      // 1. Cancela a inscrição
      const { error } = await supabase
        .from('inscricoes')
        .update({ estado: 'Cancelado' })
        .eq('id', inscricaoId);
      if (error) throw error;

      // 2. Só decrementa se estava Confirmado (Pendente ainda não foi contabilizado)
      if (estadoInscricao === 'Confirmado') {
        const novoTotal = Math.max(0, participantesAtual - 1);
        const { error: errorEvento } = await supabase
          .from('eventos')
          .update({ participantes_atual: novoTotal })
          .eq('id', evento.id);
        if (errorEvento) throw errorEvento;
      }

      setEstadoInscricao(null);
      setInscricaoId(null);

      // 3. Recarrega evento para refletir valores atualizados
      await carregarEventoAtualizado(evento.id);

      Alert.alert('Cancelado', 'A tua inscrição foi cancelada.');
    }).catch(() => Alert.alert('Erro', 'Não foi possível cancelar a inscrição.'));
  }, [inscricaoId, estadoInscricao, participantesAtual, evento?.id, carregarEventoAtualizado]);

  const handleCancelarClick = useCallback(() => {
    Alert.alert(
      'Cancelar Inscrição',
      'Tens a certeza que queres cancelar o pedido de inscrição?',
      [
        { text: 'Não', style: 'cancel' },
        { text: 'Sim, cancelar', style: 'destructive', onPress: confirmarCancelamento },
      ]
    );
  }, [confirmarCancelamento]);

  const renderBotao = useCallback(() => {
    if (loadingEstado) {
      return (
        <TouchableOpacity style={[styles.subscribeButton, styles.buttonDisabled]} disabled>
          <ActivityIndicator color="#666" />
        </TouchableOpacity>
      );
    }

    if (estadoInscricao === 'Confirmado') {
      return (
        <TouchableOpacity
          style={[styles.subscribeButton, styles.buttonSuccess]}
          onPress={handleCancelarClick}
          disabled={loadingInscricao}
        >
          {loadingInscricao
            ? <ActivityIndicator color="#4caf50" />
            : (
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <Ionicons name="checkmark-circle" size={20} color="#4caf50" />
                <Text style={[styles.subscribeButtonText, { color: '#4caf50' }]}>
                  Confirmado — Cancelar
                </Text>
              </View>
            )
          }
        </TouchableOpacity>
      );
    }

    if (estadoInscricao === 'Pendente') {
      return (
        <TouchableOpacity
          style={[styles.subscribeButton, styles.buttonPending]}
          onPress={handleCancelarClick}
          disabled={loadingInscricao}
        >
          {loadingInscricao
            ? <ActivityIndicator color="#f57f17" />
            : <Text style={[styles.subscribeButtonText, { color: '#f57f17' }]}>
                Aguarda Aprovação — Cancelar
              </Text>
          }
        </TouchableOpacity>
      );
    }

    if (lotacaoEsgotada) {
      return (
        <TouchableOpacity style={[styles.subscribeButton, styles.buttonDisabled]} disabled>
          <Text style={[styles.subscribeButtonText, { color: '#666' }]}>Lotação Esgotada</Text>
        </TouchableOpacity>
      );
    }

    return (
      <TouchableOpacity
        style={styles.subscribeButton}
        onPress={handleInscreverClick}
        disabled={loadingInscricao}
      >
        {loadingInscricao
          ? <ActivityIndicator color="#1157ed" />
          : <Text style={styles.subscribeButtonText}>Inscrever no Evento</Text>
        }
      </TouchableOpacity>
    );
  }, [loadingEstado, estadoInscricao, loadingInscricao, lotacaoEsgotada, handleCancelarClick, handleInscreverClick]);

  if (!evento) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#1157ed" />
        <Text style={{ marginTop: 10, color: '#666' }}>A carregar evento...</Text>
      </View>
    );
  }

  const textoParticipantes =
    `${participantesAtual} de ${participantesMax} participantes` +
    (lotacaoEsgotada ? ' — Lotado' : vagasRestantes <= 5 ? ` — Só restam ${vagasRestantes} vagas!` : '');

  return (
    <View style={styles.container}>
      <StatusBar style="light" backgroundColor="transparent" translucent={true} />

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        <View style={styles.imageContainer}>
          {evento.imagem ? (
            <Image source={{ uri: evento.imagem }} style={styles.image} resizeMode="cover" />
          ) : (
            <View style={[styles.image, styles.placeholderImage]}>
              <Ionicons name="images-outline" size={50} color="#999" />
              <Text style={{ color: '#999', marginTop: 10 }}>Sem imagem disponível</Text>
            </View>
          )}
          <View style={styles.imageOverlay} />
        </View>

        <View style={styles.topActions}>
          <TouchableOpacity style={styles.iconButton} activeOpacity={0.8} onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={24} color="#333" />
          </TouchableOpacity>
          <View style={styles.rightActions}>
            <TouchableOpacity style={styles.iconButton} onPress={handleFavoritoClick} disabled={loadingFavorito}>
              {loadingFavorito ? (
                <ActivityIndicator size="small" color="#ff4757" />
              ) : (
                <Ionicons
                  name={isFavorito ? 'heart' : 'heart-outline'}
                  size={24}
                  color={isFavorito ? '#ff4757' : '#333'}
                />
              )}
            </TouchableOpacity>
            <TouchableOpacity style={[styles.iconButton, { marginLeft: 12 }]} onPress={handlePartilharClick}>
              <Ionicons name="share-social-outline" size={24} color="#333" />
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.contentSection}>
          <Text style={styles.title}>{evento.titulo}</Text>
          <Text style={styles.organizer}>Organizado por: {evento.organizador || 'ISCAC'}</Text>

          <View style={styles.detailsList}>
            <DetalheRow icon="calendar-outline" text={formatarData(evento.data)} />
            <DetalheRow icon="time-outline" text={evento.hora ? evento.hora.substring(0, 5) : '--:--'} />
            <DetalheRow icon="location-outline" text={evento.local || 'A definir'} />
            <DetalheRow icon="people-outline" text={textoParticipantes} />
          </View>

          <View style={styles.aboutSection}>
            <Text style={styles.sectionTitle}>Sobre o evento</Text>
            <Text style={styles.descriptionText}>
              {evento.descricao || 'Sem descrição disponível para este evento.'}
            </Text>
          </View>
        </View>
      </ScrollView>

      <View style={styles.bottomBar}>
        {renderBotao()}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  scrollContent: { paddingBottom: 120 },
  imageContainer: { width: '100%', height: 320, backgroundColor: '#f0f0f0' },
  image: { width: '100%', height: '100%' },
  placeholderImage: { justifyContent: 'center', alignItems: 'center' },
  imageOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.15)' },
  topActions: { position: 'absolute', top: 50, left: 20, right: 20, flexDirection: 'row', justifyContent: 'space-between', zIndex: 10 },
  iconButton: { width: 45, height: 45, borderRadius: 25, backgroundColor: '#fff', justifyContent: 'center', alignItems: 'center', elevation: 4, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 4 },
  rightActions: { flexDirection: 'row' },
  contentSection: { padding: 25, backgroundColor: '#fff', borderTopLeftRadius: 30, borderTopRightRadius: 30, marginTop: -30 },
  title: { fontSize: 24, fontWeight: 'bold', color: '#000', marginBottom: 10, lineHeight: 32 },
  organizer: { fontSize: 14, color: '#666', marginBottom: 25 },
  detailsList: { marginBottom: 30 },
  detailRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 18 },
  detailText: { fontSize: 16, color: '#333', marginLeft: 15 },
  aboutSection: { marginTop: 10 },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', color: '#000', marginBottom: 15 },
  descriptionText: { fontSize: 15, color: '#444', lineHeight: 24, textAlign: 'justify' },
  bottomBar: { position: 'absolute', bottom: 0, left: 0, right: 0, padding: 20, paddingBottom: 35, backgroundColor: '#fff', borderTopWidth: 1, borderTopColor: '#f0f0f0' },
  subscribeButton: { backgroundColor: '#d0e3ff', paddingVertical: 18, borderRadius: 15, alignItems: 'center' },
  subscribeButtonText: { fontSize: 16, fontWeight: 'bold', color: '#1157ed' },
  buttonDisabled: { backgroundColor: '#f0f0f0' },
  buttonSuccess: { backgroundColor: '#e8f5e9', borderWidth: 1, borderColor: '#4caf50' },
  buttonPending: { backgroundColor: '#fff8e1', borderWidth: 1, borderColor: '#fbc02d' },
});