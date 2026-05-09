import React, { useEffect, useState, useCallback, useMemo } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  ActivityIndicator, RefreshControl, TextInput,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { api, getUser } from '../lib/api';
import { theme } from '../theme';

function formatDate(iso) {
  if (!iso) return '';
  const d = new Date(iso.includes('T') ? iso : iso.replace(' ', 'T') + 'Z');
  if (isNaN(d)) return iso;
  return d.toLocaleString('fr-FR', { dateStyle: 'short', timeStyle: 'short' });
}

const STATUT_COLORS = {
  Mr: theme.colors.info,
  Mme: theme.colors.primary,
  Mlle: '#9333EA',
  Couple: '#0891B2',
  Famille: theme.colors.accent,
};

export default function VoirInvitations() {
  const insets = useSafeAreaInsets();
  const [events, setEvents] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [stats, setStats] = useState(null);
  const [history, setHistory] = useState([]);
  const [loadingEvents, setLoadingEvents] = useState(true);
  const [loadingData, setLoadingData] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');

  const loadEvents = useCallback(async () => {
    try {
      const me = await api.me();
      setEvents(me.events || []);
      if ((me.events || []).length > 0 && !selectedId) {
        setSelectedId(me.events[0].id);
      }
    } catch {
      const u = await getUser();
      setEvents(u?.events || []);
      if ((u?.events || []).length > 0 && !selectedId) {
        setSelectedId(u.events[0].id);
      }
    } finally {
      setLoadingEvents(false);
    }
  }, [selectedId]);

  const loadData = useCallback(async (eventId) => {
    if (!eventId) return;
    setLoadingData(true);
    try {
      const [s, h] = await Promise.all([
        api.stats(eventId).catch(() => null),
        api.history(eventId).catch(() => []),
      ]);
      setStats(s);
      setHistory(h);
    } finally {
      setLoadingData(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { loadEvents(); }, [loadEvents]);
  useEffect(() => { if (selectedId) loadData(selectedId); }, [selectedId, loadData]);

  const onRefresh = () => { setRefreshing(true); loadData(selectedId); };

  const filtered = useMemo(() => {
    if (!search.trim()) return history;
    const q = search.toLowerCase();
    return history.filter((h) =>
      (h.full_name || '').toLowerCase().includes(q) ||
      (h.statut || '').toLowerCase().includes(q) ||
      (h.code || '').toLowerCase().includes(q)
    );
  }, [history, search]);

  const total = stats?.invitations_total || 0;
  const scanned = stats?.invitations_scanned || 0;
  const pct = total > 0 ? Math.round((scanned / total) * 100) : 0;

  if (loadingEvents) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  if (events.length === 0) {
    return (
      <View style={[styles.container, { paddingTop: insets.top + 40, paddingHorizontal: 24, alignItems: 'center' }]}>
        <Ionicons name="calendar-outline" size={48} color={theme.colors.textLight} />
        <Text style={styles.emptyText}>Aucun événement affecté</Text>
      </View>
    );
  }

  const renderItem = ({ item }) => (
    <View style={styles.row}>
      <View style={[styles.statutDot, { backgroundColor: STATUT_COLORS[item.statut] || theme.colors.textMuted }]}>
        <Text style={styles.statutDotText}>{(item.statut || '?').slice(0, 2)}</Text>
      </View>
      <View style={{ flex: 1 }}>
        <Text style={styles.rowName} numberOfLines={1}>{item.full_name || '—'}</Text>
        <Text style={styles.rowMeta}>
          {item.statut} · {item.seats || 1} pers · {formatDate(item.scanned_at)}
        </Text>
      </View>
      <Ionicons name="checkmark-circle" size={22} color={theme.colors.success} />
    </View>
  );

  return (
    <View style={[styles.container, { paddingTop: insets.top + 12 }]}>
      <View style={styles.titleBar}>
        <Text style={styles.pageTitle}>Historique</Text>
      </View>

      {/* Event picker chips */}
      <FlatList
        horizontal
        data={events}
        keyExtractor={(e) => e.id}
        style={styles.chipList}
        contentContainerStyle={styles.chipListContent}
        showsHorizontalScrollIndicator={false}
        renderItem={({ item }) => {
          const active = item.id === selectedId;
          return (
            <TouchableOpacity
              onPress={() => setSelectedId(item.id)}
              style={[styles.chip, active && styles.chipActive]}
            >
              <Ionicons
                name="heart"
                size={12}
                color={active ? '#fff' : theme.colors.primary}
                style={{ marginRight: 6 }}
              />
              <Text style={[styles.chipText, active && styles.chipTextActive]} numberOfLines={1}>
                {item.bride_name} & {item.groom_name}
              </Text>
            </TouchableOpacity>
          );
        }}
      />

      {/* Stats card */}
      <View style={styles.statsCard}>
        <View style={styles.statsTop}>
          <StatBlock label="Invitations" value={total} icon="people-outline" />
          <View style={styles.statsDivider} />
          <StatBlock label="Scannées" value={scanned} icon="checkmark-done-outline" color={theme.colors.success} />
          <View style={styles.statsDivider} />
          <StatBlock label="Personnes" value={stats?.seats_present ?? 0} icon="enter-outline" color={theme.colors.info} />
        </View>
        <View style={styles.progressTrack}>
          <View style={[styles.progressFill, { width: `${pct}%` }]} />
        </View>
        <Text style={styles.progressLabel}>{pct}% des invitations vérifiées</Text>
      </View>

      {/* Search */}
      <View style={styles.searchBox}>
        <Ionicons name="search" size={16} color={theme.colors.textMuted} />
        <TextInput
          style={styles.searchInput}
          placeholder="Rechercher un invité..."
          placeholderTextColor={theme.colors.textLight}
          value={search}
          onChangeText={setSearch}
        />
        {search ? (
          <TouchableOpacity onPress={() => setSearch('')}>
            <Ionicons name="close-circle" size={18} color={theme.colors.textMuted} />
          </TouchableOpacity>
        ) : null}
      </View>

      {/* List */}
      {loadingData && history.length === 0 ? (
        <ActivityIndicator color={theme.colors.primary} style={{ marginTop: 30 }} />
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(item, i) => `${item.id}-${i}`}
          renderItem={renderItem}
          contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 110 }}
          ItemSeparatorComponent={() => <View style={{ height: 8 }} />}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.colors.primary} />}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Ionicons name="receipt-outline" size={36} color={theme.colors.textLight} />
              <Text style={styles.emptyText}>
                {search ? 'Aucun résultat' : 'Aucun scan pour cet événement'}
              </Text>
            </View>
          }
        />
      )}
    </View>
  );
}

function StatBlock({ label, value, icon, color }) {
  return (
    <View style={styles.statBlock}>
      <Ionicons name={icon} size={18} color={color || theme.colors.textMuted} />
      <Text style={[styles.statBlockValue, color && { color }]}>{value}</Text>
      <Text style={styles.statBlockLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.bg },
  titleBar: { paddingHorizontal: 20, paddingVertical: 8 },
  pageTitle: { fontSize: 22, fontFamily: theme.font.bold, color: theme.colors.text },

  chipList: { flexGrow: 0, marginBottom: 10 },
  chipListContent: { paddingHorizontal: 16, alignItems: 'center' },
  chip: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 12, paddingVertical: 6,
    backgroundColor: theme.colors.surface, borderRadius: theme.radius.pill,
    marginRight: 8, borderWidth: 1, borderColor: theme.colors.border,
  },
  chipActive: { backgroundColor: theme.colors.primary, borderColor: theme.colors.primary },
  chipText: { fontFamily: theme.font.bold, fontSize: 12, color: theme.colors.text, maxWidth: 200 },
  chipTextActive: { color: '#fff' },

  statsCard: {
    backgroundColor: theme.colors.surface,
    marginHorizontal: 16, marginBottom: 12,
    padding: 16, borderRadius: theme.radius.lg,
    ...theme.shadow.sm,
  },
  statsTop: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  statsDivider: { width: 1, height: 40, backgroundColor: theme.colors.border },
  statBlock: { flex: 1, alignItems: 'center' },
  statBlockValue: { fontSize: 22, fontFamily: theme.font.bold, color: theme.colors.text, marginTop: 4 },
  statBlockLabel: { fontSize: 10, color: theme.colors.textMuted, fontFamily: theme.font.regular, textTransform: 'uppercase', letterSpacing: 0.5 },

  progressTrack: { height: 8, backgroundColor: theme.colors.bg, borderRadius: 4, overflow: 'hidden' },
  progressFill: { height: '100%', backgroundColor: theme.colors.primary, borderRadius: 4 },
  progressLabel: { fontSize: 11, color: theme.colors.textMuted, marginTop: 6, fontFamily: theme.font.regular, textAlign: 'right' },

  searchBox: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: theme.colors.surface,
    marginHorizontal: 16, marginBottom: 10,
    paddingHorizontal: 12, paddingVertical: 8,
    borderRadius: theme.radius.md,
    borderWidth: 1, borderColor: theme.colors.border,
  },
  searchInput: {
    flex: 1, marginLeft: 8, fontSize: 14,
    color: theme.colors.text, fontFamily: theme.font.regular,
    paddingVertical: 0,
  },

  row: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: theme.colors.surface,
    padding: 12, borderRadius: theme.radius.md,
    ...theme.shadow.sm,
  },
  statutDot: {
    width: 36, height: 36, borderRadius: 18,
    alignItems: 'center', justifyContent: 'center', marginRight: 12,
  },
  statutDotText: { color: '#fff', fontFamily: theme.font.bold, fontSize: 11 },
  rowName: { fontSize: 14, color: theme.colors.text, fontFamily: theme.font.bold },
  rowMeta: { fontSize: 11, color: theme.colors.textMuted, fontFamily: theme.font.regular, marginTop: 2 },

  empty: { alignItems: 'center', justifyContent: 'center', paddingVertical: 40 },
  emptyText: { marginTop: 12, fontSize: 13, color: theme.colors.textMuted, fontFamily: theme.font.regular, textAlign: 'center' },
});
