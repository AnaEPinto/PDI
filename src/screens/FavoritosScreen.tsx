import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Image, ActivityIndicator, ImageBackground } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../../lib/supabase';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation, useFocusEffect } from '@react-navigation/native';

export default function FavoritosScreen() {
  const navigation = useNavigation<any>();
  const [favoritos, setFavoritos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useFocusEffect(
    useCallback(() => {
      carregarFavoritos();
    }, [])
  );

  const carregarFavoritos = async () => {
    setLoading(true);
    try {
      const userId = await AsyncStorage.getItem('userId');
      if (!userId) { setLoading(false); return; }

      const { data, error } = await supabase
        .from('favoritos')
        .select('eventos(*)')
        .eq('id_utilizador', Number(userId));

      if (error) throw error;

      const eventosFavoritos = data
        ?.filter(item => item.eventos != null)
        .map(item => item.eventos) || [];
      setFavoritos(eventosFavoritos);

    } catch (error: any) {
      console.error("Erro ao carregar favoritos:", error.message);
    } finally {
      setLoading(false);
    }
  };

  const renderEvento = ({ item }: { item: any }) => {
    const dataFormatada = item.data ? item.data.split("-").reverse().join("/") : "S/D";

    return (
      <TouchableOpacity
        style={styles.card}
        activeOpacity={0.8}
        onPress={() => navigation.navigate('Detalhes', { evento: item })}
      >
        {item.imagem ? (
          <Image source={{ uri: item.imagem }} style={styles.cardImage} />
        ) : (
          <View style={[styles.cardImage, styles.placeholderImage]}>
            <Ionicons name="heart" size={30} color="#1157ed" />
          </View>
        )}
        <View style={styles.cardInfo}>
          <Text style={styles.cardTitle} numberOfLines={2}>{item.titulo}</Text>
          <Text style={styles.cardSub}>{dataFormatada} • {item.local}</Text>
        </View>
        <Ionicons name="chevron-forward" size={20} color="#ccc" style={{ marginRight: 10 }} />
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <StatusBar style="light" backgroundColor="transparent" translucent={true} />

      {/* ✅ Header separado */}
      <View style={styles.header}>
        <ImageBackground
          source={require('../../assets/header_home.jpg')}
          style={styles.headerBackground}
        >
          <View style={styles.imageFilter} />
          <View style={styles.overlay}>
            <Text style={styles.headerSubtitle}>ISCAC</Text>
            <Text style={styles.headerTitle}>Os Meus Favoritos</Text>
          </View>
        </ImageBackground>
      </View>

      {/* ✅ Conteúdo separado do header */}
      {loading ? (
        <ActivityIndicator size="large" color="#1157ed" style={{ marginTop: 50 }} />
      ) : (
        <FlatList
          data={favoritos}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={styles.list}
          renderItem={renderEvento}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="heart-dislike-outline" size={60} color="#ccc" />
              <Text style={styles.emptyText}>Ainda não tens eventos favoritos.</Text>
              <TouchableOpacity
                style={styles.exploreBtn}
                onPress={() => navigation.navigate('Eventos')}
              >
                <Text style={styles.exploreBtnText}>Explorar Eventos</Text>
              </TouchableOpacity>
            </View>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f5f5f5" },

  header: { backgroundColor: 'transparent' },
  headerBackground: { width: '100%', height: 170, overflow: 'hidden', borderBottomLeftRadius: 20, borderBottomRightRadius: 20 },
  imageFilter: { ...StyleSheet.absoluteFillObject, backgroundColor: '#00000060' },
  overlay: { flex: 1, paddingHorizontal: 20, paddingBottom: 20, justifyContent: 'flex-end' },
  headerSubtitle: { color: '#ffffffaa', fontSize: 12, fontWeight: '600', letterSpacing: 2, textTransform: 'uppercase', marginBottom: 4 },
  headerTitle: { color: '#fff', fontSize: 22, fontWeight: '800', marginBottom: 8 },

  list: { padding: 15, paddingBottom: 40 },
  card: { flexDirection: 'row', backgroundColor: '#fff', borderRadius: 16, marginBottom: 12, alignItems: 'center', elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 5, overflow: 'hidden' },
  cardImage: { width: 80, height: 80 },
  placeholderImage: { backgroundColor: '#eef2ff', justifyContent: 'center', alignItems: 'center' },
  cardInfo: { flex: 1, padding: 12 },
  cardTitle: { fontSize: 15, fontWeight: 'bold', color: '#111', marginBottom: 6 },
  cardSub: { fontSize: 12, color: '#666' },
  emptyContainer: { alignItems: 'center', justifyContent: 'center', marginTop: 100 },
  emptyText: { color: '#666', marginTop: 15, fontSize: 16, marginBottom: 20 },
  exploreBtn: { backgroundColor: '#1157ed', paddingHorizontal: 20, paddingVertical: 12, borderRadius: 12 },
  exploreBtnText: { color: '#fff', fontWeight: 'bold' },
});