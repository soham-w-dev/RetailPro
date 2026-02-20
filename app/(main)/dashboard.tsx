import React, { useEffect, useRef, useState } from 'react';
import {
  View, Text, ScrollView, StyleSheet, Pressable, Platform,
  Animated, RefreshControl, Dimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons, MaterialCommunityIcons, Feather } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';
import { useTheme } from '@/lib/theme-context';
import { useAuth } from '@/lib/auth-context';
import { router } from 'expo-router';
import type { DashboardStats, ActivityLog } from '@/lib/types';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

function NumberTicker({ value, prefix = '', suffix = '' }: { value: number; prefix?: string; suffix?: string }) {
  const [display, setDisplay] = useState(0);
  const animRef = useRef<any>(null);

  useEffect(() => {
    let start = 0;
    const duration = 1200;
    const startTime = Date.now();
    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplay(Math.round(value * eased));
      if (progress < 1) animRef.current = requestAnimationFrame(animate);
    };
    animRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animRef.current);
  }, [value]);

  const formatted = display >= 1000 ? (display / 1000).toFixed(1) + 'K' : String(display);
  return <Text>{prefix}{formatted}{suffix}</Text>;
}

function LiveDot({ color }: { color: string }) {
  const anim = useRef(new Animated.Value(1)).current;
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(anim, { toValue: 0.3, duration: 1000, useNativeDriver: true }),
        Animated.timing(anim, { toValue: 1, duration: 1000, useNativeDriver: true }),
      ])
    ).start();
  }, []);
  return <Animated.View style={[styles.liveDot, { backgroundColor: color, opacity: anim }]} />;
}

export default function DashboardScreen() {
  const { colors, isDark, toggleTheme } = useTheme();
  const { user, logout } = useAuth();
  const insets = useSafeAreaInsets();

  const statsQuery = useQuery<DashboardStats>({ queryKey: ['/api/dashboard/stats'] });
  const logsQuery = useQuery<ActivityLog[]>({ queryKey: ['/api/activity-logs'] });

  const stats = statsQuery.data;
  const logs = logsQuery.data;

  const onRefresh = () => {
    statsQuery.refetch();
    logsQuery.refetch();
  };

  const getExpiryColor = (days: number) => {
    if (days <= 7) return colors.danger;
    if (days <= 30) return colors.warning;
    return colors.success;
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'ADMIN': return colors.admin;
      case 'CASHIER': return colors.cashier;
      case 'STOCK_CLERK': return colors.stockClerk;
      default: return colors.textMuted;
    }
  };

  const formatTime = (ts: string) => {
    const d = new Date(ts);
    return d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView
        contentContainerStyle={{ paddingTop: insets.top + (Platform.OS === 'web' ? 67 : 8), paddingBottom: 100 + (Platform.OS === 'web' ? 34 : 0) }}
        refreshControl={<RefreshControl refreshing={!!statsQuery.isRefetching} onRefresh={onRefresh} tintColor={colors.tint} />}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.topBar}>
          <View>
            <Text style={[styles.greeting, { color: colors.text, fontFamily: 'Inter_700Bold' }]}>Admin Dashboard</Text>
            <Text style={[styles.welcomeText, { color: colors.textSecondary, fontFamily: 'Inter_400Regular' }]}>Welcome back, {user?.name || 'Admin'}</Text>
          </View>
          <View style={styles.topActions}>
            <Pressable onPress={toggleTheme} style={[styles.iconBtn, { backgroundColor: colors.card }]}>
              <Ionicons name={isDark ? "sunny-outline" : "moon-outline"} size={20} color={colors.text} />
            </Pressable>
            <Pressable onPress={() => { logout(); router.replace('/'); }} style={[styles.iconBtn, { backgroundColor: colors.danger + '20' }]}>
              <Ionicons name="log-out-outline" size={20} color={colors.danger} />
            </Pressable>
          </View>
        </View>

        {stats && (
          <>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.statsRow}>
              <View style={[styles.statCard, { backgroundColor: '#2563eb' }]}>
                <View style={[styles.statIcon, { backgroundColor: 'rgba(255,255,255,0.2)' }]}>
                  <MaterialCommunityIcons name="currency-inr" size={20} color="#fff" />
                </View>
                <Text style={[styles.statValue, { fontFamily: 'Inter_700Bold' }]}>
                  <NumberTicker value={Math.round(stats.totalRevenue)} prefix="Rs. " />
                </Text>
                <Text style={[styles.statLabel, { fontFamily: 'Inter_400Regular' }]}>Total Revenue</Text>
              </View>
              <View style={[styles.statCard, { backgroundColor: '#16a34a' }]}>
                <View style={[styles.statIcon, { backgroundColor: 'rgba(255,255,255,0.2)' }]}>
                  <Ionicons name="trending-up" size={20} color="#fff" />
                </View>
                <Text style={[styles.statValue, { fontFamily: 'Inter_700Bold' }]}>
                  <NumberTicker value={Math.round(stats.netProfit)} prefix="Rs. " />
                </Text>
                <Text style={[styles.statLabel, { fontFamily: 'Inter_400Regular' }]}>Net Profit</Text>
              </View>
              <View style={[styles.statCard, { backgroundColor: '#f59e0b' }]}>
                <View style={[styles.statIcon, { backgroundColor: 'rgba(255,255,255,0.2)' }]}>
                  <Ionicons name="receipt-outline" size={20} color="#fff" />
                </View>
                <Text style={[styles.statValue, { fontFamily: 'Inter_700Bold' }]}>
                  <NumberTicker value={stats.totalTransactions} />
                </Text>
                <Text style={[styles.statLabel, { fontFamily: 'Inter_400Regular' }]}>Transactions</Text>
              </View>
              <View style={[styles.statCard, { backgroundColor: '#8b5cf6' }]}>
                <View style={[styles.statIcon, { backgroundColor: 'rgba(255,255,255,0.2)' }]}>
                  <Ionicons name="people-outline" size={20} color="#fff" />
                </View>
                <Text style={[styles.statValue, { fontFamily: 'Inter_700Bold' }]}>
                  <NumberTicker value={stats.activeEmployees} />
                </Text>
                <Text style={[styles.statLabel, { fontFamily: 'Inter_400Regular' }]}>Active Staff</Text>
              </View>
            </ScrollView>

            <View style={[styles.sectionCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <View style={styles.sectionHeader}>
                <Text style={[styles.sectionTitle, { color: colors.text, fontFamily: 'Inter_600SemiBold' }]}>Revenue Trend (7 Days)</Text>
              </View>
              <View style={styles.chartContainer}>
                {stats.last7Days.map((d, i) => {
                  const maxRev = Math.max(...stats.last7Days.map(x => x.revenue), 1);
                  const h = (d.revenue / maxRev) * 100;
                  const day = new Date(d.date).toLocaleDateString('en-IN', { weekday: 'short' });
                  return (
                    <View key={i} style={styles.barCol}>
                      <Text style={[styles.barValue, { color: colors.textMuted, fontFamily: 'Inter_500Medium' }]}>
                        {d.revenue >= 1000 ? (d.revenue / 1000).toFixed(1) + 'K' : d.revenue}
                      </Text>
                      <View style={[styles.bar, { height: Math.max(h, 4), backgroundColor: colors.tint }]} />
                      <Text style={[styles.barLabel, { color: colors.textMuted, fontFamily: 'Inter_400Regular' }]}>{day}</Text>
                    </View>
                  );
                })}
              </View>
            </View>

            <View style={[styles.sectionCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <View style={styles.sectionHeader}>
                <Text style={[styles.sectionTitle, { color: colors.text, fontFamily: 'Inter_600SemiBold' }]}>Sales by Category</Text>
              </View>
              {/* Added flexible wrapping container for safer layout */}
              <View style={styles.categoryGrid}>
                {Object.entries(stats.categoryRevenue).sort((a, b) => b[1] - a[1]).slice(0, 6).map(([cat, rev], i) => {
                  const catColors = ['#2563eb', '#16a34a', '#f59e0b', '#ec4899', '#8b5cf6', '#06b6d4'];
                  const total = Object.values(stats.categoryRevenue).reduce((s, v) => s + v, 0);
                  const pct = total > 0 ? ((rev / total) * 100).toFixed(0) : '0';
                  return (
                    <View key={cat} style={styles.categoryRow}>
                      <View style={[styles.categoryDot, { backgroundColor: catColors[i % catColors.length] }]} />
                      <View style={{ flex: 1, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Text style={[styles.categoryName, { color: colors.text, fontFamily: 'Inter_500Medium', flex: 1 }]}>{cat}</Text>
                        <Text style={[styles.categoryValue, { color: colors.textMuted, fontFamily: 'Inter_400Regular' }]}>Rs.{Math.round(rev)} ({pct}%)</Text>
                      </View>
                    </View>
                  );
                })}
              </View>
            </View>

            <View style={[styles.sectionCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <View style={styles.sectionHeader}>
                <Text style={[styles.sectionTitle, { color: colors.text, fontFamily: 'Inter_600SemiBold' }]}>Payment Methods</Text>
              </View>
              <View style={styles.paymentRow}>
                {Object.entries(stats.paymentMethods).map(([method, data]) => {
                  const pmColors: Record<string, string> = { Cash: '#16a34a', Card: '#2563eb', UPI: '#8b5cf6' };
                  // Cap bar height so count label + bar + label all fit in the container
                  const barHeight = Math.min(Math.max(data.count * 6, 16), 70);
                  return (
                    <View key={method} style={styles.paymentItem}>
                      <Text style={[styles.paymentCount, { color: pmColors[method] || colors.tint, fontFamily: 'Inter_700Bold' }]}>{data.count}</Text>
                      <View style={[styles.paymentBar, { backgroundColor: pmColors[method] || colors.tint, height: barHeight }]} />
                      <Text style={[styles.paymentLabel, { color: colors.textMuted, fontFamily: 'Inter_500Medium' }]}>{method}</Text>
                    </View>
                  );
                })}
              </View>
            </View>

            {stats.lowStockProducts.length > 0 && (
              <View style={[styles.sectionCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <View style={styles.sectionHeader}>
                  <Ionicons name="warning" size={18} color={colors.warning} />
                  <Text style={[styles.sectionTitle, { color: colors.text, fontFamily: 'Inter_600SemiBold' }]}>Low Stock Alerts</Text>
                  <View style={[styles.countBadge, { backgroundColor: colors.danger + '20' }]}>
                    <Text style={[styles.countBadgeText, { color: colors.danger, fontFamily: 'Inter_600SemiBold' }]}>{stats.lowStockCount}</Text>
                  </View>
                </View>
                {stats.lowStockProducts.map(p => (
                  <View key={p.id} style={[styles.alertRow, { borderColor: colors.border }]}>
                    <View style={[styles.alertIcon, { backgroundColor: colors.danger + '15' }]}>
                      <MaterialCommunityIcons name="package-variant" size={18} color={colors.danger} />
                    </View>
                    <Text style={[styles.alertName, { color: colors.text, fontFamily: 'Inter_500Medium' }]} numberOfLines={1}>{p.name}</Text>
                    <View style={[styles.stockBadge, { backgroundColor: colors.danger + '15' }]}>
                      <Text style={[styles.stockBadgeText, { color: colors.danger, fontFamily: 'Inter_600SemiBold' }]}>{p.stock}</Text>
                    </View>
                  </View>
                ))}
              </View>
            )}

            {stats.expiringProducts.length > 0 && (
              <View style={[styles.sectionCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <View style={styles.sectionHeader}>
                  <Ionicons name="time-outline" size={18} color={colors.warning} />
                  <Text style={[styles.sectionTitle, { color: colors.text, fontFamily: 'Inter_600SemiBold' }]}>Expiring Soon</Text>
                  <View style={[styles.countBadge, { backgroundColor: colors.warning + '20' }]}>
                    <Text style={[styles.countBadgeText, { color: colors.warning, fontFamily: 'Inter_600SemiBold' }]}>{stats.expiringCount}</Text>
                  </View>
                </View>
                {stats.expiringProducts.map(p => (
                  <View key={p.id} style={[styles.alertRow, { borderColor: colors.border }]}>
                    <View style={[styles.alertIcon, { backgroundColor: getExpiryColor(p.daysLeft) + '15' }]}>
                      <Ionicons name="time" size={18} color={getExpiryColor(p.daysLeft)} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.alertName, { color: colors.text, fontFamily: 'Inter_500Medium' }]} numberOfLines={1}>{p.name}</Text>
                      <Text style={[styles.alertSub, { color: colors.textMuted, fontFamily: 'Inter_400Regular' }]}>Expires: {new Date(p.expiryDate).toLocaleDateString('en-IN')}</Text>
                    </View>
                    <Text style={[styles.daysLeft, { color: getExpiryColor(p.daysLeft), fontFamily: 'Inter_600SemiBold' }]}>{p.daysLeft}d</Text>
                  </View>
                ))}
                {stats.expiringProducts.length > 0 && (
                  <View style={[styles.potentialLossCard, { backgroundColor: colors.danger + '10', borderColor: colors.danger + '30' }]}>
                    <Ionicons name="alert-circle" size={16} color={colors.danger} />
                    <Text style={[styles.potentialLossText, { color: colors.danger, fontFamily: 'Inter_500Medium' }]}>
                      Potential Loss: Rs.{stats.expiringProducts.reduce((s, p) => s + p.potentialLoss, 0).toLocaleString()}
                    </Text>
                  </View>
                )}
              </View>
            )}
          </>
        )}

        {logs && logs.length > 0 && (
          <View style={[styles.sectionCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={styles.sectionHeader}>
              <LiveDot color={colors.success} />
              <Text style={[styles.sectionTitle, { color: colors.text, fontFamily: 'Inter_600SemiBold' }]}>Activity Feed</Text>
            </View>
            {logs.slice(0, 8).map((log, i) => (
              <View key={log.id} style={[styles.logRow, i < 7 && { borderBottomWidth: 1, borderBottomColor: colors.border + '50' }]}>
                <Text style={[styles.logTime, { color: colors.textMuted, fontFamily: 'Inter_400Regular' }]}>{formatTime(log.timestamp)}</Text>
                <View style={[styles.rolePill, { backgroundColor: getRoleBadgeColor(log.userRole) + '20' }]}>
                  <Text style={[styles.rolePillText, { color: getRoleBadgeColor(log.userRole), fontFamily: 'Inter_600SemiBold' }]}>{log.userRole.replace('_', ' ')}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.logUser, { color: colors.text, fontFamily: 'Inter_500Medium' }]}>{log.userName}</Text>
                  <Text style={[styles.logAction, { color: colors.textMuted, fontFamily: 'Inter_400Regular' }]} numberOfLines={1}>{log.action}</Text>
                </View>
              </View>
            ))}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  topBar: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, marginBottom: 16, paddingTop: 8 },
  greeting: { fontSize: 22 },
  welcomeText: { fontSize: 13, marginTop: 2 },
  topActions: { flexDirection: 'row', gap: 8 },
  iconBtn: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  statsRow: { paddingHorizontal: 20, gap: 12, marginBottom: 16 },
  statCard: { width: Math.min(150, SCREEN_WIDTH * 0.38), borderRadius: 16, padding: 14 },
  statIcon: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  statValue: { fontSize: 18, color: '#fff' },
  statLabel: { fontSize: 11, color: 'rgba(255,255,255,0.8)', marginTop: 4 },
  sectionCard: { marginHorizontal: 16, borderRadius: 16, padding: 14, marginBottom: 16, borderWidth: 1, overflow: 'hidden' },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 16 },
  sectionTitle: { fontSize: 15, flex: 1 },
  chartContainer: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', height: 130, paddingTop: 16 },
  barCol: { alignItems: 'center', flex: 1 },
  barValue: { fontSize: 9, marginBottom: 4 },
  bar: { width: Math.min(28, SCREEN_WIDTH * 0.06), borderRadius: 6, minHeight: 4 },
  barLabel: { fontSize: 10, marginTop: 6 },
  categoryGrid: { gap: 10 },
  categoryRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  categoryItem: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  categoryDot: { width: 10, height: 10, borderRadius: 5 },
  categoryName: { fontSize: 13, flex: 1 },
  categoryValue: { fontSize: 12, flexShrink: 1 },
  paymentRow: { flexDirection: 'row', justifyContent: 'space-around', alignItems: 'flex-end', minHeight: 120, paddingVertical: 8 },
  paymentItem: { alignItems: 'center', gap: 6, flex: 1 },
  paymentCount: { fontSize: 15 },
  paymentBar: { width: Math.min(44, SCREEN_WIDTH * 0.1), borderRadius: 8 },
  paymentLabel: { fontSize: 12 },
  alertRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 10, borderBottomWidth: 0.5 },
  alertIcon: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  alertName: { fontSize: 14, flex: 1 },
  alertSub: { fontSize: 11, marginTop: 2 },
  stockBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  stockBadgeText: { fontSize: 13 },
  daysLeft: { fontSize: 14 },
  countBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 10 },
  countBadgeText: { fontSize: 12 },
  potentialLossCard: { flexDirection: 'row', alignItems: 'center', gap: 8, padding: 12, borderRadius: 10, marginTop: 8, borderWidth: 1 },
  potentialLossText: { fontSize: 13 },
  liveDot: { width: 8, height: 8, borderRadius: 4 },
  logRow: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 8 },
  logTime: { fontSize: 11, width: 60 },
  rolePill: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6 },
  rolePillText: { fontSize: 8 },
  logUser: { fontSize: 13 },
  logAction: { fontSize: 11, marginTop: 1 },
});
