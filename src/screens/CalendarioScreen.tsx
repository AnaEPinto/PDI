import React, { useState, useEffect, useMemo } from 'react';
import {
  View, Text, StyleSheet, ImageBackground, FlatList,
  TouchableOpacity, ActivityIndicator, Image,
} from 'react-native';
import { Calendar, LocaleConfig } from 'react-native-calendars';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { supabase } from '../../lib/supabase';

LocaleConfig.locales['pt'] = {
  monthNames: ['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'],
  monthNamesShort: ['Jan.','Fev.','Mar','Abr','Mai','Jun','Jul.','Ago','Set.','Out.','Nov.','Dez.'],
  dayNames: ['Domingo','Segunda-feira','Terça-feira','Quarta-feira','Quinta-feira','Sexta-feira','Sábado'],
  dayNamesShort: ['Dom','Seg','Ter','Qua','Qui','Sex','Sáb'],
  today: 'Hoje',
};
LocaleConfig.defaultLocale = 'pt';

interface Evento {
  id: number;
  titulo: string;
  data: string;
  hora: string;
  local: string;
  descricao?: string;
  imagem?: string;
  organizador?: string;
  participantes_atual?: number;
  participantes_max?: number;
}

const MESES_CURTOS = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez'];

export default function CalendarioScreen() {
  const navigation = useNavigation<any>();
  const [eventos, setEventos] = useState<Evento[]>([]);
  const [loading, setLoading] = useState(true);
  const [diaSelecionado, setDiaSelecionado] = useState<string>('');

  useEffect(() => {
    async function carregarEventos() {
      try {
        setLoading(true);
        const { data, error } = await supabase
          .from('eventos')
          .select('id, titulo, data, hora, local, descricao, imagem, organizador, participantes_atual, participantes_max');
        if (error) throw error;
        setEventos(data || []);
      } catch (error) {
        console.error('Erro ao carregar calendário:', error);
      } finally {
        setLoading(false);
      }
    }
    carregarEventos();
  }, []);

  const datasMarcadas = useMemo(() => {
    const marcadas: any = {};
    eventos.forEach((evento) => {
      marcadas[evento.data] = { marked: true, dotColor: '#1157ed' }; // ← azul em vez de branco
    });
    if (diaSelecionado) {
      marcadas[diaSelecionado] = {
        ...marcadas[diaSelecionado],
        selected: true,
        selectedColor: '#1157ed',
        selectedTextColor: '#ffffff',
      };
    }
    return marcadas;
  }, [eventos, diaSelecionado]);

  const eventosDoDia = useMemo(
    () => eventos.filter((e) => e.data === diaSelecionado),
    [eventos, diaSelecionado]
  );

  const parseDateParts = (dateStr: string) => {
    const parts = dateStr.split('-');
    if (parts.length !== 3) return { dia: '--', mes: '---' };
    return { dia: parts[2], mes: MESES_CURTOS[parseInt(parts[1]) - 1] ?? '---' };
  };

  const dataFormatada = useMemo(() => {
    if (!diaSelecionado) return '';
    const { dia, mes } = parseDateParts(diaSelecionado);
    const ano = diaSelecionado.split('-')[0];
    return `${dia} de ${mes} de ${ano}`;
  }, [diaSelecionado]);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <ImageBackground
          source={require('../../assets/header_home.jpg')}
          style={styles.headerBackground}
        >
          <View style={styles.imageFilter} />
          <View style={styles.overlay}>
            <Text style={styles.headerSubtitle}>ISCAC</Text>
            <Text style={styles.headerTitle}>Calendário de Eventos</Text>
          </View>
        </ImageBackground>
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#1157ed" />
          <Text style={styles.loadingText}>A carregar eventos...</Text>
        </View>
      ) : (
        <FlatList
          data={eventosDoDia}
          keyExtractor={(item) => item.id.toString()}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
          ListHeaderComponent={() => (
            <>
              <View style={styles.calendarCard}>
                <Calendar
                  onDayPress={(day: any) => setDiaSelecionado(day.dateString)}
                  markedDates={datasMarcadas}
                  theme={{
                    backgroundColor: 'transparent',
                    calendarBackground: 'transparent',
                    todayTextColor: '#1157ed',
                    todayBackgroundColor: '#e8f0ff',
                    arrowColor: '#1157ed',
                    textMonthFontWeight: '700',
                    textMonthFontSize: 16,
                    textDayFontSize: 15,
                    textDayHeaderFontSize: 12,
                    textDayHeaderFontWeight: '600',
                    dayTextColor: '#222',
                    textDisabledColor: '#ccc',
                    monthTextColor: '#111',
                    dotColor: '#1157ed',
                    selectedDayBackgroundColor: '#1157ed',
                    selectedDayTextColor: '#fff',
                  }}
                />
              </View>

              <View style={styles.listHeader}>
                <View style={styles.listHeaderLeft}>
                  <View style={styles.listHeaderAccent} />
                  <Text style={styles.listTitle}>
                    {diaSelecionado ? dataFormatada : 'Selecione um dia'}
                  </Text>
                </View>
                {diaSelecionado && eventosDoDia.length > 0 && (
                  <View style={styles.countBadge}>
                    <Text style={styles.countBadgeText}>{eventosDoDia.length}</Text>
                  </View>
                )}
              </View>
            </>
          )}
          renderItem={({ item, index }) => {
            const { dia, mes } = parseDateParts(item.data);
            const hora = item.hora?.substring(0, 5) ?? '--:--';
            const lotado = item.participantes_atual != null &&
              item.participantes_max != null &&
              item.participantes_atual >= item.participantes_max;

            return (
              <TouchableOpacity
                style={[styles.eventCard, index === 0 && { marginTop: 4 }]}
                activeOpacity={0.75}
                onPress={() => navigation.navigate('Detalhes', { evento: item })} // ← corrigido
              >
                {/* IMAGEM */}
                {item.imagem ? (
                  <Image source={{ uri: item.imagem }} style={styles.cardImage} />
                ) : (
                  <View style={[styles.cardImage, styles.cardImagePlaceholder]}>
                    <Text style={styles.dateDay}>{dia}</Text>
                    <Text style={styles.dateMes}>{mes}</Text>
                  </View>
                )}

                {/* CONTEÚDO */}
                <View style={styles.cardContent}>
                  <View style={styles.cardTopRow}>
                    <Text style={styles.cardTitle} numberOfLines={2}>{item.titulo}</Text>
                    {lotado && (
                      <View style={styles.lotadoBadge}>
                        <Text style={styles.lotadoText}>Lotado</Text>
                      </View>
                    )}
                  </View>

                  <View style={styles.cardMeta}>
                    <Ionicons name="time-outline" size={13} color="#888" />
                    <Text style={styles.cardMetaText}>{hora}</Text>
                    <View style={styles.dotSep} />
                    <Ionicons name="location-outline" size={13} color="#888" />
                    <Text style={styles.cardMetaText} numberOfLines={1}>{item.local || 'A definir'}</Text>
                  </View>

                  {item.organizador ? (
                    <Text style={styles.cardOrganizer}>por {item.organizador}</Text>
                  ) : null}
                </View>

                <Ionicons name="chevron-forward" size={18} color="#1157ed" style={styles.chevron} />
              </TouchableOpacity>
            );
          }}
          ListEmptyComponent={() => (
            <View style={styles.emptyContainer}>
              <Ionicons
                name={diaSelecionado ? 'calendar-clear-outline' : 'hand-left-outline'}
                size={44}
                color="#ccc"
              />
              <Text style={styles.emptyTitle}>
                {diaSelecionado ? 'Nenhum evento neste dia' : 'Selecione um dia no calendário'}
              </Text>
              <Text style={styles.emptySubtitle}>
                {diaSelecionado
                  ? 'Os dias com eventos estão assinalados no calendário.'
                  : 'Os dias com ponto azul têm eventos marcados.'}
              </Text>
            </View>
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f3f6fc' },

  header: { backgroundColor: 'transparent' },
  headerBackground: { width: '100%', height: 170, overflow: 'hidden', borderBottomLeftRadius: 20, borderBottomRightRadius: 20 },
  imageFilter: { ...StyleSheet.absoluteFillObject, backgroundColor: '#00000060' },
  overlay: { flex: 1, paddingHorizontal: 20, paddingBottom: 20, justifyContent: 'flex-end' },
  headerSubtitle: { color: '#ffffffaa', fontSize: 12, fontWeight: '600', letterSpacing: 2, textTransform: 'uppercase', marginBottom: 4 },
  headerTitle: { color: '#fff', fontSize: 22, fontWeight: '800', marginBottom: 8 },

  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 12 },
  loadingText: { color: '#999', fontSize: 14 },

  scrollContent: { paddingBottom: 40 },

  calendarCard: { marginHorizontal: 16, marginTop: 20, marginBottom: 8, borderRadius: 16, overflow: 'hidden', backgroundColor: '#fff', elevation: 3, shadowColor: '#1157ed', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 8, paddingBottom: 8 },

  listHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingTop: 20, paddingBottom: 10 },
  listHeaderLeft: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  listHeaderAccent: { width: 4, height: 20, borderRadius: 2, backgroundColor: '#1157ed' },
  listTitle: { fontSize: 16, fontWeight: '700', color: '#1a1a2e' },
  countBadge: { backgroundColor: '#1157ed', borderRadius: 12, paddingHorizontal: 10, paddingVertical: 3 },
  countBadgeText: { color: '#fff', fontSize: 12, fontWeight: '700' },

  eventCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', marginHorizontal: 16, marginBottom: 12, borderRadius: 14, elevation: 2, shadowColor: '#1157ed', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.07, shadowRadius: 6, overflow: 'hidden' },
  cardImage: { width: 80, height: 80 },
  cardImagePlaceholder: { backgroundColor: '#eef2ff', justifyContent: 'center', alignItems: 'center' },

  dateDay: { fontSize: 22, fontWeight: '800', color: '#1157ed', lineHeight: 26 },
  dateMes: { fontSize: 11, fontWeight: '600', color: '#6680cc', textTransform: 'uppercase', letterSpacing: 0.5 },

  cardContent: { flex: 1, paddingHorizontal: 14, paddingVertical: 14 },
  cardTopRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 8, marginBottom: 6 },
  cardTitle: { flex: 1, fontSize: 15, fontWeight: '700', color: '#1a1a2e', lineHeight: 20 },
  lotadoBadge: { backgroundColor: '#ffeaea', borderRadius: 6, paddingHorizontal: 7, paddingVertical: 2 },
  lotadoText: { fontSize: 10, fontWeight: '700', color: '#e53935' },

  cardMeta: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  cardMetaText: { fontSize: 12, color: '#777', flexShrink: 1 },
  dotSep: { width: 3, height: 3, borderRadius: 2, backgroundColor: '#ccc', marginHorizontal: 4 },
  cardOrganizer: { fontSize: 11, color: '#aaa', marginTop: 5, fontStyle: 'italic' },

  chevron: { paddingRight: 14 },

  emptyContainer: { alignItems: 'center', paddingVertical: 50, paddingHorizontal: 30, gap: 10 },
  emptyTitle: { fontSize: 15, fontWeight: '700', color: '#aaa', textAlign: 'center', marginTop: 6 },
  emptySubtitle: { fontSize: 13, color: '#bbb', textAlign: 'center', lineHeight: 19 },
});