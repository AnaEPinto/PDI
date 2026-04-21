import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ImageBackground, FlatList, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Calendar, LocaleConfig } from 'react-native-calendars';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../../lib/supabase';

LocaleConfig.locales['pt'] = {
  monthNames: ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'],
  monthNamesShort: ['Jan.', 'Fev.', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul.', 'Ago', 'Set.', 'Out.', 'Nov.', 'Dez.'],
  dayNames: ['Domingo', 'Segunda-feira', 'Terça-feira', 'Quarta-feira', 'Quinta-feira', 'Sexta-feira', 'Sábado'],
  dayNamesShort: ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'],
  today: 'Hoje'
};
LocaleConfig.defaultLocale = 'pt';

interface Evento {
  id: number;
  titulo: string;
  data: string; 
  hora: string;
  local: string;
}

export default function CalendarioScreen() {
  const [eventos, setEventos] = useState<Evento[]>([]);
  const [loading, setLoading] = useState(true);
  const [diaSelecionado, setDiaSelecionado] = useState<string>('');

  // 2. Carregar os eventos do Supabase
  useEffect(() => {
    async function carregarEventos() {
      try {
        setLoading(true);
        const { data, error } = await supabase.from('eventos').select('id, titulo, data, hora, local');
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

  // 3. Preparar as datas marcadas com pontinhos para o Calendário
  const datasMarcadas: any = {};
  
  // Primeiro, marcamos todos os dias que têm eventos com um pontinho
  eventos.forEach((evento) => {
    datasMarcadas[evento.data] = { marked: true, dotColor: '#1157ed' };
  });

  // Depois, adicionamos o estilo de "Selecionado" ao dia em que clicámos
  if (diaSelecionado) {
    datasMarcadas[diaSelecionado] = {
      ...datasMarcadas[diaSelecionado], // Mantém o ponto se houver evento
      selected: true,
      selectedColor: '#1157ed',
    };
  }

  const eventosDoDia = eventos.filter((e) => e.data === diaSelecionado);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <ImageBackground source={require("../../assets/header_home.jpg")} style={styles.headerBackground}>
          <View style={styles.imageFilter} />
          <View style={styles.overlay}>
            <View style={styles.titleContainer}>
              <Text style={styles.headerTitle}>Calendário de Eventos</Text>
            </View>
          </View>
        </ImageBackground>
      </View>

      {loading ? (
        <ActivityIndicator size="large" color="#1157ed" style={{ marginTop: 50 }} />
      ) : (
        <>
          <View style={styles.calendarContainer}>
            <Calendar
              onDayPress={(day: any) => setDiaSelecionado(day.dateString)}
              markedDates={datasMarcadas}
              theme={{
                todayTextColor: '#1157ed',
                arrowColor: '#1157ed',
                textMonthFontWeight: 'bold',
                textDayFontSize: 16,
              }}
            />
          </View>

          <View style={styles.listContainer}>
            <Text style={styles.listTitle}>
              {diaSelecionado ? `Eventos em ${diaSelecionado.split("-").reverse().join("/")}` : "Selecione uma data"}
            </Text>
            
            <FlatList
              data={eventosDoDia}
              keyExtractor={(item) => item.id.toString()}
              showsVerticalScrollIndicator={false}
              renderItem={({ item }) => (
                <View style={styles.eventCard}>
                  <Text style={styles.eventCardTitle}>{item.titulo}</Text>
                  <View style={styles.eventCardInfo}>
                    <Ionicons name="time-outline" size={14} color="#666" />
                    <Text style={styles.eventCardText}>{item.hora.substring(0, 5)}</Text>
                    <Ionicons name="location-outline" size={14} color="#666" style={{ marginLeft: 10 }} />
                    <Text style={styles.eventCardText} numberOfLines={1}>{item.local}</Text>
                  </View>
                </View>
              )}
              ListEmptyComponent={() => (
                <Text style={styles.emptyText}>
                  {diaSelecionado ? "Não há eventos marcados para este dia." : "Nenhum dia selecionado."}
                </Text>
              )}
            />
          </View>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f5f5f5" },
  header: { backgroundColor: "transparent", paddingBottom: 10 },
  headerBackground: { width: "100%", height: 160, overflow: "hidden", borderBottomLeftRadius: 15, borderBottomRightRadius: 15 },
  imageFilter: { ...StyleSheet.absoluteFillObject, backgroundColor: "#00000044" },
  overlay: { flex: 1, paddingHorizontal: 15, paddingBottom: 30, justifyContent: "flex-end" },
  titleContainer: { backgroundColor: "#ffffffa8", paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8, alignSelf: 'flex-start' },
  headerTitle: { color: "#000", fontSize: 18, fontWeight: "bold" },
  
  calendarContainer: { marginHorizontal: 15, marginTop: 20, borderRadius: 10, overflow: 'hidden', elevation: 4, backgroundColor: 'white', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4 },
  
  listContainer: { flex: 1, padding: 20 },
  listTitle: { fontSize: 16, fontWeight: 'bold', color: '#333', marginBottom: 15 },
  
  eventCard: { backgroundColor: 'white', padding: 15, borderRadius: 8, marginBottom: 10, borderLeftWidth: 4, borderLeftColor: '#1157ed', elevation: 1 },
  eventCardTitle: { fontSize: 16, fontWeight: 'bold', color: '#333', marginBottom: 5 },
  eventCardInfo: { flexDirection: 'row', alignItems: 'center' },
  eventCardText: { fontSize: 13, color: '#666', marginLeft: 4 },
  
  emptyText: { color: '#999', textAlign: 'center', marginTop: 20, fontStyle: 'italic' }
});