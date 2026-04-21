import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  Image, 
  TouchableOpacity, 
  ScrollView, 
  Alert, 
  ActivityIndicator 
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import { supabase } from '../../lib/supabase';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function EventoDetalhesScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();

  // Recebe o evento clicado
  const eventoInicial = route.params?.evento;

  const [evento, setEvento] = useState(eventoInicial);
  const [loadingInscricao, setLoadingInscricao] = useState(false);
  const [jaInscrito, setJaInscrito] = useState(false);
  const [isFavorito, setIsFavorito] = useState(false); // Apenas visual por agora

  // Quando a página abre, verifica se a pessoa já está inscrita
  useEffect(() => {
    if (eventoInicial) {
      setEvento(eventoInicial);
      verificarSeJaInscrito(eventoInicial.id);
    }
  }, [eventoInicial]);

  const verificarSeJaInscrito = async (idEvento: number) => {
    try {
      const userId = await AsyncStorage.getItem('userId');
      if (!userId) return;

      const { data, error } = await supabase
        .from('inscricoes')
        .select('*')
        .eq('id_utilizador', userId)
        .eq('id_evento', idEvento);

      if (data && data.length > 0) {
        setJaInscrito(true);
      }
    } catch (err) {
      console.error("Erro ao verificar inscrição:", err);
    }
  };

  const handleInscrever = async () => {
    const participantesAtual = Number(evento.participantes_atual) || 0;
    const participantesMax = Number(evento.participantes_max) || 0;

    if (participantesAtual >= participantesMax) {
      Alert.alert("Lotação Esgotada", "Infelizmente já não existem vagas para este evento.");
      return;
    }

    try {
      setLoadingInscricao(true);
      
      // 1. Vai buscar o ID do aluno guardado no Login
      const userId = await AsyncStorage.getItem('userId');
      if (!userId) {
        Alert.alert("Acesso Negado", "Precisas de fazer login para te inscreveres.");
        navigation.replace('Login');
        return;
      }

      // 2. Insere na tabela 'inscricoes' (Cuidado com a gralha data_incricao que está na tua BD!)
      const dataAtualString = new Date().toISOString().split('T')[0]; // Guarda só a data YYYY-MM-DD
      
      const { error: inscricaoError } = await supabase
        .from('inscricoes')
        .insert([{ 
          id_utilizador: parseInt(userId), 
          id_evento: evento.id, 
          estado: 'Confirmado',
          data_incricao: dataAtualString // <-- Nome EXATO da tua imagem
        }]);

      if (inscricaoError) throw inscricaoError;

      // 3. Atualiza o contador na tabela 'eventos'
      const { error: updateError } = await supabase
        .from('eventos')
        .update({ participantes_atual: (participantesAtual + 1).toString() }) // Guardamos como texto para bater certo com a BD
        .eq('id', evento.id);

      if (updateError) throw updateError;

      // 4. Sucesso! Atualiza o ecrã
      setEvento({ ...evento, participantes_atual: (participantesAtual + 1).toString() });
      setJaInscrito(true);
      Alert.alert("Inscrição Confirmada!", "Vemo-nos no evento!");

    } catch (error: any) {
      console.error(error);
      Alert.alert("Erro", "Ocorreu um erro técnico ao tentar inscrever.");
    } finally {
      setLoadingInscricao(false);
    }
  };

  if (!evento) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#1157ed" />
      </View>
    );
  }

  const dataFormatada = evento.data ? evento.data.split("-").reverse().join("/") : "Data a definir";
  const inscritos = Number(evento.participantes_atual) || 0;
  const lotacao = Number(evento.participantes_max) || 0;
  const estaLotado = inscritos >= lotacao;

  return (
    <View style={styles.container}>
      <StatusBar style="light" backgroundColor="transparent" translucent={true} />

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        
        {/* IMAGEM E BOTÕES DE TOPO */}
        <View style={styles.imageContainer}>
          {evento.imagem ? (
            <Image source={{ uri: evento.imagem }} style={styles.image} resizeMode="cover" />
          ) : (
            <View style={[styles.image, styles.placeholderImage]}>
              <Ionicons name="images-outline" size={50} color="#999" />
              <Text style={{ color: '#999', marginTop: 10 }}>Sem imagem</Text>
            </View>
          )}
          <View style={styles.imageOverlay} />
        </View>

        <View style={styles.topActions}>
          <TouchableOpacity style={styles.iconButton} activeOpacity={0.8} onPress={() => navigation.goBack()}>
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

        {/* DETALHES DO EVENTO */}
        <View style={styles.contentSection}>
          <View style={styles.tagBadge}>
            <Text style={styles.tagText}>{evento.tipo_evento || "Evento"}</Text>
          </View>
          
          <Text style={styles.title}>{evento.titulo}</Text>
          <Text style={styles.organizer}>Org: {evento.organizador || "ISCAC"}</Text>

          <View style={styles.detailsList}>
            <View style={styles.detailRow}>
              <View style={styles.iconBox}><Ionicons name="calendar" size={20} color="#1157ed" /></View>
              <View>
                <Text style={styles.detailTitle}>Data e Hora</Text>
                <Text style={styles.detailText}>{dataFormatada} • {evento.hora?.substring(0, 5) || "--:--"}</Text>
              </View>
            </View>

            <View style={styles.detailRow}>
              <View style={styles.iconBox}><Ionicons name="location" size={20} color="#1157ed" /></View>
              <View>
                <Text style={styles.detailTitle}>Localização</Text>
                <Text style={styles.detailText}>{evento.local || "A definir"}</Text>
              </View>
            </View>

            <View style={styles.detailRow}>
              <View style={styles.iconBox}><Ionicons name="people" size={20} color="#1157ed" /></View>
              <View>
                <Text style={styles.detailTitle}>Lotação</Text>
                <Text style={styles.detailText}>{inscritos} de {lotacao} participantes</Text>
              </View>
            </View>
          </View>

          <View style={styles.aboutSection}>
            <Text style={styles.sectionTitle}>Sobre o evento</Text>
            <Text style={styles.descriptionText}>
              {evento.descricao || "Nenhuma descrição detalhada fornecida para este evento."}
            </Text>
          </View>
        </View>
      </ScrollView>

      {/* BOTÃO DE INSCRIÇÃO FLUTUANTE */}
      <View style={styles.bottomBar}>
        <TouchableOpacity 
          activeOpacity={0.8} 
          style={[
            styles.subscribeButton, 
            (jaInscrito || estaLotado) && styles.buttonDisabled,
            jaInscrito && styles.buttonSuccess
          ]} 
          onPress={handleInscrever}
          disabled={loadingInscricao || jaInscrito || estaLotado}
        >
          {loadingInscricao ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={[
              styles.subscribeButtonText, 
              jaInscrito && styles.buttonTextSuccess,
              estaLotado && !jaInscrito && styles.buttonTextDisabled
            ]}>
              {jaInscrito ? "✓ Já Inscrito" : estaLotado ? "Lotação Esgotada" : "Inscrever no Evento"}
            </Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f5f5f5" },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  scrollContent: { paddingBottom: 100 },
  
  imageContainer: { width: "100%", height: 350, backgroundColor: '#e0e0e0' },
  image: { width: "100%", height: "100%" },
  placeholderImage: { justifyContent: 'center', alignItems: 'center' },
  imageOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.2)' },
  
  topActions: { position: 'absolute', top: 50, left: 20, right: 20, flexDirection: 'row', justifyContent: 'space-between', zIndex: 10 },
  iconButton: { width: 45, height: 45, borderRadius: 25, backgroundColor: 'rgba(255,255,255,0.9)', justifyContent: 'center', alignItems: 'center', elevation: 4, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 4 },
  rightActions: { flexDirection: 'row' },
  
  contentSection: { padding: 25, backgroundColor: '#fff', borderTopLeftRadius: 30, borderTopRightRadius: 30, marginTop: -30, minHeight: 500 },
  
  tagBadge: { alignSelf: 'flex-start', backgroundColor: '#e6f0ff', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8, marginBottom: 15 },
  tagText: { color: '#1157ed', fontWeight: 'bold', fontSize: 12 },
  
  title: { fontSize: 26, fontWeight: 'bold', color: '#111', marginBottom: 8, lineHeight: 32 },
  organizer: { fontSize: 14, color: '#666', marginBottom: 25, fontWeight: '500' },
  
  detailsList: { marginBottom: 30, backgroundColor: '#f9f9f9', borderRadius: 15, padding: 15 },
  detailRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 15 },
  iconBox: { width: 40, height: 40, borderRadius: 10, backgroundColor: '#e6f0ff', justifyContent: 'center', alignItems: 'center', marginRight: 15 },
  detailTitle: { fontSize: 12, color: '#888', marginBottom: 2 },
  detailText: { fontSize: 15, color: '#222', fontWeight: '600' },
  
  aboutSection: { marginTop: 10 },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', color: '#111', marginBottom: 15 },
  descriptionText: { fontSize: 15, color: '#555', lineHeight: 24, textAlign: 'justify' },
  
  bottomBar: { position: 'absolute', bottom: 0, left: 0, right: 0, padding: 20, paddingBottom: 35, backgroundColor: '#fff', borderTopWidth: 1, borderTopColor: '#f0f0f0' },
  subscribeButton: { backgroundColor: '#1157ed', paddingVertical: 18, borderRadius: 15, alignItems: 'center', elevation: 3, shadowColor: '#1157ed', shadowOpacity: 0.3, shadowRadius: 5, shadowOffset: {width: 0, height: 3} },
  subscribeButtonText: { fontSize: 16, fontWeight: 'bold', color: '#fff' },
  
  buttonDisabled: { backgroundColor: '#f0f0f0', shadowOpacity: 0, elevation: 0 },
  buttonTextDisabled: { color: '#999' },
  
  buttonSuccess: { backgroundColor: '#e8f5e9', borderWidth: 1, borderColor: '#4caf50' },
  buttonTextSuccess: { color: '#4caf50' }
});