import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { api } from '../lib/api';
import { theme } from '../theme';

export default function Login({ onLoggedIn }) {
  const insets = useSafeAreaInsets();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPwd, setShowPwd] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const submit = async () => {
    setError('');
    const u = username.trim();
    if (!u || !password) {
      setError("Veuillez saisir votre nom d'utilisateur et votre mot de passe.");
      return;
    }
    setLoading(true);
    try {
      const data = await api.login(u, password);
      onLoggedIn(data);
    } catch (err) {
      if (err.status === 401 || err.status === 400) setError('Identifiants incorrects.');
      else if (err.status === 403) setError("Compte désactivé ou non autorisé.");
      else setError(err.message || 'Connexion impossible. Vérifiez votre réseau.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: theme.colors.bg }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        contentContainerStyle={[styles.container, { paddingTop: insets.top + 40, paddingBottom: insets.bottom + 24 }]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.logo}>
          <Ionicons name="qr-code" size={40} color="#fff" />
        </View>
        <Text style={styles.title}>BisoInvit</Text>
        <Text style={styles.subtitle}>Application Contrôleur</Text>

        <View style={styles.card}>
          <View style={styles.field}>
            <Text style={styles.label}>Nom d'utilisateur</Text>
            <View style={styles.inputWrap}>
              <Ionicons name="person-outline" size={18} color={theme.colors.textMuted} />
              <TextInput
                style={styles.input}
                value={username}
                onChangeText={(v) => { setUsername(v); if (error) setError(''); }}
                autoCapitalize="none"
                autoCorrect={false}
                placeholder="ex: agent01"
                placeholderTextColor={theme.colors.textLight}
                returnKeyType="next"
              />
            </View>
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>Mot de passe</Text>
            <View style={styles.inputWrap}>
              <Ionicons name="lock-closed-outline" size={18} color={theme.colors.textMuted} />
              <TextInput
                style={styles.input}
                value={password}
                onChangeText={(v) => { setPassword(v); if (error) setError(''); }}
                secureTextEntry={!showPwd}
                placeholder="••••••••"
                placeholderTextColor={theme.colors.textLight}
                returnKeyType="go"
                onSubmitEditing={submit}
              />
              <TouchableOpacity onPress={() => setShowPwd((v) => !v)}>
                <Ionicons
                  name={showPwd ? 'eye-off-outline' : 'eye-outline'}
                  size={18}
                  color={theme.colors.textMuted}
                />
              </TouchableOpacity>
            </View>
          </View>

          {error ? (
            <View style={styles.errorBox}>
              <Ionicons name="alert-circle-outline" size={16} color={theme.colors.danger} />
              <Text style={styles.errorText}>{error}</Text>
            </View>
          ) : null}

          <TouchableOpacity
            style={[styles.button, loading && { opacity: 0.6 }]}
            onPress={submit}
            disabled={loading}
            activeOpacity={0.85}
          >
            {loading
              ? <ActivityIndicator color="#fff" />
              : (
                <>
                  <Text style={styles.buttonText}>Se connecter</Text>
                  <Ionicons name="arrow-forward" size={18} color="#fff" />
                </>
              )}
          </TouchableOpacity>
        </View>

        <Text style={styles.hint}>
          Demandez vos identifiants à l'administrateur de l'événement.
        </Text>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flexGrow: 1, padding: 24, justifyContent: 'center' },
  logo: {
    alignSelf: 'center', width: 76, height: 76, borderRadius: 38,
    backgroundColor: theme.colors.primary,
    alignItems: 'center', justifyContent: 'center', marginBottom: 16,
    ...theme.shadow.md,
  },
  title: { fontSize: 32, textAlign: 'center', color: theme.colors.text, fontFamily: theme.font.bold, letterSpacing: 0.5 },
  subtitle: { textAlign: 'center', color: theme.colors.textMuted, marginBottom: 28, fontFamily: theme.font.regular, fontSize: 13 },
  card: {
    backgroundColor: theme.colors.surface, borderRadius: theme.radius.lg, padding: 20,
    ...theme.shadow.md,
  },
  field: { marginBottom: 14 },
  label: { fontSize: 12, color: theme.colors.textMuted, marginBottom: 6, fontFamily: theme.font.regular, textTransform: 'uppercase', letterSpacing: 0.5 },
  inputWrap: {
    flexDirection: 'row', alignItems: 'center',
    borderWidth: 1, borderColor: theme.colors.border,
    borderRadius: theme.radius.md,
    paddingHorizontal: 12, paddingVertical: 10,
    backgroundColor: theme.colors.bg,
  },
  input: {
    flex: 1, marginLeft: 10, fontSize: 15,
    color: theme.colors.text, fontFamily: theme.font.regular,
    paddingVertical: 0,
  },
  errorBox: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: theme.colors.dangerSoft,
    padding: 10, borderRadius: theme.radius.md, marginBottom: 12,
  },
  errorText: { flex: 1, marginLeft: 8, color: theme.colors.danger, fontSize: 12, fontFamily: theme.font.regular },
  button: {
    flexDirection: 'row', justifyContent: 'center', alignItems: 'center',
    backgroundColor: theme.colors.primary,
    paddingVertical: 14, borderRadius: theme.radius.md,
    ...theme.shadow.sm,
  },
  buttonText: { color: '#fff', fontSize: 15, fontFamily: theme.font.bold, marginRight: 8 },
  hint: { textAlign: 'center', color: theme.colors.textLight, marginTop: 24, fontSize: 11, fontFamily: theme.font.regular },
});
