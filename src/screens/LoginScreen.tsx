import React, { useState, useCallback } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ImageBackground, KeyboardAvoidingView, Platform,
  ActivityIndicator, Alert
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { supabase } from '../../lib/supabase';
import AsyncStorage from '@react-native-async-storage/async-storage';

const KEYBOARD_BEHAVIOR = Platform.OS === 'ios' ? 'padding' : 'height';

export default function LoginScreen() {
  const navigation = useNavigation<any>();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = useCallback(async () => {
    if (!email || !password) {
      Alert.alert('Aviso', 'Por favor, preenche todos os campos.');
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('utilizadores')
        .select('id, palavra_passe, permissao')  
        .eq('email', email.toLowerCase().trim())
        .single();

      if (error || !data) {
        Alert.alert('Erro de Login', 'E-mail não encontrado.');
        return;
      }

      if (data.palavra_passe !== password) {
        Alert.alert('Erro', 'Palavra-passe incorreta.');
        return;
      }

      const cargo = data.permissao?.trim().toLowerCase() ?? 'normal';

      await AsyncStorage.multiSet([
        ['userId', data.id.toString()],
        ['userCargo', cargo],
      ]);

      navigation.replace('MainApp');

    } catch (err) {
      Alert.alert('Erro', 'Falha ao ligar à base de dados.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [email, password, navigation]);

  return (
    <KeyboardAvoidingView behavior={KEYBOARD_BEHAVIOR} style={styles.container}>
      <StatusBar style="light" />
      <ImageBackground source={require('../../assets/header_home.jpg')} style={styles.backgroundImage}>
        <View style={styles.overlay} />
        <View style={styles.content}>

          <View style={styles.headerContainer}>
            <Ionicons name="school" size={70} color="#fff" style={styles.logo} />
            <Text style={styles.title}>ISCAC Eventos</Text>
            <Text style={styles.subtitle}>Coimbra Business School</Text>
          </View>

          <View style={styles.formContainer}>
            <View style={styles.inputContainer}>
              <Ionicons name="mail-outline" size={20} color="#666" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="E-mail Institucional"
                placeholderTextColor="#999"
                keyboardType="email-address"
                autoCapitalize="none"
                value={email}
                onChangeText={setEmail}
              />
            </View>

            <View style={styles.inputContainer}>
              <Ionicons name="lock-closed-outline" size={20} color="#666" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Palavra-passe"
                placeholderTextColor="#999"
                secureTextEntry
                value={password}
                onChangeText={setPassword}
              />
            </View>

            <TouchableOpacity
              style={styles.loginButton}
              activeOpacity={0.8}
              onPress={handleLogin}
              disabled={loading}
            >
              {loading
                ? <ActivityIndicator color="#fff" />
                : <Text style={styles.loginButtonText}>Entrar</Text>
              }
            </TouchableOpacity>

            <Text style={styles.footerNote}>Use as suas credenciais de estudante.</Text>
          </View>

        </View>
      </ImageBackground>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  backgroundImage: { flex: 1, width: '100%', justifyContent: 'center' },
  overlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(17, 87, 237, 0.82)' },
  content: { flex: 1, justifyContent: 'center', padding: 25 },
  headerContainer: { alignItems: 'center', marginBottom: 35 },
  logo: { marginBottom: 10 },
  title: { fontSize: 34, fontWeight: 'bold', color: '#fff', letterSpacing: 1 },
  subtitle: { fontSize: 16, color: '#f0f0f0', marginTop: 5 },
  formContainer: { backgroundColor: '#fff', padding: 25, borderRadius: 24, elevation: 12, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 10 },
  inputContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#f8f9fa', borderRadius: 15, marginBottom: 15, paddingHorizontal: 15, height: 60, borderWidth: 1, borderColor: '#eee' },
  inputIcon: { marginRight: 12 },
  input: { flex: 1, fontSize: 16, color: '#333' },
  loginButton: { backgroundColor: '#1157ed', borderRadius: 15, height: 60, justifyContent: 'center', alignItems: 'center', marginTop: 10 },
  loginButtonText: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
  footerNote: { textAlign: 'center', color: '#999', fontSize: 12, marginTop: 20 },
});