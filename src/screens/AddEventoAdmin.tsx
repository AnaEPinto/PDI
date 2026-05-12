import React, { useState } from 'react';
import { 
  View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, Alert, ActivityIndicator, Image, KeyboardAvoidingView, Platform 
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { supabase } from '../../lib/supabase';
import * as ImagePicker from 'expo-image-picker';

export default function AdicionarEventoScreen() {
  const navigation = useNavigation<any>();
  const [loading, setLoading] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);

  const [titulo, setTitulo] = useState('');
  const [tipoEvento, setTipoEvento] = useState('Conferência');
  const [data, setData] = useState('');
  const [hora, setHora] = useState('');
  const [local, setLocal] = useState('');
  const [vagas, setVagas] = useState('');
  const [imagemUri, setImagemUri] = useState<string | null>(null);   // URI local (para preview)
  const [imagemUrl, setImagemUrl] = useState<string | null>(null);   // URL pública do Supabase
  const [descricao, setDescricao] = useState('');

  const categorias = ["Conferência", "Workshop", "Networking", "Seminário"];

  // Formata a data enquanto o utilizador escreve (AAAA-MM-DD)
  const formatarData = (texto: string) => {
    const numeros = texto.replace(/\D/g, '');
    if (numeros.length <= 4) return numeros;
    if (numeros.length <= 6) return `${numeros.slice(0,4)}-${numeros.slice(4)}`;
    return `${numeros.slice(0,4)}-${numeros.slice(4,6)}-${numeros.slice(6,8)}`;
  };

  // Formata a hora enquanto o utilizador escreve (HH:MM)
  const formatarHora = (texto: string) => {
    const numeros = texto.replace(/\D/g, '');
    if (numeros.length <= 2) return numeros;
    return `${numeros.slice(0,2)}:${numeros.slice(2,4)}`;
  };

  const escolherImagem = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert("Permissão negada", "Precisamos de acesso à tua galeria para escolher uma imagem.");
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [16, 9],
      quality: 0.8,
    });

    if (!result.canceled) {
      const uri = result.assets[0].uri;
      setImagemUri(uri);       // Mostra o preview imediatamente
      setImagemUrl(null);      // Limpa a URL anterior
      await uploadImagem(uri); // Faz o upload para o Supabase
    }
  };

  // Faz upload da imagem para o Supabase Storage e devolve a URL pública
  const uploadImagem = async (uri: string) => {
    try {
      setUploadingImage(true);

      // 1. Ler o ficheiro como ArrayBuffer
      const response = await fetch(uri);
      const blob = await response.blob();
      const arrayBuffer = await new Response(blob).arrayBuffer();

      // 2. Criar um nome único para o ficheiro
      const extensao = uri.split('.').pop() || 'jpg';
      const nomeUnico = `evento_${Date.now()}.${extensao}`;

      // 3. Fazer upload para o bucket 'eventos-imagens'
      const { data, error } = await supabase.storage
        .from('eventos-imagens')
        .upload(nomeUnico, arrayBuffer, {
          contentType: `image/${extensao}`,
          upsert: false,
        });

      if (error) throw error;

      // 4. Obter a URL pública da imagem
      const { data: urlData } = supabase.storage
        .from('eventos-imagens')
        .getPublicUrl(data.path);

      setImagemUrl(urlData.publicUrl);
      console.log("Imagem carregada:", urlData.publicUrl);

    } catch (error: any) {
      console.error("Erro no upload:", error);
      Alert.alert("Erro na Imagem", "Não foi possível carregar a imagem. O evento pode ser criado sem ela.");
      setImagemUri(null);
    } finally {
      setUploadingImage(false);
    }
  };

  const handleCriarEvento = async () => {
    if (!titulo || !data || !local || !vagas || !tipoEvento) {
      Alert.alert("Campos Incompletos", "Por favor, preenche todos os campos obrigatórios (*).");
      return;
    }
    if (uploadingImage) {
      Alert.alert("Aguarda", "A imagem ainda está a ser carregada. Espera um momento.");
      return;
    }

    try {
      setLoading(true);

      const { error } = await supabase.from('eventos').insert([{
        titulo,
        tipo_evento: tipoEvento,
        data,
        hora: hora || null,
        local,
        participantes_max: parseInt(vagas),
        participantes_atual: 0,
        imagem: imagemUrl || null,  // URL pública ou null
        descricao: descricao || null,
        organizador: "ISCAC"
      }]);

      if (error) throw error;

      Alert.alert("Sucesso!", "O evento foi criado e já está disponível na aplicação.", [
        { text: "OK", onPress: () => navigation.goBack() }
      ]);

    } catch (error: any) {
      console.error("Erro ao criar evento:", error);
      Alert.alert("Erro", "Não foi possível criar o evento. Verifica os dados e tenta novamente.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />
      
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#111" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Novo Evento</Text>
        <View style={{ width: 40 }} />
      </View>

      {/* MAGIA ACONTECE AQUI: O KeyboardAvoidingView empurra tudo para cima */}
      <KeyboardAvoidingView 
        style={{ flex: 1 }} 
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
          
          {/* IMAGEM DE DESTAQUE */}
          <View style={styles.formGroup}>
            <Text style={styles.label}>Imagem de Destaque</Text>
            <TouchableOpacity 
              style={styles.imagePickerContainer} 
              onPress={escolherImagem} 
              activeOpacity={0.8}
              disabled={uploadingImage}
            >
              {imagemUri ? (
                <Image source={{ uri: imagemUri }} style={styles.previewImage} />
              ) : (
                <View style={styles.imagePlaceholder}>
                  <Ionicons name="cloud-upload-outline" size={40} color="#1157ed" />
                  <Text style={styles.imagePlaceholderText}>Toca para escolher uma imagem</Text>
                </View>
              )}

              {/* Overlay de loading durante o upload */}
              {uploadingImage && (
                <View style={styles.uploadingOverlay}>
                  <ActivityIndicator size="large" color="#fff" />
                  <Text style={styles.uploadingText}>A carregar imagem...</Text>
                </View>
              )}

              {/* Indicador de sucesso */}
              {imagemUrl && !uploadingImage && (
                <View style={styles.successBadge}>
                  <Ionicons name="checkmark-circle" size={18} color="#fff" />
                  <Text style={styles.successText}>Carregada</Text>
                </View>
              )}

              {imagemUri && !uploadingImage && (
                <View style={styles.changeImageBtn}>
                  <Ionicons name="camera" size={16} color="#fff" />
                  <Text style={styles.changeImageText}>Alterar</Text>
                </View>
              )}
            </TouchableOpacity>
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>Título do Evento *</Text>
            <TextInput 
              style={styles.input} 
              placeholder="Ex: Futuro do Marketing Digital"
              value={titulo}
              onChangeText={setTitulo}
            />
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>Tipo de Evento *</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoryScroll}>
              {categorias.map((cat) => (
                <TouchableOpacity 
                  key={cat}
                  style={[styles.catBtn, tipoEvento === cat && styles.catBtnActive]}
                  onPress={() => setTipoEvento(cat)}
                >
                  <Text style={[styles.catText, tipoEvento === cat && styles.catTextActive]}>{cat}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

          <View style={styles.row}>
            <View style={[styles.formGroup, { flex: 1, marginRight: 10 }]}>
              <Text style={styles.label}>Data *</Text>
              <View style={styles.inputIconContainer}>
                <Ionicons name="calendar-outline" size={20} color="#666" style={styles.inputIcon} />
                <TextInput 
                  style={styles.inputWithIcon} 
                  placeholder="AAAA-MM-DD"
                  value={data}
                  onChangeText={(t) => setData(formatarData(t))}
                  keyboardType="numeric"
                  maxLength={10}
                />
              </View>
            </View>
            <View style={[styles.formGroup, { flex: 1 }]}>
              <Text style={styles.label}>Hora</Text>
              <View style={styles.inputIconContainer}>
                <Ionicons name="time-outline" size={20} color="#666" style={styles.inputIcon} />
                <TextInput 
                  style={styles.inputWithIcon} 
                  placeholder="HH:MM"
                  value={hora}
                  onChangeText={(t) => setHora(formatarHora(t))}
                  keyboardType="numeric"
                  maxLength={5}
                />
              </View>
            </View>
          </View>

          <View style={styles.row}>
            <View style={[styles.formGroup, { flex: 2, marginRight: 10 }]}>
              <Text style={styles.label}>Local *</Text>
              <TextInput 
                style={styles.input} 
                placeholder="Ex: Auditório Principal"
                value={local}
                onChangeText={setLocal}
              />
            </View>
            <View style={[styles.formGroup, { flex: 1 }]}>
              <Text style={styles.label}>Vagas *</Text>
              <TextInput 
                style={styles.input} 
                placeholder="Ex: 50"
                value={vagas}
                onChangeText={setVagas}
                keyboardType="numeric"
              />
            </View>
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>Descrição</Text>
            <TextInput 
              style={[styles.input, styles.textArea]} 
              placeholder="Escreve os detalhes do evento aqui..."
              value={descricao}
              onChangeText={setDescricao}
              multiline={true}
              numberOfLines={4}
              textAlignVertical="top"
            />
          </View>

          <TouchableOpacity 
            style={[styles.submitBtn, (loading || uploadingImage) && styles.submitBtnDisabled]} 
            activeOpacity={0.8}
            onPress={handleCriarEvento}
            disabled={loading || uploadingImage}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <>
                <Ionicons name="add-circle-outline" size={22} color="#fff" style={{ marginRight: 8 }} />
                <Text style={styles.submitBtnText}>Publicar Evento</Text>
              </>
            )}
          </TouchableOpacity>

        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8f9fa' },
  
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingTop: 60, paddingBottom: 20, backgroundColor: '#fff', borderBottomWidth: 1, borderColor: '#eee' },
  backBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#f5f5f5', justifyContent: 'center', alignItems: 'center' },
  headerTitle: { fontSize: 20, fontWeight: 'bold', color: '#111' },
  
  content: { padding: 20, paddingBottom: 50 },
  
  formGroup: { marginBottom: 20 },
  label: { fontSize: 14, fontWeight: 'bold', color: '#333', marginBottom: 8, marginLeft: 4 },
  
  imagePickerContainer: { width: '100%', height: 180, backgroundColor: '#eef2ff', borderRadius: 16, borderWidth: 2, borderColor: '#d0e3ff', borderStyle: 'dashed', overflow: 'hidden', justifyContent: 'center', alignItems: 'center' },
  imagePlaceholder: { alignItems: 'center', justifyContent: 'center' },
  imagePlaceholderText: { color: '#1157ed', marginTop: 10, fontWeight: '600', fontSize: 14 },
  previewImage: { width: '100%', height: '100%', resizeMode: 'cover' },
  
  uploadingOverlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.55)', justifyContent: 'center', alignItems: 'center' },
  uploadingText: { color: '#fff', marginTop: 10, fontWeight: '600', fontSize: 14 },
  
  successBadge: { position: 'absolute', top: 10, left: 10, backgroundColor: '#22c55e', flexDirection: 'row', alignItems: 'center', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20 },
  successText: { color: '#fff', marginLeft: 5, fontSize: 12, fontWeight: 'bold' },
  
  changeImageBtn: { position: 'absolute', bottom: 10, right: 10, backgroundColor: 'rgba(0,0,0,0.6)', flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20 },
  changeImageText: { color: '#fff', marginLeft: 6, fontSize: 12, fontWeight: 'bold' },

  input: { backgroundColor: '#fff', borderWidth: 1, borderColor: '#e0e0e0', borderRadius: 12, paddingHorizontal: 15, paddingVertical: 14, fontSize: 15, color: '#111' },
  inputIconContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderWidth: 1, borderColor: '#e0e0e0', borderRadius: 12, paddingHorizontal: 15 },
  inputIcon: { marginRight: 10 },
  inputWithIcon: { flex: 1, paddingVertical: 14, fontSize: 15, color: '#111' },
  textArea: { height: 120, paddingTop: 15 },
  row: { flexDirection: 'row', justifyContent: 'space-between' },
  
  categoryScroll: { flexDirection: 'row', paddingTop: 5, paddingBottom: 5 },
  catBtn: { backgroundColor: '#fff', borderWidth: 1, borderColor: '#ddd', paddingHorizontal: 16, paddingVertical: 10, borderRadius: 20, marginRight: 10 },
  catBtnActive: { backgroundColor: '#1157ed', borderColor: '#1157ed' },
  catText: { color: '#666', fontWeight: 'bold', fontSize: 13 },
  catTextActive: { color: '#fff' },
  
  submitBtn: { flexDirection: 'row', backgroundColor: '#1157ed', padding: 16, borderRadius: 14, justifyContent: 'center', alignItems: 'center', marginTop: 10, elevation: 3, shadowColor: '#1157ed', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8 },
  submitBtnDisabled: { backgroundColor: '#a0b4e8' },
  submitBtnText: { color: '#fff', fontSize: 16, fontWeight: 'bold' }
});