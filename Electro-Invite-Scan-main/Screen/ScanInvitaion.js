import AsyncStorage from '@react-native-async-storage/async-storage';
import { CameraView, useCameraPermissions } from 'expo-camera';
import React, { useCallback, useRef, useState } from 'react';
import {
  StyleSheet, Text, TouchableOpacity, View, ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { theme } from '../theme';
import { api } from '../lib/api';

export default function ScanInvitaion() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const [facing, setFacing] = useState('back');
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);
  const [loading, setLoading] = useState(false);
  // isFocused contrôle le montage/démontage de la caméra :
  // - Évite l'écran noir lors du retour sur l'onglet
  // - Libère le hardware caméra quand on quitte la page
  const [isFocused, setIsFocused] = useState(false);
  const lockRef = useRef(false);

  useFocusEffect(
    useCallback(() => {
      setIsFocused(true);
      setScanned(false);
      lockRef.current = false;
      return () => {
        setIsFocused(false);
      };
    }, [])
  );

  const handleScan = async (raw) => {
    if (lockRef.current) return;
    lockRef.current = true;
    setScanned(true);
    setLoading(true);

    let payload;
    try {
      payload = JSON.parse(raw);
    } catch {
      setLoading(false);
      return showTransientError('QR invalide', 'Format non reconnu');
    }

    try {
      const res = await api.scan(payload, 'mobile');
      try {
        await AsyncStorage.setItem(`scan:${res.invitation.id}`, JSON.stringify({
          ...res.invitation,
          event: res.event,
          scanned_at: new Date().toISOString(),
        }));
      } catch { /* non bloquant */ }
      // Démonte la caméra avant la navigation pour libérer le hardware
      setIsFocused(false);
      navigation.navigate('ResultScan', { invitation: res.invitation, event: res.event, ok: true });
    } catch (err) {
      const msg =
        err.status === 409 ? 'Cette invitation a déjà été utilisée'
        : err.status === 400 ? (err.message || 'Signature incorrecte')
        : err.status === 404 ? "Ce code n'existe pas"
        : (err.message || 'Erreur réseau');
      const title =
        err.status === 409 ? 'Déjà scanné'
        : err.status === 400 ? 'QR invalide'
        : err.status === 404 ? 'Invitation introuvable'
        : 'Erreur';
      showTransientError(title, msg);
    } finally {
      setLoading(false);
    }
  };

  const showTransientError = (title, message) => {
    setErr({ title, message });
    setTimeout(() => {
      setErr(null);
      setScanned(false);
      lockRef.current = false;
    }, 2200);
  };
  const [err, setErr] = useState(null);

  if (!permission) return <View style={styles.container} />;

  if (!permission.granted) {
    return (
      <View style={[styles.container, { paddingTop: insets.top + 40 }]}>
        <View style={styles.permCard}>
          <Ionicons name="camera-outline" size={48} color={theme.colors.primary} />
          <Text style={styles.permTitle}>Accès à la caméra</Text>
          <Text style={styles.permText}>
            Nous avons besoin de votre permission pour scanner les QR codes des invitations.
          </Text>
          <TouchableOpacity style={styles.permBtn} onPress={requestPermission}>
            <Text style={styles.permBtnText}>Autoriser</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  const toggle = () => setFacing((c) => (c === 'back' ? 'front' : 'back'));

  return (
    <View style={[styles.container, { paddingTop: insets.top + 8 }]}>
      <View style={styles.header}>
        <Text style={styles.title}>Scanner le QR Code</Text>
        <Text style={styles.subtitle}>Vérification sécurisée en ligne</Text>
      </View>

      <View style={styles.cameraWrap}>
        {isFocused ? (
          <CameraView
            style={StyleSheet.absoluteFill}
            facing={facing}
            barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
            onBarcodeScanned={scanned ? undefined : ({ data }) => data && handleScan(data)}
          />
        ) : (
          <View style={[StyleSheet.absoluteFill, styles.cameraPlaceholder]}>
            <ActivityIndicator color="#fff" />
          </View>
        )}

        {/* Overlay frame */}
        <View pointerEvents="none" style={styles.overlay}>
          <View style={styles.frame}>
            <View style={[styles.corner, styles.cornerTL]} />
            <View style={[styles.corner, styles.cornerTR]} />
            <View style={[styles.corner, styles.cornerBL]} />
            <View style={[styles.corner, styles.cornerBR]} />
          </View>
        </View>

        {loading && (
          <View style={styles.loadingOverlay}>
            <ActivityIndicator color="#fff" size="large" />
            <Text style={styles.loadingText}>Vérification…</Text>
          </View>
        )}

        {err && (
          <View style={styles.errorBanner}>
            <Ionicons name="alert-circle" size={20} color="#fff" />
            <View style={{ flex: 1, marginLeft: 8 }}>
              <Text style={styles.errorTitle}>{err.title}</Text>
              <Text style={styles.errorMsg}>{err.message}</Text>
            </View>
          </View>
        )}
      </View>

      <View style={styles.footer}>
        <Text style={styles.hint}>Centrez le QR code dans le cadre</Text>
        <TouchableOpacity style={styles.flipBtn} onPress={toggle}>
          <Ionicons name="camera-reverse-outline" size={26} color={theme.colors.primary} />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const FRAME = 260;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.bg },
  header: { paddingHorizontal: 20, paddingBottom: 12 },
  title: { fontSize: 22, fontFamily: theme.font.bold, color: theme.colors.text },
  subtitle: { fontSize: 13, color: theme.colors.textMuted, marginTop: 2, fontFamily: theme.font.regular },

  cameraWrap: {
    marginHorizontal: 16,
    aspectRatio: 1,
    borderRadius: 24,
    overflow: 'hidden',
    backgroundColor: '#000',
    ...theme.shadow.md,
  },
  cameraPlaceholder: { backgroundColor: '#000', alignItems: 'center', justifyContent: 'center' },

  overlay: { ...StyleSheet.absoluteFillObject, alignItems: 'center', justifyContent: 'center' },
  frame: {
    width: FRAME, height: FRAME,
    borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.35)',
    borderRadius: 16,
  },
  corner: {
    position: 'absolute', width: 32, height: 32,
    borderColor: theme.colors.primary,
  },
  cornerTL: { top: -2, left: -2, borderTopWidth: 4, borderLeftWidth: 4, borderTopLeftRadius: 16 },
  cornerTR: { top: -2, right: -2, borderTopWidth: 4, borderRightWidth: 4, borderTopRightRadius: 16 },
  cornerBL: { bottom: -2, left: -2, borderBottomWidth: 4, borderLeftWidth: 4, borderBottomLeftRadius: 16 },
  cornerBR: { bottom: -2, right: -2, borderBottomWidth: 4, borderRightWidth: 4, borderBottomRightRadius: 16 },

  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems: 'center', justifyContent: 'center',
  },
  loadingText: { color: '#fff', marginTop: 10, fontFamily: theme.font.bold },

  errorBanner: {
    position: 'absolute', left: 12, right: 12, top: 12,
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: 'rgba(220,38,38,0.95)',
    padding: 12, borderRadius: 12,
  },
  errorTitle: { color: '#fff', fontFamily: theme.font.bold, fontSize: 13 },
  errorMsg: { color: '#fff', fontSize: 12, marginTop: 1, fontFamily: theme.font.regular },

  footer: {
    paddingHorizontal: 24, paddingTop: 18,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
  },
  hint: { color: theme.colors.textMuted, fontSize: 13, fontFamily: theme.font.regular, flex: 1 },
  flipBtn: {
    width: 52, height: 52, borderRadius: 26,
    backgroundColor: theme.colors.primarySoft,
    alignItems: 'center', justifyContent: 'center',
    ...theme.shadow.sm,
  },

  permCard: {
    margin: 24, padding: 24, borderRadius: theme.radius.lg,
    backgroundColor: theme.colors.surface, alignItems: 'center',
    ...theme.shadow.md,
  },
  permTitle: { fontSize: 18, fontFamily: theme.font.bold, color: theme.colors.text, marginTop: 12 },
  permText: { textAlign: 'center', color: theme.colors.textMuted, marginTop: 8, fontFamily: theme.font.regular, fontSize: 13 },
  permBtn: {
    marginTop: 16, backgroundColor: theme.colors.primary,
    paddingHorizontal: 24, paddingVertical: 12, borderRadius: theme.radius.md,
  },
  permBtnText: { color: '#fff', fontFamily: theme.font.bold },
});
