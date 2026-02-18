import React from 'react';
import {
  View, Text, ScrollView, StyleSheet, Platform, RefreshControl,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';
import { useTheme } from '@/lib/theme-context';
import type { ReportData, Transaction } from '@/lib/types';

export default function ReportsScreen() {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();

  const reportsQuery = useQuery<ReportData>({ queryKey: ['/api/reports'] });
  const txQuery = useQuery<Transaction[]>({ queryKey: ['/api/transactions'] });
  const report = reportsQuery.data;
  const transactions = txQuery.data || [];

  const onRefresh = () => {
    reportsQuery.refetch();
    txQuery.refetch();
  };

  if (!report) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={[styles.loadingContainer, { paddingTop: insets.top + 80 }]}>
          <Text style={[styles.loadingText, { color: colors.textMuted, fontFamily: 'Inter_400Regular' }]}>Loading reports...</Text>
        </View>
      </View>
    );
  }

  const statCards = [
    { label: 'Total Revenue', value: `Rs.${report.totalRevenue.toLocaleString()}`, color: '#2563eb', icon: 'currency-inr' as const },
    { label: 'Net Profit', value: `Rs.${report.netProfit.toLocaleString()}`, color: '#16a34a', icon: 'trending-up' as const },
    { label: 'Transactions', value: String(report.totalTransactions), color: '#f59e0b', icon: 'receipt-outline' as const },
    { label: 'Avg Transaction', value: `Rs.${report.avgTransaction}`, color: '#8b5cf6', icon: 'analytics-outline' as const },
  ];

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView
        contentContainerStyle={{ paddingTop: insets.top + (Platform.OS === 'web' ? 67 : 8), paddingBottom: 100 }}
        refreshControl={<RefreshControl refreshing={!!reportsQuery.isRefetching} onRefresh={onRefresh} tintColor={colors.tint} />}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.headerRow}>
          <View>
            <Text style={[styles.headerTitle, { color: colors.text, fontFamily: 'Inter_700Bold' }]}>Reports & Analytics</Text>
            <Text style={[styles.headerSub, { color: colors.textSecondary, fontFamily: 'Inter_400Regular' }]}>Business intelligence overview</Text>
          </View>
        </View>

        <View style={styles.statGrid}>
          {statCards.map((s, i) => (
            <View key={i} style={[styles.statCard, { backgroundColor: s.color }]}>
              <View style={[styles.statIconBox, { backgroundColor: 'rgba(255,255,255,0.2)' }]}>
                {s.icon.includes('-') ? (
                  <Ionicons name={s.icon as any} size={20} color="#fff" />
                ) : (
                  <MaterialCommunityIcons name={s.icon as any} size={20} color="#fff" />
                )}
              </View>
              <Text style={[styles.statValue, { fontFamily: 'Inter_700Bold' }]}>{s.value}</Text>
              <Text style={[styles.statLabel, { fontFamily: 'Inter_400Regular' }]}>{s.label}</Text>
            </View>
          ))}
        </View>

        <View style={[styles.section, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.sectionTitle, { color: colors.text, fontFamily: 'Inter_600SemiBold' }]}>Top Selling Products</Text>
          {report.topProducts.map((p, i) => {
            const maxRev = report.topProducts[0]?.revenue || 1;
            const pct = (p.revenue / maxRev) * 100;
            return (
              <View key={i} style={styles.topProductRow}>
                <Text style={[styles.topProductName, { color: colors.text, fontFamily: 'Inter_500Medium' }]} numberOfLines={1}>{p.name}</Text>
                <View style={styles.barContainer}>
                  <View style={[styles.progressBar, { width: `${pct}%`, backgroundColor: colors.tint }]} />
                </View>
                <Text style={[styles.topProductValue, { color: colors.tint, fontFamily: 'Inter_600SemiBold' }]}>Rs.{Math.round(p.revenue)}</Text>
              </View>
            );
          })}
        </View>

        <View style={[styles.section, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.sectionTitle, { color: colors.text, fontFamily: 'Inter_600SemiBold' }]}>Payment Breakdown</Text>
          <View style={styles.paymentGrid}>
            {Object.entries(report.paymentBreakdown).map(([method, data]) => {
              const pmColors: Record<string, string> = { Cash: '#16a34a', Card: '#2563eb', UPI: '#8b5cf6' };
              const pmIcons: Record<string, string> = { Cash: 'cash-outline', Card: 'card-outline', UPI: 'phone-portrait-outline' };
              return (
                <View key={method} style={[styles.paymentCard, { backgroundColor: (pmColors[method] || colors.tint) + '10', borderColor: (pmColors[method] || colors.tint) + '30' }]}>
                  <Ionicons name={pmIcons[method] as any || 'wallet-outline'} size={24} color={pmColors[method] || colors.tint} />
                  <Text style={[styles.paymentMethodName, { color: colors.text, fontFamily: 'Inter_600SemiBold' }]}>{method}</Text>
                  <Text style={[styles.paymentMethodCount, { color: colors.textMuted, fontFamily: 'Inter_400Regular' }]}>{data.count} txns</Text>
                  <Text style={[styles.paymentMethodTotal, { color: pmColors[method] || colors.tint, fontFamily: 'Inter_700Bold' }]}>Rs.{Math.round(data.total)}</Text>
                </View>
              );
            })}
          </View>
        </View>

        <View style={[styles.section, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.sectionTitle, { color: colors.text, fontFamily: 'Inter_600SemiBold' }]}>Cashier Performance</Text>
          {report.cashierPerformance.map((c, i) => (
            <View key={i} style={[styles.cashierRow, i < report.cashierPerformance.length - 1 && { borderBottomWidth: 0.5, borderBottomColor: colors.border }]}>
              <View style={[styles.cashierAvatar, { backgroundColor: colors.cashier + '20' }]}>
                <Text style={[styles.cashierAvatarText, { color: colors.cashier, fontFamily: 'Inter_700Bold' }]}>{c.name.split(' ').map(n => n[0]).join('')}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.cashierName, { color: colors.text, fontFamily: 'Inter_600SemiBold' }]}>{c.name}</Text>
                <Text style={[styles.cashierMeta, { color: colors.textMuted, fontFamily: 'Inter_400Regular' }]}>{c.transactions} transactions</Text>
              </View>
              <Text style={[styles.cashierRevenue, { color: colors.success, fontFamily: 'Inter_700Bold' }]}>Rs.{Math.round(c.revenue)}</Text>
            </View>
          ))}
        </View>

        {report.reorderSuggestions.length > 0 && (
          <View style={[styles.section, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={styles.sectionHeaderRow}>
              <Ionicons name="refresh" size={18} color={colors.warning} />
              <Text style={[styles.sectionTitle, { color: colors.text, fontFamily: 'Inter_600SemiBold' }]}>Reorder Suggestions</Text>
              <View style={[styles.badge, { backgroundColor: colors.warning + '20' }]}>
                <Text style={[styles.badgeText, { color: colors.warning, fontFamily: 'Inter_600SemiBold' }]}>{report.reorderSuggestions.length} items</Text>
              </View>
            </View>
            {report.reorderSuggestions.map(r => (
              <View key={r.id} style={[styles.reorderRow, { borderBottomColor: colors.border }]}>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.reorderName, { color: colors.text, fontFamily: 'Inter_500Medium' }]}>{r.name}</Text>
                  <Text style={[styles.reorderMeta, { color: colors.textMuted, fontFamily: 'Inter_400Regular' }]}>Current: {r.stock} pcs</Text>
                </View>
                <View style={{ alignItems: 'flex-end' }}>
                  <Text style={[styles.reorderSuggest, { color: colors.tint, fontFamily: 'Inter_600SemiBold' }]}>Order {r.suggestedOrder}</Text>
                  <Text style={[styles.reorderCost, { color: colors.textMuted, fontFamily: 'Inter_400Regular' }]}>~Rs.{r.estimatedCost.toLocaleString()}</Text>
                </View>
              </View>
            ))}
          </View>
        )}

        <View style={[styles.section, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.sectionTitle, { color: colors.text, fontFamily: 'Inter_600SemiBold' }]}>Tax Summary (GST)</Text>
          <View style={styles.taxGrid}>
            <View style={[styles.taxCard, { backgroundColor: colors.success + '10' }]}>
              <Text style={[styles.taxCardValue, { color: colors.success, fontFamily: 'Inter_700Bold' }]}>Rs.{report.totalRevenue.toFixed(2)}</Text>
              <Text style={[styles.taxCardLabel, { color: colors.textMuted, fontFamily: 'Inter_400Regular' }]}>Gross Sales</Text>
            </View>
            <View style={[styles.taxCard, { backgroundColor: colors.danger + '10' }]}>
              <Text style={[styles.taxCardValue, { color: colors.danger, fontFamily: 'Inter_700Bold' }]}>Rs.{report.totalGst.toFixed(2)}</Text>
              <Text style={[styles.taxCardLabel, { color: colors.textMuted, fontFamily: 'Inter_400Regular' }]}>GST Collected</Text>
            </View>
            <View style={[styles.taxCard, { backgroundColor: colors.warning + '10' }]}>
              <Text style={[styles.taxCardValue, { color: colors.warning, fontFamily: 'Inter_700Bold' }]}>Rs.{report.totalDiscount.toFixed(2)}</Text>
              <Text style={[styles.taxCardLabel, { color: colors.textMuted, fontFamily: 'Inter_400Regular' }]}>Discounts</Text>
            </View>
            <View style={[styles.taxCard, { backgroundColor: colors.tint + '10' }]}>
              <Text style={[styles.taxCardValue, { color: colors.tint, fontFamily: 'Inter_700Bold' }]}>{report.itemsSold}</Text>
              <Text style={[styles.taxCardLabel, { color: colors.textMuted, fontFamily: 'Inter_400Regular' }]}>Items Sold</Text>
            </View>
          </View>
        </View>

        <View style={[styles.section, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.sectionTitle, { color: colors.text, fontFamily: 'Inter_600SemiBold' }]}>Recent Transactions</Text>
          {transactions.slice(0, 5).map(tx => (
            <View key={tx.id} style={[styles.txRow, { borderBottomColor: colors.border }]}>
              <View style={[styles.txIcon, { backgroundColor: tx.paymentMethod === 'Cash' ? colors.success + '15' : tx.paymentMethod === 'UPI' ? colors.accent + '15' : colors.tint + '15' }]}>
                <Ionicons name={tx.paymentMethod === 'Cash' ? 'cash-outline' : tx.paymentMethod === 'UPI' ? 'phone-portrait-outline' : 'card-outline'} size={18} color={tx.paymentMethod === 'Cash' ? colors.success : tx.paymentMethod === 'UPI' ? colors.accent : colors.tint} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.txInvoice, { color: colors.text, fontFamily: 'Inter_500Medium' }]}>{tx.invoiceNo}</Text>
                <Text style={[styles.txTime, { color: colors.textMuted, fontFamily: 'Inter_400Regular' }]}>{new Date(tx.createdAt).toLocaleString('en-IN', { dateStyle: 'short', timeStyle: 'short' })}</Text>
              </View>
              <Text style={[styles.txTotal, { color: colors.text, fontFamily: 'Inter_700Bold' }]}>Rs.{tx.total.toFixed(2)}</Text>
            </View>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  loadingContainer: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  loadingText: { fontSize: 14 },
  headerRow: { paddingHorizontal: 20, paddingTop: 8, marginBottom: 16 },
  headerTitle: { fontSize: 22 },
  headerSub: { fontSize: 13, marginTop: 2 },
  statGrid: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 16, gap: 10, marginBottom: 16 },
  statCard: { width: '47%', borderRadius: 16, padding: 16 },
  statIconBox: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center', marginBottom: 10 },
  statValue: { fontSize: 18, color: '#fff' },
  statLabel: { fontSize: 12, color: 'rgba(255,255,255,0.8)', marginTop: 4 },
  section: { marginHorizontal: 16, borderRadius: 16, padding: 16, borderWidth: 1, marginBottom: 16 },
  sectionTitle: { fontSize: 16, marginBottom: 14, flex: 1 },
  sectionHeaderRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 14 },
  topProductRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 10 },
  topProductName: { fontSize: 12, width: 100 },
  barContainer: { flex: 1, height: 14, backgroundColor: '#e2e8f010', borderRadius: 7, overflow: 'hidden' },
  progressBar: { height: '100%', borderRadius: 7 },
  topProductValue: { fontSize: 12, minWidth: 60, textAlign: 'right' },
  paymentGrid: { flexDirection: 'row', gap: 10 },
  paymentCard: { flex: 1, borderRadius: 14, padding: 14, borderWidth: 1, alignItems: 'center', gap: 6 },
  paymentMethodName: { fontSize: 14 },
  paymentMethodCount: { fontSize: 11 },
  paymentMethodTotal: { fontSize: 15 },
  cashierRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12 },
  cashierAvatar: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  cashierAvatarText: { fontSize: 14 },
  cashierName: { fontSize: 14 },
  cashierMeta: { fontSize: 11, marginTop: 1 },
  cashierRevenue: { fontSize: 16 },
  badge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 8 },
  badgeText: { fontSize: 11 },
  reorderRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 0.5 },
  reorderName: { fontSize: 14 },
  reorderMeta: { fontSize: 11, marginTop: 2 },
  reorderSuggest: { fontSize: 13 },
  reorderCost: { fontSize: 11, marginTop: 2 },
  taxGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  taxCard: { width: '47%', borderRadius: 12, padding: 14, alignItems: 'center' },
  taxCardValue: { fontSize: 16 },
  taxCardLabel: { fontSize: 11, marginTop: 4 },
  txRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12, borderBottomWidth: 0.5 },
  txIcon: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  txInvoice: { fontSize: 13 },
  txTime: { fontSize: 11, marginTop: 2 },
  txTotal: { fontSize: 14 },
});
