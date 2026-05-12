import React, { useState, useCallback, useEffect, memo } from "react";
import { View, Text, ScrollView, StyleSheet, Image, TouchableOpacity, ActivityIndicator, ImageBackground } from "react-native";
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from "../../lib/supabase";
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation, useFocusEffect } from '@react-navigation/native';

const MESES = ['JAN','FEV','MAR','ABR','MAI','JUN','JUL','AGO','SET','OUT','NOV','DEZ'];
const getDia = (d: string) => d?.split('-')[2] ?? '00';
const getMes = (d: string) => d ? MESES[parseInt(d.split('-')[1]) - 1] : '---';

type TimeLeft = { dias: string; horas: string; mins: string; segs: string };

const SmallCard = memo(({ evento, onPress }: { evento: any; onPress: () => void }) => (
  <TouchableOpacity style={styles.smallCard} activeOpacity={0.9} onPress={onPress}>
    <View style={styles.smallCardImageContainer}>
      <Image source={{ uri: evento.imagem }} style={styles.smallCardImage} />
      <View style={styles.smallCardTag}><Text style={styles.smallCardTagText}>{evento.tipo_evento || 'Workshop'}</Text></View>
    </View>
    <View style={styles.dateBadge}>
      <Text style={styles.dateBadgeDay}>{getDia(evento.data)}</Text>
      <Text style={styles.dateBadgeMonth}>{getMes(evento.data)}</Text>
    </View>
    <View style={styles.smallCardInfo}>
      <Text style={styles.smallCardTitle} numberOfLines={2}>{evento.titulo}</Text>
      <View style={styles.smallCardTimeRow}>
        <Ionicons name="time-outline" size={12} color="#888" />
        <Text style={styles.smallCardTimeText} numberOfLines={1}>{evento.hora?.substring(0,5)} • {evento.local?.split(' ')[0]}</Text>
      </View>
    </View>
  </TouchableOpacity>
));

const SummaryCard = memo(({ icon, iconBg, iconColor, title, sub, onPress }: any) => (
  <TouchableOpacity style={styles.summaryCard} onPress={onPress} activeOpacity={onPress ? 0.8 : 1}>
    <View style={[styles.summaryIconBox, { backgroundColor: iconBg }]}>
      <Ionicons name={icon} size={20} color={iconColor} />
    </View>
    <View style={{ flex: 1 }}>
      <Text style={styles.summarySub}>{sub}</Text>
      <Text style={styles.summaryTitle} numberOfLines={1}>{title}</Text>
    </View>
    {onPress && <Ionicons name="chevron-forward" size={18} color="#ccc" />}
  </TouchableOpacity>
));

const CountdownBox = memo(({ timeLeft }: { timeLeft: TimeLeft }) => (
  <View style={styles.countdownBox}>
    <Text style={styles.countdownLabel}>Começa em</Text>
    <View style={styles.countdownRow}>
      {(Object.entries(timeLeft) as [string, string][]).map(([label, val]) => (
        <View key={label} style={styles.countdownItem}>
          <Text style={styles.countdownNum}>{val}</Text>
          <Text style={styles.countdownText}>{label}</Text>
        </View>
      ))}
    </View>
  </View>
));

export default function HomeScreen() {
  const navigation = useNavigation<any>();
  const [loading, setLoading] = useState(true);
  const [nomeUser, setNomeUser] = useState("Estudante");
  const [nextEvent, setNextEvent] = useState<any>(null);
  const [eventosSemana, setEventosSemana] = useState<any[]>([]);
  const [userEventsCount, setUserEventsCount] = useState(0);
  const [timeLeft, setTimeLeft] = useState<TimeLeft>({ dias: '00', horas: '00', mins: '00', segs: '00' });

  useFocusEffect(useCallback(() => { fetchData(); }, []));

  useEffect(() => {
    if (!nextEvent?.data) return;
    const interval = setInterval(() => {
      const dist = new Date(`${nextEvent.data}T${nextEvent.hora || '00:00'}:00`).getTime() - Date.now();
      if (dist < 0) {
        setTimeLeft({ dias: '00', horas: '00', mins: '00', segs: '00' });
        clearInterval(interval);
        return;
      }
      setTimeLeft({
        dias:  Math.floor(dist / 86400000).toString().padStart(2, '0'),
        horas: Math.floor((dist % 86400000) / 3600000).toString().padStart(2, '0'),
        mins:  Math.floor((dist % 3600000) / 60000).toString().padStart(2, '0'),
        segs:  Math.floor((dist % 60000) / 1000).toString().padStart(2, '0'),
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [nextEvent]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const userId = await AsyncStorage.getItem('userId');
      const hoje = new Date().toISOString().split('T')[0];

      // Busca Paralela de Dados ao Supabase com as regras de BD corrigidas
      const [userRes, eventsRes, inscricoesRes] = await Promise.all([
        userId ? supabase.from('utilizadores').select('nome').eq('id', Number(userId)).single() : Promise.resolve({ data: null }),
        supabase.from('eventos').select('*').gte('data', hoje).order('data', { ascending: true }).limit(5),
        userId ? supabase.from('inscricoes').select('estado').eq('id_utilizador', Number(userId)).in('estado', ['Confirmado', 'Pendente', 'Aprovada']) : Promise.resolve({ data: null }),
      ]);

      if (userRes.data?.nome) setNomeUser(userRes.data.nome.split(' ')[0]);

      if (eventsRes.data?.length) {
        setNextEvent(eventsRes.data[0]);
        setEventosSemana(eventsRes.data.slice(1));
      }

      if (inscricoesRes.data) {
        setUserEventsCount(inscricoesRes.data.length);
      }
    } catch (err) {
      console.error("Erro ao carregar Home:", err);
    } finally {
      setLoading(false);
    }
  };

  const getGreeting = () => {
    const h = new Date().getHours();
    if (h < 12) return 'Bom dia';
    if (h < 19) return 'Boa tarde';
    return 'Boa noite';
  };

  if (loading) return (
    <View style={styles.loadingContainer}>
      <ActivityIndicator size="large" color="#1157ed" />
    </View>
  );

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />
      
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
            <View style={styles.headerIcons}>
             
              <TouchableOpacity style={styles.headerIconBtn} onPress={() => navigation.navigate('Perfil')}>
                <Ionicons name="person-outline" size={20} color="#111" />
              </TouchableOpacity>
            </View>

          <View style={styles.greetingBlock}>
            <Text style={styles.greetingText}>{getGreeting()},</Text>
            <Text style={styles.greetingName}>{nomeUser}</Text>
            <Text style={styles.greetingSubtitle}>Descobre eventos e cria conexões no ISCAC.</Text>
          </View>

          <View style={styles.headerDivider}>
            <View style={styles.dividerLine} />
            <View style={styles.dividerDot} />
            <View style={styles.dividerLine} />
          </View>
        </View>

        {nextEvent && (
          <View style={styles.heroCardContainer}>
            <ImageBackground source={{ uri: nextEvent.imagem }} style={styles.heroBackground} imageStyle={{ borderRadius: 24 }}>
              <View style={styles.heroOverlay}>
                <View style={styles.heroTagsRow}>
                  <View style={styles.heroTagBlue}><Text style={styles.heroTagTextBlue}>PRÓXIMO EVENTO</Text></View>
                  <View style={styles.heroTagDark}><Text style={styles.heroTagTextDark}>{nextEvent.tipo_evento || 'Conferência'}</Text></View>
                </View>
                <Text style={styles.heroTitle} numberOfLines={2}>{nextEvent.titulo}</Text>
                <CountdownBox timeLeft={timeLeft} />
                <TouchableOpacity style={styles.heroButton} activeOpacity={0.9} onPress={() => navigation.navigate('Detalhes', { evento: nextEvent })}>
                  <Text style={styles.heroButtonText}>Ver detalhes</Text>
                </TouchableOpacity>
              </View>
            </ImageBackground>
          </View>
        )}

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Esta semana</Text>
          <TouchableOpacity onPress={() => navigation.navigate('Eventos')}>
            <Text style={styles.seeAllText}>Ver todos &gt;</Text>
          </TouchableOpacity>
        </View>
        
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.horizontalScroll}>
          {eventosSemana.map((evento, i) => (
            <SmallCard key={i} evento={evento} onPress={() => navigation.navigate('Detalhes', { evento })} />
          ))}
        </ScrollView>

        <Text style={[styles.sectionTitle, { marginHorizontal: 20, marginTop: 15 }]}>O teu resumo</Text>
        <View style={styles.summaryContainer}>
          <SummaryCard
            icon="ticket"
            iconBg="#eef2ff"
            iconColor="#1157ed"
            title={`${userEventsCount} eventos inscritos`}
            sub="Ver os meus eventos"
            onPress={() => navigation.navigate('MeusEventos')} 
          />
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f5f5f5" },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  scrollContent: { paddingBottom: 40 },
  header: { backgroundColor: '#fff', paddingHorizontal: 22, paddingTop: 58 },
  headerIcons: { flexDirection: 'row', gap: 10, marginLeft: 'auto' },
  headerIconBtn: { width: 38, height: 36, borderRadius: 19, backgroundColor: '#f5f5f5', justifyContent: 'center', alignItems: 'center' },
  notificationDot: { position: 'absolute', top: 8, right: 8, width: 7, height: 7, borderRadius: 4, backgroundColor: '#1157ed', borderWidth: 1.5, borderColor: '#fff' },
  greetingBlock: { marginBottom: 16 },
  greetingText: { fontSize: 16, color: '#999', fontWeight: '500', marginBottom: 2 },
  greetingName: { fontSize: 30, fontWeight: '800', color: '#111', marginBottom: 6, letterSpacing: -0.5 },
  greetingSubtitle: { fontSize: 14, color: '#888', lineHeight: 20 },
  headerDivider: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  dividerLine: { flex: 1, height: 1, backgroundColor: '#eee' },
  dividerDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#1157ed' },
  heroCardContainer: { marginHorizontal: 20, marginTop: 20, marginBottom: 30, borderRadius: 24, elevation: 8, shadowColor: "#0a192f", shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.25, shadowRadius: 15 },
  heroBackground: { width: '100%', borderRadius: 24 },
  heroOverlay: { padding: 24, backgroundColor: 'rgba(10, 25, 47, 0.85)', borderRadius: 24 },
  heroTagsRow: { flexDirection: 'row', marginBottom: 16, gap: 10 },
  heroTagBlue: { backgroundColor: '#1157ed', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8 },
  heroTagTextBlue: { color: '#fff', fontSize: 10, fontWeight: '900', letterSpacing: 0.5 },
  heroTagDark: { backgroundColor: 'rgba(255,255,255,0.15)', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8 },
  heroTagTextDark: { color: '#b3c5e5', fontSize: 11, fontWeight: 'bold' },
  heroTitle: { fontSize: 22, fontWeight: "800", color: "#ffffff", marginBottom: 15, lineHeight: 32 },
  countdownBox: { backgroundColor: '#0f2442', borderRadius: 16, padding: 16, marginBottom: 20, borderWidth: 1, borderColor: '#1c365d' },
  countdownLabel: { color: '#8892b0', fontSize: 11, marginBottom: 8, textTransform: 'uppercase', fontWeight: 'bold' },
  countdownRow: { flexDirection: 'row', justifyContent: 'center', gap: 8 },
  countdownItem: { alignItems: 'center', width: 60 },
  countdownNum: { color: '#4facfe', fontSize: 24, fontWeight: '900', textAlign: 'center' },
  countdownText: { color: '#8892b0', fontSize: 11, marginTop: 2, fontWeight: '500', textTransform: 'capitalize' },
  heroButton: { backgroundColor: "#1157ed", paddingVertical: 15, borderRadius: 14, alignItems: "center" },
  heroButtonText: { color: "#fff", fontSize: 16, fontWeight: "bold" },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', marginHorizontal: 20, marginBottom: 15 },
  sectionTitle: { fontSize: 18, fontWeight: "800", color: "#111" },
  seeAllText: { fontSize: 13, color: "#1157ed", fontWeight: '700' },
  horizontalScroll: { paddingHorizontal: 15, paddingBottom: 15 },
  smallCard: { width: 175, backgroundColor: '#fff', borderRadius: 20, marginHorizontal: 7, elevation: 4, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.08, shadowRadius: 10 },
  smallCardImageContainer: { height: 110, width: '100%', borderTopLeftRadius: 20, borderTopRightRadius: 20, overflow: 'hidden' },
  smallCardImage: { width: '100%', height: '100%' },
  smallCardTag: { position: 'absolute', top: 12, left: 12, backgroundColor: '#1157ed', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  smallCardTagText: { color: '#fff', fontSize: 10, fontWeight: 'bold' },
  dateBadge: { position: 'absolute', top: 85, left: 15, backgroundColor: '#fff', borderRadius: 12, width: 48, height: 48, justifyContent: 'center', alignItems: 'center', elevation: 5, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.15, shadowRadius: 6 },
  dateBadgeDay: { fontSize: 16, fontWeight: '900', color: '#111', lineHeight: 18 },
  dateBadgeMonth: { fontSize: 10, color: '#666', fontWeight: 'bold' },
  smallCardInfo: { padding: 15, paddingTop: 28 },
  smallCardTitle: { fontSize: 14, fontWeight: '800', color: '#111', marginBottom: 8, lineHeight: 20 },
  smallCardTimeRow: { flexDirection: 'row', alignItems: 'center' },
  smallCardTimeText: { fontSize: 11, color: '#888', marginLeft: 4, flex: 1, fontWeight: '500' },
  summaryContainer: { marginHorizontal: 20, marginTop: 15, marginBottom: 10 },
  summaryCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', padding: 16, borderRadius: 20, elevation: 3, shadowColor: '#000', shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.06, shadowRadius: 8 },
  summaryIconBox: { width: 44, height: 44, borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginRight: 15 },
  summaryTitle: { fontSize: 15, fontWeight: '800', color: '#111' },
  summarySub: { fontSize: 12, color: '#666', marginTop: 2, fontWeight: '500' },
});