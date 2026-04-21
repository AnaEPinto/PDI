import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity, ScrollView, Alert, ActivityIndicator } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import { supabase } from '../../lib/supabase';

export default function EventoDetalhesScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();

  const [evento, setEvento] = useState(route.params?.evento);
  const [isSubscribing, setIsSubscribing] = useState(false);
  const [isFavorito, setIsFavorito] = useState(false);

  useEffect(() => {
    if (route.params?.evento) {
      setEvento(route.params.evento);
      setIsSubscribing(false); 
    }
  }, [route.params?.evento]); 

  if (!evento) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#1157ed" />
        <Text style={{ marginTop: 10, color: '#666' }}>A carregar evento...</Text>
      </View>
    );
  }

  const handleInscrever = async () => {
    const participantesAtual = Number(evento.participantes_atual) || 0;
    const participantesMax = Number(evento.participantes_max) || 0;

    if (participantesAtual >= participantesMax) {
      Alert.alert("Evento Lotado", "Infelizmente já não existem vagas disponíveis.");
      return;
    }

    try {
      setIsSubscribing(true);
      const id_utilizador_teste = 1; 

      const { error: inscricaoError } = await supabase
        .from('inscricoes')
        .insert([{ id_utilizador: id_utilizador_teste, id_evento: evento.id, estado: 'Confirmado' }]);

      if (inscricaoError) throw inscricaoError;

      const { error: updateError } = await supabase
        .from('eventos')
        .update({ participantes_atual: participantesAtual + 1 })
        .eq('id', evento.id);

      if (updateError) throw updateError;

      setEvento({ ...evento, participantes_atual: participantesAtual + 1 });
      Alert.alert("Sucesso!", "A tua inscrição foi confirmada.");

    } catch (error: any) {
      Alert.alert("Erro", "Poderás já estar inscrito ou ocorreu um erro técnico.");
    } finally {
      setIsSubscribing(false);
    }
  };

  const formatarData = (dataStr: string) => {
    if (!dataStr) return "Data a definir";
    const meses = ['janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho', 'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'];
    const partes = dataStr.split('-');
    if(partes.length === 3) {
      return `${partes[2]} de ${meses[parseInt(partes[1]) - 1]} de ${partes[0]}`;
    }
    return dataStr;
  };

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
          <TouchableOpacity 
            style={styles.iconButton} 
            activeOpacity={0.8} 
            // AQUI ESTÁ A CORREÇÃO: goBack() volta para onde estavas (EventosScreen)
            onPress={() => navigation.goBack()} 
          >
            <Ionicons name="arrow-back" size={24} color="#333" />
          </TouchableOpacity>
          
          <View style={styles.rightActions}>
            <TouchableOpacity style={styles.iconButton} onPress={() => setIsFavorito(!isFavorito)}>
              <Ionicons name={isFavorito ? "heart" : "heart-outline"} size={24} color={isFavorito ? "#ff4757" : "#333"} />
            </TouchableOpacity>
            <TouchableOpacity style={[styles.iconButton, { marginLeft: 12 }]}>
              <Ionicons name="share-social-outline" size={24} color="#333" />
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.contentSection}>
          <Text style={styles.title}>{evento.titulo}</Text>
          <Text style={styles.organizer}>Organizado por: {evento.organizador || "ISCAC"}</Text>

          <View style={styles.detailsList}>
            <View style={styles.detailRow}>
              <Ionicons name="calendar-outline" size={22} color="#999" />
              <Text style={styles.detailText}>{formatarData(evento.data)}</Text>
            </View>
            <View style={styles.detailRow}>
              <Ionicons name="time-outline" size={22} color="#999" />
              <Text style={styles.detailText}>{evento.hora ? evento.hora.substring(0, 5) : "--:--"}</Text>
            </View>
            <View style={styles.detailRow}>
              <Ionicons name="location-outline" size={22} color="#999" />
              <Text style={styles.detailText}>{evento.local || "A definir"}</Text>
            </View>
            <View style={styles.detailRow}>
              <Ionicons name="people-outline" size={22} color="#999" />
              <Text style={styles.detailText}>{evento.participantes_atual} de {evento.participantes_max} participantes</Text>
            </View>
          </View>

          <View style={styles.aboutSection}>
            <Text style={styles.sectionTitle}>Sobre o evento</Text>
            <Text style={styles.descriptionText}>
              {evento.descricao || "Sem descrição disponível para este evento."}
            </Text>
          </View>
        </View>
      </ScrollView>

      <View style={styles.bottomBar}>
        <TouchableOpacity 
          activeOpacity={0.8} 
          style={[styles.subscribeButton, (evento.participantes_atual >= evento.participantes_max) && styles.buttonDisabled]} 
          onPress={handleInscrever}
          disabled={isSubscribing || evento.participantes_atual >= evento.participantes_max}
        >
          {isSubscribing ? (
            <ActivityIndicator color="#1157ed" />
          ) : (
            <Text style={[styles.subscribeButtonText, (evento.participantes_atual >= evento.participantes_max) && { color: '#999' }]}>
              {evento.participantes_atual >= evento.participantes_max ? "Evento Lotado" : "Inscrever"}
            </Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  scrollContent: { paddingBottom: 120 },
  imageContainer: { width: "100%", height: 320, backgroundColor: '#f0f0f0' },
  image: { width: "100%", height: "100%" },
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
  sectionTitle: { fontSize: 18, fontWeight: 'bold', color: '#000', marginBottom: 15, textAlign: 'right' },
  descriptionText: { fontSize: 15, color: '#444', lineHeight: 24, textAlign: 'justify' },
  bottomBar: { position: 'absolute', bottom: 0, left: 0, right: 0, padding: 20, paddingBottom: 35, backgroundColor: '#fff', borderTopWidth: 1, borderTopColor: '#f0f0f0' },
  subscribeButton: { backgroundColor: '#d0e3ff', paddingVertical: 18, borderRadius: 15, alignItems: 'center' },
  subscribeButtonText: { fontSize: 16, fontWeight: 'bold', color: '#1157ed' },
  buttonDisabled: { backgroundColor: '#f0f0f0' }
});