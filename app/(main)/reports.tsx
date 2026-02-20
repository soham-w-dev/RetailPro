import React, { useState } from 'react';
import {
  View, Text, ScrollView, StyleSheet, Platform, RefreshControl,
  Pressable, Modal, TouchableOpacity, FlatList,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';
import { useTheme } from '@/lib/theme-context';
import type { ReportData, Transaction } from '@/lib/types';

// ─── helpers ────────────────────────────────────────────────────────────────
const paymentColor = (m: string, colors: any) =>
  m === 'Cash' ? colors.success : m === 'UPI' ? colors.accent : colors.tint;

const paymentIcon = (m: string) =>
  m === 'Cash' ? 'cash-outline' : m === 'UPI' ? 'phone-portrait-outline' : 'card-outline';

// ─── Transaction Detail bottom-sheet ────────────────────────────────────────
function TxDetailSheet({
  tx, visible, colors, onClose,
}: { tx: Transaction | null; visible: boolean; colors: any; onClose: () => void }) {
  if (!tx) return null;
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={ds.overlay}>
        <Pressable style={ds.backdrop} onPress={onClose} />
        <View style={[ds.sheet, { backgroundColor: colors.card }]}>
          {/* handle */}
          <View style={[ds.handle, { backgroundColor: colors.border }]} />

          {/* header */}
          <View style={[ds.sheetHeader, { borderBottomColor: colors.border }]}>
            <View style={{ flex: 1 }}>
              <Text style={[ds.sheetTitle, { color: colors.text }]}>{tx.invoiceNo}</Text>
              <Text style={[ds.sheetDate, { color: colors.textMuted }]}>
                {new Date(tx.createdAt).toLocaleString()}
              </Text>
            </View>
            <View style={{ alignItems: 'flex-end', gap: 6 }}>
              <View style={[ds.pill, { backgroundColor: paymentColor(tx.paymentMethod, colors) + '20' }]}>
                <Ionicons name={paymentIcon(tx.paymentMethod) as any} size={11} color={paymentColor(tx.paymentMethod, colors)} />
                <Text style={[ds.pillText, { color: paymentColor(tx.paymentMethod, colors) }]}>{tx.paymentMethod}</Text>
              </View>
              <View style={[ds.pill, { backgroundColor: colors.success + '20' }]}>
                <Text style={[ds.pillText, { color: colors.success }]}>✓ Success</Text>
              </View>
            </View>
            <TouchableOpacity onPress={onClose} style={{ padding: 4, marginLeft: 8 }}>
              <Ionicons name="close" size={22} color={colors.text} />
            </TouchableOpacity>
          </View>

          <ScrollView contentContainerStyle={ds.sheetBody} showsVerticalScrollIndicator={false}>
            {/* info row */}
            <View style={[ds.infoRow, { backgroundColor: colors.background, borderColor: colors.border }]}>
              <View style={ds.infoCell}>
                <Text style={[ds.infoLabel, { color: colors.textMuted }]}>Cashier</Text>
                <Text style={[ds.infoVal, { color: colors.text }]}>{tx.cashierName || 'Unknown'}</Text>
              </View>
              <View style={[ds.infoSep, { backgroundColor: colors.border }]} />
              <View style={ds.infoCell}>
                <Text style={[ds.infoLabel, { color: colors.textMuted }]}>Items</Text>
                <Text style={[ds.infoVal, { color: colors.text }]}>{tx.items.length}</Text>
              </View>
              {tx.customerPhone ? (
                <>
                  <View style={[ds.infoSep, { backgroundColor: colors.border }]} />
                  <View style={ds.infoCell}>
                    <Text style={[ds.infoLabel, { color: colors.textMuted }]}>Customer</Text>
                    <Text style={[ds.infoVal, { color: colors.text }]}>{tx.customerPhone}</Text>
                  </View>
                </>
              ) : null}
            </View>

            {/* Purchased Items */}
            <Text style={[ds.secTitle, { color: colors.text }]}>Purchased Items</Text>
            <View style={[ds.itemsCard, { backgroundColor: colors.background, borderColor: colors.border }]}>
              {tx.items.map((prod, idx) => (
                <View
                  key={idx}
                  style={[
                    ds.itemRow,
                    idx < tx.items.length - 1 && { borderBottomColor: colors.border, borderBottomWidth: 0.5 },
                  ]}
                >
                  <View style={[ds.indexBadge, { backgroundColor: colors.tint + '15' }]}>
                    <Text style={[ds.indexText, { color: colors.tint }]}>{idx + 1}</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[ds.itemName, { color: colors.text }]}>{prod.productName}</Text>
                    <Text style={[ds.itemMeta, { color: colors.textMuted }]}>
                      Rs.{prod.price.toFixed(2)} × {prod.qty}{'  •  '}GST {prod.gstRate}%
                    </Text>
                  </View>
                  <Text style={[ds.itemAmt, { color: colors.text }]}>Rs.{prod.total.toFixed(2)}</Text>
                </View>
              ))}
            </View>

            {/* Price Breakdown */}
            <Text style={[ds.secTitle, { color: colors.text }]}>Price Breakdown</Text>
            <View style={[ds.breakCard, { backgroundColor: colors.background, borderColor: colors.border }]}>
              <View style={ds.breakRow}>
                <Text style={[ds.breakLabel, { color: colors.textSecondary }]}>Subtotal</Text>
                <Text style={[ds.breakVal, { color: colors.text }]}>Rs.{tx.subtotal.toFixed(2)}</Text>
              </View>
              <View style={ds.breakRow}>
                <View style={ds.breakLabelRow}>
                  <Ionicons name="pricetag-outline" size={13} color={colors.danger} />
                  <Text style={[ds.breakLabel, { color: colors.textSecondary }]}>Discount</Text>
                </View>
                <Text style={[ds.breakVal, { color: tx.discount > 0 ? colors.danger : colors.textSecondary }]}>
                  {tx.discount > 0 ? `- Rs.${tx.discount.toFixed(2)}` : 'Rs.0.00'}
                </Text>
              </View>
              <View style={ds.breakRow}>
                <View style={ds.breakLabelRow}>
                  <Ionicons name="receipt-outline" size={13} color={colors.tint} />
                  <Text style={[ds.breakLabel, { color: colors.textSecondary }]}>GST / Tax</Text>
                </View>
                <Text style={[ds.breakVal, { color: colors.tint }]}>+ Rs.{tx.gstAmount.toFixed(2)}</Text>
              </View>
              <View style={[ds.totalDivider, { backgroundColor: colors.border }]} />
              <View style={ds.breakRow}>
                <Text style={[ds.totalLabel, { color: colors.text }]}>Total Amount</Text>
                <Text style={[ds.totalAmt, { color: colors.tint }]}>Rs.{tx.total.toFixed(2)}</Text>
              </View>
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

// ─── All Transactions full-screen modal ─────────────────────────────────────
function AllTransactionsModal({
  visible, transactions, colors, insets, onClose,
}: {
  visible: boolean;
  transactions: Transaction[];
  colors: any;
  insets: any;
  onClose: () => void;
}) {
  const [selectedTx, setSelectedTx] = useState<Transaction | null>(null);

  const sorted = [...transactions].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

  const totalRevenue = transactions.reduce((s, t) => s + t.total, 0);

  const renderTx = ({ item }: { item: Transaction }) => {
    const displayItems = item.items.slice(0, 3);
    const extra = item.items.length - displayItems.length;
    const pc = paymentColor(item.paymentMethod, colors);
    return (
      <Pressable
        onPress={() => setSelectedTx(item)}
        style={({ pressed }) => [
          atm.card,
          { backgroundColor: colors.card, borderColor: colors.border, opacity: pressed ? 0.85 : 1 },
        ]}
      >
        {/* card header */}
        <View style={atm.cardHeader}>
          <View style={{ flex: 1, marginRight: 8 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 3 }}>
              <View style={[atm.pill, { backgroundColor: pc + '20' }]}>
                <Ionicons name={paymentIcon(item.paymentMethod) as any} size={11} color={pc} />
                <Text style={[atm.pillTxt, { color: pc }]}>{item.paymentMethod}</Text>
              </View>
              <Text style={[atm.invoice, { color: colors.text }]} numberOfLines={1}>{item.invoiceNo}</Text>
            </View>
            <Text style={[atm.date, { color: colors.textMuted }]}>{new Date(item.createdAt).toLocaleString()}</Text>
          </View>
          <View style={{ alignItems: 'flex-end' }}>
            <Text style={[atm.amount, { color: colors.text }]}>Rs.{item.total.toFixed(2)}</Text>
            <View style={[atm.pill, { backgroundColor: colors.success + '20', marginTop: 4 }]}>
              <Text style={[atm.pillTxt, { color: colors.success }]}>✓ Success</Text>
            </View>
          </View>
        </View>

        {/* item preview */}
        <View style={[atm.previewList, { borderTopColor: colors.border }]}>
          {displayItems.map((p, i) => (
            <View key={i} style={atm.previewRow}>
              <Text style={[atm.previewName, { color: colors.textSecondary }]} numberOfLines={1}>{p.productName}</Text>
              <Text style={[atm.previewQty, { color: colors.textMuted }]}>x{p.qty}</Text>
              <Text style={[atm.previewAmt, { color: colors.text }]}>Rs.{p.total.toFixed(0)}</Text>
            </View>
          ))}
          {extra > 0 && (
            <Text style={[atm.moreItems, { color: colors.tint }]}>+{extra} more item{extra > 1 ? 's' : ''}</Text>
          )}
        </View>

        {/* footer */}
        <View style={[atm.cardFooter, { borderTopColor: colors.border }]}>
          <View style={atm.footerItem}>
            <Ionicons name="person-outline" size={11} color={colors.textMuted} />
            <Text style={[atm.footerTxt, { color: colors.textMuted }]}>{item.cashierName || 'Unknown'}</Text>
          </View>
          <View style={atm.footerItem}>
            <Ionicons name="cube-outline" size={11} color={colors.textMuted} />
            <Text style={[atm.footerTxt, { color: colors.textMuted }]}>{item.items.length} items</Text>
          </View>
          <View style={atm.footerItem}>
            <Ionicons name="chevron-forward" size={13} color={colors.tint} />
            <Text style={[atm.footerBlue, { color: colors.tint }]}>View Details</Text>
          </View>
        </View>
      </Pressable>
    );
  };

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <View style={[atm.container, { backgroundColor: colors.background, paddingTop: insets.top + (Platform.OS === 'web' ? 67 : 0) }]}>
        {/* header */}
        <View style={[atm.header, { borderBottomColor: colors.border }]}>
          <TouchableOpacity onPress={onClose} style={atm.backBtn}>
            <Ionicons name="arrow-back" size={22} color={colors.text} />
          </TouchableOpacity>
          <View style={{ flex: 1 }}>
            <Text style={[atm.headerTitle, { color: colors.text }]}>All Transactions</Text>
            <Text style={[atm.headerSub, { color: colors.textMuted }]}>{transactions.length} records found</Text>
          </View>
        </View>

        {/* summary bar */}
        <View style={[atm.summaryBar, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={atm.summaryItem}>
            <Text style={[atm.summaryVal, { color: colors.text }]}>{transactions.length}</Text>
            <Text style={[atm.summaryLabel, { color: colors.textMuted }]}>Total Transactions</Text>
          </View>
          <View style={[atm.summarySep, { backgroundColor: colors.border }]} />
          <View style={atm.summaryItem}>
            <Text style={[atm.summaryVal, { color: colors.tint }]}>Rs.{totalRevenue.toFixed(2)}</Text>
            <Text style={[atm.summaryLabel, { color: colors.textMuted }]}>Lifetime Revenue</Text>
          </View>
        </View>

        <FlatList
          data={sorted}
          renderItem={renderTx}
          keyExtractor={item => item.id}
          contentContainerStyle={atm.list}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={{ alignItems: 'center', marginTop: 60, gap: 12 }}>
              <Ionicons name="receipt-outline" size={48} color={colors.textMuted} />
              <Text style={{ color: colors.textMuted, fontFamily: 'Inter_500Medium' }}>No transactions yet</Text>
            </View>
          }
        />
      </View>

      {/* nested detail sheet */}
      <TxDetailSheet
        tx={selectedTx}
        visible={!!selectedTx}
        colors={colors}
        onClose={() => setSelectedTx(null)}
      />
    </Modal>
  );
}

// ─── Main Reports Screen ─────────────────────────────────────────────────────
export default function ReportsScreen() {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const [showAllTx, setShowAllTx] = useState(false);
  const [selectedTx, setSelectedTx] = useState<Transaction | null>(null);

  const reportsQuery = useQuery<ReportData>({ queryKey: ['/api/reports'] });
  const txQuery = useQuery<Transaction[]>({ queryKey: ['/api/transactions'] });
  const report = reportsQuery.data;
  const transactions = txQuery.data || [];

  const recentTx = [...transactions]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 5);

  const onRefresh = () => { reportsQuery.refetch(); txQuery.refetch(); };

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
    { label: 'Total Revenue', value: `Rs.${report.totalRevenue.toLocaleString()}`, color: '#2563eb', icon: 'currency-inr', lib: 'mci' },
    { label: 'Net Profit', value: `Rs.${report.netProfit.toLocaleString()}`, color: '#16a34a', icon: 'trending-up', lib: 'ion' },
    { label: 'Transactions', value: String(report.totalTransactions), color: '#f59e0b', icon: 'receipt-outline', lib: 'ion' },
    { label: 'Avg Transaction', value: `Rs.${report.avgTransaction}`, color: '#8b5cf6', icon: 'analytics-outline', lib: 'ion' },
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

        {/* Stat Cards */}
        <View style={styles.statGrid}>
          {statCards.map((s, i) => (
            <View key={i} style={[styles.statCard, { backgroundColor: s.color }]}>
              <View style={[styles.statIconBox, { backgroundColor: 'rgba(255,255,255,0.2)' }]}>
                {s.lib === 'mci'
                  ? <MaterialCommunityIcons name={s.icon as any} size={20} color="#fff" />
                  : <Ionicons name={s.icon as any} size={20} color="#fff" />}
              </View>
              <Text style={[styles.statValue, { fontFamily: 'Inter_700Bold' }]}>{s.value}</Text>
              <Text style={[styles.statLabel, { fontFamily: 'Inter_400Regular' }]}>{s.label}</Text>
            </View>
          ))}
        </View>

        {/* Top Products */}
        <View style={[styles.section, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.sectionTitle, { color: colors.text, fontFamily: 'Inter_600SemiBold' }]}>Top Selling Products</Text>
          {report.topProducts.map((p, i) => {
            const maxRev = report.topProducts[0]?.revenue || 1;
            const pct = Math.max((p.revenue / maxRev) * 100, 2);
            return (
              <View key={i} style={[styles.topProductRow, i < report.topProducts.length - 1 && { borderBottomColor: colors.border, borderBottomWidth: 0.5 }]}>
                {/* Rank badge */}
                <View style={[styles.rankBadge, { backgroundColor: colors.tint + '18' }]}>
                  <Text style={[styles.rankText, { color: colors.tint }]}>#{i + 1}</Text>
                </View>
                {/* Name + bar + value */}
                <View style={{ flex: 1 }}>
                  <View style={styles.topProductHeaderRow}>
                    <Text
                      style={[styles.topProductName, { color: colors.text, fontFamily: 'Inter_600SemiBold' }]}
                      numberOfLines={1}
                      ellipsizeMode="tail"
                    >
                      {p.name}
                    </Text>
                    <Text style={[styles.topProductValue, { color: colors.tint, fontFamily: 'Inter_700Bold' }]}>
                      Rs.{Math.round(p.revenue)}
                    </Text>
                  </View>
                  {/* Full-width bar below — no competition with text */}
                  <View style={[styles.barContainer, { backgroundColor: colors.tint + '15' }]}>
                    <View style={[styles.progressBar, { width: `${pct}%`, backgroundColor: colors.tint }]} />
                  </View>
                </View>
              </View>
            );
          })}
        </View>

        {/* Payment Breakdown */}
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

        {/* Cashier Performance */}
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

        {/* Reorder Suggestions */}
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

        {/* Tax Summary */}
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

        {/* ── Recent Transactions (with View All button) ── */}
        <View style={[styles.section, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={styles.recentHeader}>
            <Text style={[styles.sectionTitle, { color: colors.text, fontFamily: 'Inter_600SemiBold' }]}>Recent Transactions</Text>
            <Pressable
              onPress={() => setShowAllTx(true)}
              style={({ pressed }) => [
                styles.viewAllBtn,
                { backgroundColor: colors.tint + '18', opacity: pressed ? 0.7 : 1 },
              ]}
            >
              <Text style={[styles.viewAllText, { color: colors.tint, fontFamily: 'Inter_600SemiBold' }]}>View All</Text>
              <Ionicons name="arrow-forward" size={14} color={colors.tint} />
            </Pressable>
          </View>

          {recentTx.map(tx => (
            <Pressable
              key={tx.id}
              onPress={() => setSelectedTx(tx)}
              style={({ pressed }) => [
                styles.txRow,
                { borderBottomColor: colors.border, opacity: pressed ? 0.75 : 1 },
              ]}
            >
              <View style={[styles.txIcon, {
                backgroundColor:
                  tx.paymentMethod === 'Cash' ? colors.success + '15' :
                    tx.paymentMethod === 'UPI' ? colors.accent + '15' :
                      colors.tint + '15',
              }]}>
                <Ionicons
                  name={paymentIcon(tx.paymentMethod) as any}
                  size={18}
                  color={paymentColor(tx.paymentMethod, colors)}
                />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.txInvoice, { color: colors.text, fontFamily: 'Inter_500Medium' }]}>{tx.invoiceNo}</Text>
                <Text style={[styles.txTime, { color: colors.textMuted, fontFamily: 'Inter_400Regular' }]}>
                  {new Date(tx.createdAt).toLocaleString('en-IN', { dateStyle: 'short', timeStyle: 'short' })}
                </Text>
              </View>
              <View style={{ alignItems: 'flex-end', gap: 4 }}>
                <Text style={[styles.txTotal, { color: colors.text, fontFamily: 'Inter_700Bold' }]}>Rs.{tx.total.toFixed(2)}</Text>
                <Ionicons name="chevron-forward" size={14} color={colors.textMuted} />
              </View>
            </Pressable>
          ))}
        </View>
      </ScrollView>

      {/* All Transactions modal */}
      <AllTransactionsModal
        visible={showAllTx}
        transactions={transactions}
        colors={colors}
        insets={insets}
        onClose={() => setShowAllTx(false)}
      />

      {/* Single Transaction detail (from recent list) */}
      <TxDetailSheet
        tx={selectedTx}
        visible={!!selectedTx}
        colors={colors}
        onClose={() => setSelectedTx(null)}
      />
    </View>
  );
}

// ─── Styles ──────────────────────────────────────────────────────────────────
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
  sectionTitle: { fontSize: 16, flex: 1 },
  sectionHeaderRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 14 },
  topProductRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 10,
  },
  rankBadge: {
    width: 28, height: 28, borderRadius: 8,
    alignItems: 'center', justifyContent: 'center',
  },
  rankText: { fontSize: 11, fontFamily: 'Inter_700Bold' },
  topProductHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  topProductName: {
    fontSize: 13,
    flex: 1,              // takes all space except the value label
    marginRight: 8,
  },
  barContainer: {
    height: 6,
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressBar: { height: '100%', borderRadius: 3 },
  topProductValue: { fontSize: 13 },
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

  // Recent Transactions section
  recentHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 14 },
  viewAllBtn: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20 },
  viewAllText: { fontSize: 12 },
  txRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12, borderBottomWidth: 0.5 },
  txIcon: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  txInvoice: { fontSize: 13 },
  txTime: { fontSize: 11, marginTop: 2 },
  txTotal: { fontSize: 14 },
});

// ─── Detail Sheet Styles ─────────────────────────────────────────────────────
const ds = StyleSheet.create({
  overlay: { flex: 1, justifyContent: 'flex-end' },
  backdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.55)' },
  sheet: { borderTopLeftRadius: 24, borderTopRightRadius: 24, paddingBottom: 34, maxHeight: '90%' },
  handle: { width: 40, height: 4, borderRadius: 2, alignSelf: 'center', marginTop: 12, marginBottom: 4 },
  sheetHeader: { flexDirection: 'row', alignItems: 'flex-start', paddingHorizontal: 20, paddingVertical: 14, borderBottomWidth: 1, gap: 10 },
  sheetTitle: { fontSize: 15, fontFamily: 'Inter_700Bold' },
  sheetDate: { fontSize: 12, fontFamily: 'Inter_400Regular', marginTop: 2 },
  pill: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
  pillText: { fontSize: 10, fontFamily: 'Inter_600SemiBold' },
  sheetBody: { padding: 20, gap: 12 },
  infoRow: { flexDirection: 'row', borderRadius: 12, borderWidth: 1, overflow: 'hidden' },
  infoCell: { flex: 1, padding: 12, alignItems: 'center' },
  infoLabel: { fontSize: 11, fontFamily: 'Inter_400Regular', marginBottom: 4 },
  infoVal: { fontSize: 14, fontFamily: 'Inter_600SemiBold' },
  infoSep: { width: 1 },
  secTitle: { fontSize: 13, fontFamily: 'Inter_700Bold', marginTop: 4 },
  itemsCard: { borderRadius: 12, borderWidth: 1, overflow: 'hidden' },
  itemRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 10, paddingHorizontal: 14 },
  indexBadge: { width: 24, height: 24, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  indexText: { fontSize: 11, fontFamily: 'Inter_700Bold' },
  itemName: { fontSize: 13, fontFamily: 'Inter_600SemiBold' },
  itemMeta: { fontSize: 11, fontFamily: 'Inter_400Regular', marginTop: 2 },
  itemAmt: { fontSize: 14, fontFamily: 'Inter_700Bold' },
  breakCard: { borderRadius: 12, borderWidth: 1, padding: 14, gap: 10 },
  breakRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  breakLabelRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  breakLabel: { fontSize: 13, fontFamily: 'Inter_400Regular' },
  breakVal: { fontSize: 13, fontFamily: 'Inter_500Medium' },
  totalDivider: { height: 1, marginVertical: 4 },
  totalLabel: { fontSize: 15, fontFamily: 'Inter_700Bold' },
  totalAmt: { fontSize: 20, fontFamily: 'Inter_700Bold' },
});

// ─── All Transactions Modal Styles ───────────────────────────────────────────
const atm = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 1, gap: 12 },
  backBtn: { padding: 4 },
  headerTitle: { fontSize: 18, fontFamily: 'Inter_700Bold' },
  headerSub: { fontSize: 12, fontFamily: 'Inter_400Regular', marginTop: 1 },
  summaryBar: { flexDirection: 'row', marginHorizontal: 16, marginVertical: 12, borderRadius: 14, borderWidth: 1, overflow: 'hidden' },
  summaryItem: { flex: 1, padding: 14, alignItems: 'center' },
  summaryVal: { fontSize: 18, fontFamily: 'Inter_700Bold' },
  summaryLabel: { fontSize: 11, fontFamily: 'Inter_400Regular', marginTop: 4 },
  summarySep: { width: 1 },
  list: { padding: 16, paddingTop: 4, paddingBottom: 100 },
  card: { borderRadius: 16, marginBottom: 12, borderWidth: 1, overflow: 'hidden' },
  cardHeader: { flexDirection: 'row', alignItems: 'flex-start', padding: 14 },
  pill: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
  pillTxt: { fontSize: 10, fontFamily: 'Inter_600SemiBold' },
  invoice: { fontFamily: 'Inter_600SemiBold', fontSize: 13, flex: 1 },
  date: { fontFamily: 'Inter_400Regular', fontSize: 11, marginTop: 2 },
  amount: { fontFamily: 'Inter_700Bold', fontSize: 16 },
  previewList: { paddingHorizontal: 14, paddingVertical: 8, borderTopWidth: 0.5 },
  previewRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 3 },
  previewName: { flex: 1, fontSize: 12, fontFamily: 'Inter_400Regular' },
  previewQty: { fontSize: 12, fontFamily: 'Inter_500Medium', marginHorizontal: 8 },
  previewAmt: { fontSize: 12, fontFamily: 'Inter_600SemiBold', minWidth: 50, textAlign: 'right' },
  moreItems: { fontSize: 11, fontFamily: 'Inter_600SemiBold', marginTop: 4 },
  cardFooter: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 14, paddingVertical: 10, borderTopWidth: 0.5 },
  footerItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  footerTxt: { fontSize: 11, fontFamily: 'Inter_400Regular' },
  footerBlue: { fontSize: 11, fontFamily: 'Inter_600SemiBold' },
});
