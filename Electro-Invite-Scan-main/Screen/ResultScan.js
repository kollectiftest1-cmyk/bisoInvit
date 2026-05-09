import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { theme } from '../theme';

const ResultScan = () => {
  const route = useRoute();
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const { invitation, event, ok } = route.params || {};

  if (!invitation) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <Text style={{ color: theme.colors.textMuted, fontFamily: theme.font.regular }}>Aucune donnée</Text>
      </View>
    );
  }

  const Row = ({ icon, label, value }) => value ? (
    <View style={styles.row}>
      <View style={styles.rowIcon}>
        <Ionicons name={icon} size={18} color={theme.colors.primary} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={styles.rowLabel}>{label}</Text>
        <Text style={styles.rowValue}>{value}</Text>
      </View>
    </View>
  ) : null;

  const bannerColor = ok ? theme.colors.success : theme.colors.danger;

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={{ paddingBottom: 110 }}
    >
      <View style={[styles.banner, { backgroundColor: bannerColor, paddingTop: insets.top + 30 }]}>
        <View style={styles.bannerIcon}>
          <Ionicons name={ok ? 'checkmark' : 'close'} size={48} color={bannerColor} />
        </View>
        <Text style={styles.bannerTitle}>{ok ? 'Invité validé' : 'Refusé'}</Text>
        <Text style={styles.bannerSubtitle}>
          {event?.bride_name} & {event?.groom_name}
        </Text>
      </View>

      <View style={styles.card}>
        <Row icon="person-outline" label="Nom" value={invitation.full_name} />
        <Row icon="ribbon-outline" label="Statut" value={invitation.statut} />
        <Row icon="location-outline" label="Emplacement" value={invitation.table_number} />
        <Row icon="people-outline" label="Places" value={String(invitation.seats || 1)} />
        <Row icon="call-outline" label="Téléphone" value={invitation.phone} />
        <Row icon="chatbubble-outline" label="Commentaire" value={invitation.comment} />
        <Row icon="business-outline" label="Lieu" value={event?.venue_name} />
      </View>

      <TouchableOpacity
        style={styles.backBtn}
        onPress={() => navigation.goBack()}
      >
        <Ionicons name="qr-code-outline" size={20} color="#fff" />
        <Text style={styles.backBtnText}>Scanner un autre invité</Text>
      </TouchableOpacity>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.bg },
  banner: {
    paddingBottom: 60, paddingHorizontal: 20, alignItems: 'center',
    borderBottomLeftRadius: 32, borderBottomRightRadius: 32,
  },
  bannerIcon: {
    width: 84, height: 84, borderRadius: 42, backgroundColor: '#fff',
    alignItems: 'center', justifyContent: 'center', marginBottom: 14,
    ...theme.shadow.md,
  },
  bannerTitle: { color: '#fff', fontSize: 24, fontFamily: theme.font.bold },
  bannerSubtitle: { color: '#fff', opacity: 0.9, marginTop: 4, fontFamily: theme.font.regular, fontSize: 14 },

  card: {
    marginHorizontal: 16, marginTop: -32,
    backgroundColor: theme.colors.surface, borderRadius: theme.radius.lg,
    padding: 8,
    ...theme.shadow.md,
  },
  row: {
    flexDirection: 'row', alignItems: 'center',
    paddingVertical: 12, paddingHorizontal: 8,
    borderBottomColor: theme.colors.border, borderBottomWidth: 1,
  },
  rowIcon: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: theme.colors.primarySoft,
    alignItems: 'center', justifyContent: 'center', marginRight: 12,
  },
  rowLabel: { fontSize: 11, color: theme.colors.textMuted, textTransform: 'uppercase', letterSpacing: 0.5, fontFamily: theme.font.regular },
  rowValue: { fontSize: 15, color: theme.colors.text, marginTop: 2, fontFamily: theme.font.bold },

  backBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    marginHorizontal: 16, marginTop: 20,
    backgroundColor: theme.colors.primary,
    paddingVertical: 14, borderRadius: theme.radius.md,
  },
  backBtnText: { color: '#fff', fontFamily: theme.font.bold, fontSize: 15, marginLeft: 8 },
});

export default ResultScan;
