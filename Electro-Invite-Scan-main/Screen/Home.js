import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert,
  ActivityIndicator, RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { api, getUser } from '../lib/api';
import { theme } from '../theme';

const Home = ({ onLogout }) => {
  const insets = useSafeAreaInsets();
  const [user, setUser] = useState(null);
  const [events, setEvents] = useState([]);
  const [statsByEvent, setStatsByEvent] = useState({});
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadStats = useCallback(async (evList) => {
    const out = {};
    await Promise.all(evList.map(async (ev) => {
      try { out[ev.id] = await api.stats(ev.id); } catch { out[ev.id] = null; }
    }));
    setStatsByEvent(out);
  }, []);

  const refresh = useCallback(async () => {
    try {
      const cached = await getUser();
      if (cached) setUser(cached);
      const me = await api.me();
      setUser({ ...me.controller, events: me.events });
      setEvents(me.events || []);
      await loadStats(me.events || []);
    } catch (e) {
      const cached = await getUser();
      if (cached) {
        setUser(cached);
        setEvents(cached.events || []);
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [loadStats]);

  useEffect(() => { refresh(); }, [refresh]);

  const onRefresh = () => { setRefreshing(true); refresh(); };

  const logout = () => {
    Alert.alert('Déconnexion', 'Voulez-vous vous déconnecter ?', [
      { text: 'Annuler', style: 'cancel' },
      { text: 'Oui', style: 'destructive', onPress: async () => { await api.logout(); onLogout && onLogout(); } },
    ]);
  };

  const initials = (user?.name || user?.username || '?')
    .split(/\s+/).map((s) => s[0]).join('').slice(0, 2).toUpperCase();

  if (loading) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={[styles.content, { paddingTop: insets.top + 16, paddingBottom: 100 }]}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.colors.primary} />}
    >
      <View style={styles.header}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{initials}</Text>
        </View>
        <View style={{ flex: 1, marginLeft: 12 }}>
          <Text style={styles.hello}>Bonjour 👋</Text>
          <Text style={styles.name} numberOfLines={1}>{user?.name || user?.username}</Text>
        </View>
        <TouchableOpacity onPress={logout} style={styles.logoutBtn}>
          <Ionicons name="log-out-outline" size={20} color={theme.colors.textMuted} />
        </TouchableOpacity>
      </View>

      <View style={styles.sectionHead}>
        <Ionicons name="calendar-outline" size={18} color={theme.colors.primary} />
        <Text style={styles.sectionTitle}>Mes événements</Text>
        <Text style={styles.sectionCount}>{events.length}</Text>
      </View>

      {events.length === 0 ? (
        <View style={styles.emptyCard}>
          <Ionicons name="information-circle-outline" size={32} color={theme.colors.textLight} />
          <Text style={styles.emptyText}>
            Aucun événement ne vous est affecté.{'\n'}Contactez l'administrateur.
          </Text>
        </View>
      ) : (
        events.map((ev) => {
          const s = statsByEvent[ev.id];
          const total = s?.invitations_total || 0;
          const scanned = s?.invitations_scanned || 0;
          const pct = total > 0 ? Math.round((scanned / total) * 100) : 0;
          return (
            <View key={ev.id} style={styles.eventCard}>
              <View style={styles.eventHead}>
                <View style={styles.eventBadge}>
                  <Ionicons name="heart" size={14} color="#fff" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.eventTitle} numberOfLines={1}>
                    {ev.bride_name} & {ev.groom_name}
                  </Text>
                  {ev.title && <Text style={styles.eventSub}>{ev.title}</Text>}
                </View>
              </View>

              <View style={styles.statsRow}>
                <Stat label="Total" value={total} icon="people-outline" />
                <Stat label="Scannés" value={scanned} icon="checkmark-done-outline" color={theme.colors.success} />
                <Stat label="Présents" value={s?.seats_present ?? 0} icon="enter-outline" color={theme.colors.info} />
              </View>

              <View style={styles.progressTrack}>
                <View style={[styles.progressFill, { width: `${pct}%` }]} />
              </View>
              <Text style={styles.progressLabel}>{pct}% des invitations vérifiées</Text>
            </View>
          );
        })
      )}

      <View style={styles.tipBox}>
        <Ionicons name="qr-code-outline" size={20} color={theme.colors.primary} />
        <Text style={styles.tip}>
          Allez à l'onglet <Text style={{ fontFamily: theme.font.bold }}>Scaner</Text> pour vérifier les invitations.
        </Text>
      </View>
    </ScrollView>
  );
};

function Stat({ label, value, icon, color }) {
  return (
    <View style={styles.stat}>
      <Ionicons name={icon} size={16} color={color || theme.colors.textMuted} />
      <Text style={[styles.statValue, color && { color }]}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.bg },
  content: { padding: 16 },
  header: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: theme.colors.surface,
    padding: 14, borderRadius: theme.radius.lg, marginBottom: 20,
    ...theme.shadow.sm,
  },
  avatar: {
    width: 48, height: 48, borderRadius: 24,
    backgroundColor: theme.colors.primary,
    alignItems: 'center', justifyContent: 'center',
  },
  avatarText: { color: '#fff', fontFamily: theme.font.bold, fontSize: 16 },
  hello: { color: theme.colors.textMuted, fontSize: 12, fontFamily: theme.font.regular },
  name: { fontSize: 18, color: theme.colors.text, fontFamily: theme.font.bold },
  logoutBtn: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: theme.colors.bg,
    alignItems: 'center', justifyContent: 'center',
  },

  sectionHead: { flexDirection: 'row', alignItems: 'center', marginBottom: 10, paddingHorizontal: 4 },
  sectionTitle: { flex: 1, marginLeft: 6, fontSize: 14, color: theme.colors.text, fontFamily: theme.font.bold },
  sectionCount: {
    backgroundColor: theme.colors.primarySoft, color: theme.colors.primaryDark,
    paddingHorizontal: 8, paddingVertical: 2, borderRadius: theme.radius.pill,
    fontSize: 12, fontFamily: theme.font.bold, overflow: 'hidden',
  },

  emptyCard: {
    backgroundColor: theme.colors.surface, borderRadius: theme.radius.lg,
    padding: 24, alignItems: 'center', ...theme.shadow.sm,
  },
  emptyText: {
    marginTop: 8, color: theme.colors.textMuted, textAlign: 'center',
    fontSize: 13, fontFamily: theme.font.regular, lineHeight: 20,
  },

  eventCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.lg, padding: 16, marginBottom: 12,
    ...theme.shadow.sm,
  },
  eventHead: { flexDirection: 'row', alignItems: 'center', marginBottom: 14 },
  eventBadge: {
    width: 32, height: 32, borderRadius: 16,
    backgroundColor: theme.colors.primary,
    alignItems: 'center', justifyContent: 'center', marginRight: 10,
  },
  eventTitle: { fontSize: 15, color: theme.colors.text, fontFamily: theme.font.bold },
  eventSub: { fontSize: 12, color: theme.colors.textMuted, fontFamily: theme.font.regular },

  statsRow: {
    flexDirection: 'row', backgroundColor: theme.colors.bg,
    borderRadius: theme.radius.md, padding: 10, marginBottom: 10,
  },
  stat: { flex: 1, alignItems: 'center' },
  statValue: { fontSize: 18, color: theme.colors.text, fontFamily: theme.font.bold, marginTop: 2 },
  statLabel: { fontSize: 10, color: theme.colors.textMuted, fontFamily: theme.font.regular, textTransform: 'uppercase', letterSpacing: 0.5 },

  progressTrack: { height: 6, backgroundColor: theme.colors.bg, borderRadius: 3, overflow: 'hidden' },
  progressFill: { height: '100%', backgroundColor: theme.colors.primary, borderRadius: 3 },
  progressLabel: { fontSize: 11, color: theme.colors.textMuted, marginTop: 6, fontFamily: theme.font.regular },

  tipBox: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: theme.colors.primarySoft,
    padding: 12, borderRadius: theme.radius.md, marginTop: 8,
  },
  tip: { flex: 1, marginLeft: 10, fontSize: 12, color: theme.colors.primaryDark, fontFamily: theme.font.regular, lineHeight: 18 },
});

export default Home;
