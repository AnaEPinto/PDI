import React, { useState, useEffect, useCallback, memo } from 'react';
import {
  View, Text, StyleSheet, TextInput, TouchableOpacity,
  ScrollView, Alert, ActivityIndicator, Image,
  KeyboardAvoidingView, Platform, FlatList
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { supabase } from '../../lib/supabase';
import * as ImagePicker from 'expo-image-picker';

const CATEGORIAS = ["Conferência", "Workshop", "Networking", "Seminário"] as const;

const FORM_INICIAL = {
  titulo: '',
  tipoEvento: '',
  data: '',
  hora: '',
  local: '',
  vagas: '',
  descricao: '',
  imagemUri: null as string | null,
  imagemUrl: null as string | null,
};

const formatarData = (texto: string): string => {
  const n = texto.replace(/\D/g, '');
  if (n.length <= 4) return n;
  if (n.length <= 6) return `${n.slice(0, 4)}-${n.slice(4)}`;
  return `${n.slice(0, 4)}-${n.slice(4, 6)}-${n.slice(6, 8)}`;
};

const formatarHora = (texto: string): string => {
  const n = texto.replace(/\D/g, '');
  if (n.length <= 2) return n;
  return `${n.slice(0, 2)}:${n.slice(2, 4)}`;
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

const EventCard = memo(({ item, onPress }: { item: any; onPress: (item: any) => void }) => (
  <TouchableOpacity style={styles.eventCard} activeOpacity={0.7} onPress={() => onPress(item)}>
    {item.imagem ? (
      <Image source={{ uri: item.imagem }} style={styles.eventCardImage} />
    ) : (
      <View style={[styles.eventCardImage, styles.eventCardImagePlaceholder]}>
        <Ionicons name="calendar" size={30} color="#1157ed" />
      </View>
    )}
    <View style={styles.eventCardInfo}>
      <Text style={styles.eventCardTitle} numberOfLines={1}>{item.titulo}</Text>
      <Text style={styles.eventCardSub}>{item.data} • {item.local}</Text>
    </View>
    <Ionicons name="pencil" size={20} color="#1157ed" />
  </TouchableOpacity>
));

const FormularioEdicao = memo(({
  form, setForm, saving, uploadingImage, onGuardar, onEscolherImagem,
}: {
  form: typeof FORM_INICIAL;
  setForm: React.Dispatch<React.SetStateAction<typeof FORM_INICIAL>>;
  saving: boolean;
  uploadingImage: boolean;
  onGuardar: () => void;
  onEscolherImagem: () => void;
}) => {
  const set = (key: keyof typeof FORM_INICIAL) =>
    (value: string) => setForm(prev => ({ ...prev, [key]: value }));

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>

        <View style={styles.formGroup}>
          <Text style={styles.label}>Imagem de Destaque</Text>
          <TouchableOpacity
            style={styles.imagePickerContainer}
            onPress={onEscolherImagem}
            activeOpacity={0.8}
            disabled={uploadingImage}
          >
            {form.imagemUri ? (
              <Image source={{ uri: form.imagemUri }} style={styles.previewImage} />
            ) : (
              <View style={styles.imagePlaceholder}>
                <Ionicons name="image-outline" size={40} color="#1157ed" />
                <Text style={styles.imagePlaceholderText}>Adicionar imagem</Text>
              </View>
            )}
            {uploadingImage ? (
              <View style={styles.uploadingOverlay}>
                <ActivityIndicator color="#fff" />
              </View>
            ) : (
              <View style={styles.changeImageBtn}>
                <Ionicons name="camera" size={16} color="#fff" />
                <Text style={styles.changeImageText}>Alterar</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.label}>Título do Evento *</Text>
          <TextInput style={styles.input} value={form.titulo} onChangeText={set('titulo')} />
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.label}>Tipo de Evento *</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoryScroll}>
            {CATEGORIAS.map((cat) => (
              <TouchableOpacity
                key={cat}
                style={[styles.catBtn, form.tipoEvento === cat && styles.catBtnActive]}
                onPress={() => setForm(prev => ({ ...prev, tipoEvento: cat }))}
              >
                <Text style={[styles.catText, form.tipoEvento === cat && styles.catTextActive]}>{cat}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        <View style={styles.row}>
          <View style={[styles.formGroup, { flex: 1, marginRight: 10 }]}>
            <Text style={styles.label}>Data *</Text>
            <TextInput
              style={styles.input}
              value={form.data}
              onChangeText={(t) => setForm(prev => ({ ...prev, data: formatarData(t) }))}
              keyboardType="numeric"
              maxLength={10}
            />
          </View>
          <View style={[styles.formGroup, { flex: 1 }]}>
            <Text style={styles.label}>Hora</Text>
            <TextInput
              style={styles.input}
              value={form.hora}
              onChangeText={(t) => setForm(prev => ({ ...prev, hora: formatarHora(t) }))}
              keyboardType="numeric"
              maxLength={5}
            />
          </View>
        </View>

        <View style={styles.row}>
          <View style={[styles.formGroup, { flex: 2, marginRight: 10 }]}>
            <Text style={styles.label}>Local *</Text>
            <TextInput style={styles.input} value={form.local} onChangeText={set('local')} />
          </View>
          <View style={[styles.formGroup, { flex: 1 }]}>
            <Text style={styles.label}>Vagas *</Text>
            <TextInput style={styles.input} value={form.vagas} onChangeText={set('vagas')} keyboardType="numeric" />
          </View>
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.label}>Descrição</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            value={form.descricao}
            onChangeText={set('descricao')}
            multiline
            numberOfLines={4}
            textAlignVertical="top"
          />
        </View>

        <TouchableOpacity
          style={[styles.submitBtn, (saving || uploadingImage) && styles.submitBtnDisabled]}
          onPress={onGuardar}
          disabled={saving || uploadingImage}
        >
          {saving ? <ActivityIndicator color="#fff" /> : (
            <>
              <Ionicons name="save-outline" size={22} color="#fff" style={{ marginRight: 8 }} />
              <Text style={styles.submitBtnText}>Guardar Alterações</Text>
            </>
          )}
        </TouchableOpacity>

      </ScrollView>
    </KeyboardAvoidingView>
  );
});

export default function EditEventoAdmin() {
  const navigation = useNavigation<any>();

  const [eventos, setEventos] = useState<any[]>([]);
  const [loadingLista, setLoadingLista] = useState(true);
  const [eventoSelecionado, setEventoSelecionado] = useState<any>(null);
  const [saving, setSaving] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [form, setForm] = useState(FORM_INICIAL);

  useEffect(() => { fetchEventos(); }, []);

  const fetchEventos = useCallback(async () => {
    await withLoading(setLoadingLista, async () => {
      const { data, error } = await supabase
        .from('eventos')
        .select('*')
        .order('data', { ascending: false });

      if (error) throw error;
      setEventos(data || []);
    }).catch(() => Alert.alert('Erro', 'Não foi possível carregar os eventos.'));
  }, []);

  const abrirFormulario = useCallback((evento: any) => {
    setEventoSelecionado(evento);
    setForm({
      titulo: evento.titulo,
      tipoEvento: evento.tipo_evento,
      data: evento.data,
      hora: evento.hora || '',
      local: evento.local,
      vagas: String(evento.participantes_max),
      descricao: evento.descricao || '',
      imagemUri: evento.imagem,
      imagemUrl: evento.imagem,
    });
  }, []);

  const escolherImagem = useCallback(async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permissão negada', 'Precisamos de acesso à galeria.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [16, 9],
      quality: 0.8,
    });

    if (result.canceled) return;

    const uri = result.assets[0].uri;
    setForm(prev => ({ ...prev, imagemUri: uri }));

    await withLoading(setUploadingImage, async () => {
      const response = await fetch(uri);
      const blob = await response.blob();
      const arrayBuffer = await new Response(blob).arrayBuffer();
      const extensao = uri.split('.').pop() || 'jpg';
      const nomeUnico = `evento_edit_${Date.now()}.${extensao}`;

      const { data, error } = await supabase.storage
        .from('eventos-imagens')
        .upload(nomeUnico, arrayBuffer, { contentType: `image/${extensao}`, upsert: false });

      if (error) throw error;

      const { data: urlData } = supabase.storage.from('eventos-imagens').getPublicUrl(data.path);
      setForm(prev => ({ ...prev, imagemUrl: urlData.publicUrl }));
    }).catch(() => {
      Alert.alert('Erro', 'Não foi possível carregar a nova imagem.');
      setForm(prev => ({ ...prev, imagemUri: prev.imagemUrl })); 
    });
  }, []);

  const handleAtualizarEvento = useCallback(async () => {
    const { titulo, data, local, vagas, tipoEvento, hora, imagemUrl, descricao } = form;

    if (!titulo || !data || !local || !vagas || !tipoEvento) {
      Alert.alert('Atenção', 'Preenche os campos obrigatórios (*)');
      return;
    }

    await withLoading(setSaving, async () => {
      const { error } = await supabase
        .from('eventos')
        .update({
          titulo,
          tipo_evento: tipoEvento,
          data,
          hora: hora || null,
          local,
          participantes_max: parseInt(vagas),
          imagem: imagemUrl,
          descricao: descricao || null,
        })
        .eq('id', eventoSelecionado.id);

      if (error) throw error;

      Alert.alert('Sucesso!', 'O evento foi atualizado.', [
        { text: 'OK', onPress: () => { setEventoSelecionado(null); fetchEventos(); } },
      ]);
    }).catch(() => Alert.alert('Erro', 'Não foi possível atualizar o evento.'));
  }, [form, eventoSelecionado, fetchEventos]);

  const handleVoltar = useCallback(() => {
    if (eventoSelecionado) setEventoSelecionado(null);
    else navigation.goBack();
  }, [eventoSelecionado, navigation]);

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />

      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={handleVoltar}>
          <Ionicons name="arrow-back" size={24} color="#111" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{eventoSelecionado ? 'A Editar Evento' : 'Escolher Evento'}</Text>
        <View style={{ width: 40 }} />
      </View>

      {!eventoSelecionado ? (
        <View style={styles.listContainer}>
          {loadingLista ? (
            <ActivityIndicator size="large" color="#1157ed" style={{ marginTop: 50 }} />
          ) : eventos.length === 0 ? (
            <Text style={styles.emptyText}>Não tens eventos criados.</Text>
          ) : (
            <FlatList
              data={eventos}
              keyExtractor={(item) => item.id.toString()}
              contentContainerStyle={{ paddingBottom: 40 }}
              renderItem={({ item }) => <EventCard item={item} onPress={abrirFormulario} />}
            />
          )}
        </View>
      ) : (
        <FormularioEdicao
          form={form}
          setForm={setForm}
          saving={saving}
          uploadingImage={uploadingImage}
          onGuardar={handleAtualizarEvento}
          onEscolherImagem={escolherImagem}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8f9fa' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingTop: 60, paddingBottom: 20, backgroundColor: '#fff', borderBottomWidth: 1, borderColor: '#eee' },
  backBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#f5f5f5', justifyContent: 'center', alignItems: 'center' },
  headerTitle: { fontSize: 20, fontWeight: 'bold', color: '#111' },

  listContainer: { flex: 1, padding: 20 },
  emptyText: { textAlign: 'center', color: '#666', marginTop: 50, fontSize: 16 },
  eventCard: { flexDirection: 'row', backgroundColor: '#fff', padding: 12, borderRadius: 16, marginBottom: 15, alignItems: 'center', elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 5 },
  eventCardImage: { width: 60, height: 60, borderRadius: 12, marginRight: 15 },
  eventCardImagePlaceholder: { backgroundColor: '#eef2ff', justifyContent: 'center', alignItems: 'center' },
  eventCardInfo: { flex: 1, marginRight: 10 },
  eventCardTitle: { fontSize: 16, fontWeight: 'bold', color: '#111', marginBottom: 4 },
  eventCardSub: { fontSize: 13, color: '#666' },

  content: { padding: 20, paddingBottom: 50 },
  formGroup: { marginBottom: 20 },
  label: { fontSize: 14, fontWeight: 'bold', color: '#333', marginBottom: 8, marginLeft: 4 },
  input: { backgroundColor: '#fff', borderWidth: 1, borderColor: '#e0e0e0', borderRadius: 12, paddingHorizontal: 15, paddingVertical: 14, fontSize: 15, color: '#111' },
  textArea: { height: 120, paddingTop: 15 },
  row: { flexDirection: 'row', justifyContent: 'space-between' },

  categoryScroll: { flexDirection: 'row', paddingTop: 5, paddingBottom: 5 },
  catBtn: { backgroundColor: '#fff', borderWidth: 1, borderColor: '#ddd', paddingHorizontal: 16, paddingVertical: 10, borderRadius: 20, marginRight: 10 },
  catBtnActive: { backgroundColor: '#1157ed', borderColor: '#1157ed' },
  catText: { color: '#666', fontWeight: 'bold', fontSize: 13 },
  catTextActive: { color: '#fff' },

  imagePickerContainer: { width: '100%', height: 180, backgroundColor: '#eef2ff', borderRadius: 16, borderWidth: 2, borderColor: '#d0e3ff', borderStyle: 'dashed', overflow: 'hidden', justifyContent: 'center', alignItems: 'center' },
  imagePlaceholder: { alignItems: 'center', justifyContent: 'center' },
  imagePlaceholderText: { color: '#1157ed', marginTop: 10, fontWeight: '600', fontSize: 14 },
  previewImage: { width: '100%', height: '100%', resizeMode: 'cover' },
  uploadingOverlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
  changeImageBtn: { position: 'absolute', bottom: 10, right: 10, backgroundColor: 'rgba(0,0,0,0.6)', flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20 },
  changeImageText: { color: '#fff', marginLeft: 6, fontSize: 12, fontWeight: 'bold' },

  submitBtn: { flexDirection: 'row', backgroundColor: '#1157ed', padding: 16, borderRadius: 14, justifyContent: 'center', alignItems: 'center', marginTop: 10 },
  submitBtnDisabled: { backgroundColor: '#a0b4e8' },
  submitBtnText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
});