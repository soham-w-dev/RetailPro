import React, { useState, useMemo } from 'react';
import {
    View, Text, StyleSheet, FlatList, TextInput, RefreshControl,
    Platform, Pressable, Modal, ScrollView, TouchableOpacity
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '@/lib/theme-context';
import { useQuery } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import type { Transaction } from '@/lib/types';

export default function TransactionsScreen() {
    const { colors } = useTheme();
    const insets = useSafeAreaInsets();
    const [search, setSearch] = useState('');
    const [selectedTx, setSelectedTx] = useState<Transaction | null>(null);

    const { data: transactions, refetch, isRefetching } = useQuery<Transaction[]>({
        queryKey: ['/api/transactions']
    });

    const filtered = useMemo(() => {
        if (!transactions) return [];
        let res = [...transactions].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        if (search) {
            const q = search.toLowerCase();
            res = res.filter(t =>
                t.invoiceNo.toLowerCase().includes(q) ||
                t.customerPhone?.includes(q) ||
                t.cashierName?.toLowerCase().includes(q)
            );
        }
        return res;
    }, [transactions, search]);

    const getPaymentIcon = (method: string) => {
        switch (method) {
            case 'Cash': return 'cash-outline';
            case 'Card': return 'card-outline';
            case 'UPI': return 'phone-portrait-outline';
            default: return 'wallet-outline';
        }
    };

    const renderItem = ({ item }: { item: Transaction }) => {
        // Show first 3 items, and a "+N more" label if needed
        const displayItems = item.items.slice(0, 3);
        const extraCount = item.items.length - displayItems.length;

        return (
            <Pressable
                onPress={() => setSelectedTx(item)}
                style={({ pressed }) => [
                    styles.card,
                    { backgroundColor: colors.card, borderColor: colors.border },
                    pressed && { opacity: 0.85 }
                ]}
            >
                {/* Card Header */}
                <View style={styles.cardHeader}>
                    <View style={{ flex: 1, marginRight: 8 }}>
                        <View style={styles.invoiceRow}>
                            <View style={[styles.payBadge, { backgroundColor: colors.tint + '20' }]}>
                                <Ionicons name={getPaymentIcon(item.paymentMethod) as any} size={12} color={colors.tint} />
                                <Text style={[styles.payBadgeText, { color: colors.tint }]}>{item.paymentMethod}</Text>
                            </View>
                            <Text style={[styles.invoice, { color: colors.text }]} numberOfLines={1}>
                                {item.invoiceNo}
                            </Text>
                        </View>
                        <Text style={[styles.date, { color: colors.textMuted }]}>
                            {new Date(item.createdAt).toLocaleString()}
                        </Text>
                    </View>
                    <View style={{ alignItems: 'flex-end' }}>
                        <Text style={[styles.amount, { color: colors.text }]}>Rs.{item.total.toFixed(2)}</Text>
                        <View style={[styles.successBadge, { backgroundColor: colors.success + '20' }]}>
                            <Text style={[styles.successText, { color: colors.success }]}>Success</Text>
                        </View>
                    </View>
                </View>

                {/* Item Preview List */}
                <View style={[styles.itemPreviewList, { borderTopColor: colors.border }]}>
                    {displayItems.map((prod, idx) => (
                        <View key={idx} style={styles.previewRow}>
                            <Text style={[styles.previewName, { color: colors.textSecondary }]} numberOfLines={1}>
                                {prod.productName}
                            </Text>
                            <Text style={[styles.previewQty, { color: colors.textMuted }]}>x{prod.qty}</Text>
                            <Text style={[styles.previewPrice, { color: colors.text }]}>Rs.{prod.total.toFixed(0)}</Text>
                        </View>
                    ))}
                    {extraCount > 0 && (
                        <Text style={[styles.moreItems, { color: colors.tint }]}>+{extraCount} more item{extraCount > 1 ? 's' : ''}</Text>
                    )}
                </View>

                {/* Card Footer */}
                <View style={[styles.cardFooter, { borderTopColor: colors.border }]}>
                    <View style={styles.footerItem}>
                        <Ionicons name="person-outline" size={11} color={colors.textMuted} />
                        <Text style={[styles.footerText, { color: colors.textMuted }]}>{item.cashierName || 'Unknown'}</Text>
                    </View>
                    <View style={styles.footerItem}>
                        <Ionicons name="cube-outline" size={11} color={colors.textMuted} />
                        <Text style={[styles.footerText, { color: colors.textMuted }]}>{item.items?.length || 0} items</Text>
                    </View>
                    <View style={styles.footerItem}>
                        <Ionicons name="chevron-forward" size={14} color={colors.tint} />
                        <Text style={[styles.footerTextBlue, { color: colors.tint }]}>View Details</Text>
                    </View>
                </View>
            </Pressable>
        );
    };

    return (
        <View style={[styles.container, { backgroundColor: colors.background, paddingTop: insets.top + (Platform.OS === 'web' ? 67 : 0) }]}>
            <View style={styles.header}>
                <Text style={[styles.title, { color: colors.text }]}>Transactions</Text>
                <Text style={[styles.subtitle, { color: colors.textSecondary }]}>History of all sales</Text>
            </View>

            <View style={[styles.searchContainer, { backgroundColor: colors.inputBg, borderColor: colors.border }]}>
                <Ionicons name="search" size={20} color={colors.textMuted} />
                <TextInput
                    style={[styles.input, { color: colors.text }]}
                    placeholder="Search invoice, cashier..."
                    placeholderTextColor={colors.textMuted}
                    value={search}
                    onChangeText={setSearch}
                />
                {search.length > 0 && (
                    <Pressable onPress={() => setSearch('')}>
                        <Ionicons name="close-circle" size={20} color={colors.textMuted} />
                    </Pressable>
                )}
            </View>

            <FlatList
                data={filtered}
                renderItem={renderItem}
                keyExtractor={item => item.id}
                contentContainerStyle={styles.list}
                refreshControl={
                    <RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor={colors.tint} />
                }
                ListEmptyComponent={
                    <View style={styles.empty}>
                        <Ionicons name="receipt-outline" size={48} color={colors.textMuted} />
                        <Text style={[styles.emptyText, { color: colors.textMuted }]}>No transactions found</Text>
                    </View>
                }
            />

            {/* Transaction Detail Modal */}
            <Modal visible={!!selectedTx} transparent animationType="slide" onRequestClose={() => setSelectedTx(null)}>
                <View style={styles.modalOverlay}>
                    <Pressable style={styles.modalBackdrop} onPress={() => setSelectedTx(null)} />
                    <View style={[styles.modalSheet, { backgroundColor: colors.card }]}>
                        {selectedTx && (
                            <>
                                {/* Modal Handle */}
                                <View style={[styles.handle, { backgroundColor: colors.border }]} />

                                {/* Modal Header */}
                                <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
                                    <View style={{ flex: 1 }}>
                                        <Text style={[styles.modalTitle, { color: colors.text }]}>{selectedTx.invoiceNo}</Text>
                                        <Text style={[styles.modalDate, { color: colors.textMuted }]}>
                                            {new Date(selectedTx.createdAt).toLocaleString()}
                                        </Text>
                                    </View>
                                    <View style={{ alignItems: 'flex-end', gap: 6 }}>
                                        <View style={[styles.payBadge, { backgroundColor: colors.tint + '20' }]}>
                                            <Ionicons name={getPaymentIcon(selectedTx.paymentMethod) as any} size={12} color={colors.tint} />
                                            <Text style={[styles.payBadgeText, { color: colors.tint }]}>{selectedTx.paymentMethod}</Text>
                                        </View>
                                        <View style={[styles.successBadge, { backgroundColor: colors.success + '20' }]}>
                                            <Text style={[styles.successText, { color: colors.success }]}>✓ Success</Text>
                                        </View>
                                    </View>
                                    <TouchableOpacity onPress={() => setSelectedTx(null)} style={styles.closeBtn}>
                                        <Ionicons name="close" size={22} color={colors.text} />
                                    </TouchableOpacity>
                                </View>

                                <ScrollView contentContainerStyle={styles.modalBody} showsVerticalScrollIndicator={false}>
                                    {/* Cashier Info */}
                                    <View style={[styles.infoRow, { backgroundColor: colors.background, borderColor: colors.border }]}>
                                        <View style={styles.infoItem}>
                                            <Text style={[styles.infoLabel, { color: colors.textMuted }]}>Cashier</Text>
                                            <Text style={[styles.infoValue, { color: colors.text }]}>{selectedTx.cashierName || 'Unknown'}</Text>
                                        </View>
                                        <View style={[styles.infoSep, { backgroundColor: colors.border }]} />
                                        <View style={styles.infoItem}>
                                            <Text style={[styles.infoLabel, { color: colors.textMuted }]}>Items</Text>
                                            <Text style={[styles.infoValue, { color: colors.text }]}>{selectedTx.items.length}</Text>
                                        </View>
                                        {selectedTx.customerPhone ? (
                                            <>
                                                <View style={[styles.infoSep, { backgroundColor: colors.border }]} />
                                                <View style={styles.infoItem}>
                                                    <Text style={[styles.infoLabel, { color: colors.textMuted }]}>Customer</Text>
                                                    <Text style={[styles.infoValue, { color: colors.text }]}>{selectedTx.customerPhone}</Text>
                                                </View>
                                            </>
                                        ) : null}
                                    </View>

                                    {/* Items List */}
                                    <Text style={[styles.sectionTitle, { color: colors.text }]}>Purchased Items</Text>
                                    <View style={[styles.itemsCard, { backgroundColor: colors.background, borderColor: colors.border }]}>
                                        {selectedTx.items.map((prod, idx) => (
                                            <View
                                                key={idx}
                                                style={[
                                                    styles.itemRow,
                                                    idx < selectedTx.items.length - 1 && { borderBottomColor: colors.border, borderBottomWidth: 0.5 }
                                                ]}
                                            >
                                                <View style={[styles.itemIndexBadge, { backgroundColor: colors.tint + '15' }]}>
                                                    <Text style={[styles.itemIndexText, { color: colors.tint }]}>{idx + 1}</Text>
                                                </View>
                                                <View style={{ flex: 1 }}>
                                                    <Text style={[styles.itemName, { color: colors.text }]}>{prod.productName}</Text>
                                                    <Text style={[styles.itemMeta, { color: colors.textMuted }]}>
                                                        Rs.{prod.price.toFixed(2)} × {prod.qty}  •  GST {prod.gstRate}%
                                                    </Text>
                                                </View>
                                                <Text style={[styles.itemAmt, { color: colors.text }]}>Rs.{prod.total.toFixed(2)}</Text>
                                            </View>
                                        ))}
                                    </View>

                                    {/* Price Breakdown */}
                                    <Text style={[styles.sectionTitle, { color: colors.text }]}>Price Breakdown</Text>
                                    <View style={[styles.breakdownCard, { backgroundColor: colors.background, borderColor: colors.border }]}>
                                        {/* Subtotal */}
                                        <View style={styles.breakdownRow}>
                                            <Text style={[styles.breakdownLabel, { color: colors.textSecondary }]}>Subtotal</Text>
                                            <Text style={[styles.breakdownValue, { color: colors.text }]}>Rs.{selectedTx.subtotal.toFixed(2)}</Text>
                                        </View>

                                        {/* Discount */}
                                        <View style={styles.breakdownRow}>
                                            <View style={styles.breakdownLabelRow}>
                                                <Ionicons name="pricetag-outline" size={13} color={colors.danger} />
                                                <Text style={[styles.breakdownLabel, { color: colors.textSecondary }]}>Discount</Text>
                                            </View>
                                            <Text style={[styles.breakdownValue, { color: selectedTx.discount > 0 ? colors.danger : colors.textSecondary }]}>
                                                {selectedTx.discount > 0 ? `- Rs.${selectedTx.discount.toFixed(2)}` : 'Rs.0.00'}
                                            </Text>
                                        </View>

                                        {/* GST */}
                                        <View style={styles.breakdownRow}>
                                            <View style={styles.breakdownLabelRow}>
                                                <Ionicons name="receipt-outline" size={13} color={colors.tint} />
                                                <Text style={[styles.breakdownLabel, { color: colors.textSecondary }]}>GST / Tax</Text>
                                            </View>
                                            <Text style={[styles.breakdownValue, { color: colors.tint }]}>+ Rs.{selectedTx.gstAmount.toFixed(2)}</Text>
                                        </View>

                                        {/* Divider */}
                                        <View style={[styles.totalDivider, { backgroundColor: colors.border }]} />

                                        {/* Total */}
                                        <View style={styles.totalRow}>
                                            <Text style={[styles.totalLabel, { color: colors.text }]}>Total Amount</Text>
                                            <Text style={[styles.totalAmount, { color: colors.tint }]}>Rs.{selectedTx.total.toFixed(2)}</Text>
                                        </View>
                                    </View>
                                </ScrollView>
                            </>
                        )}
                    </View>
                </View>
            </Modal>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    header: { paddingHorizontal: 20, paddingBottom: 16, paddingTop: 10 },
    title: { fontSize: 24, fontWeight: '700', fontFamily: 'Inter_700Bold' },
    subtitle: { fontSize: 14, marginTop: 4, fontFamily: 'Inter_400Regular' },

    searchContainer: {
        flexDirection: 'row', alignItems: 'center',
        marginHorizontal: 20, marginBottom: 16,
        paddingHorizontal: 12, height: 44,
        borderRadius: 12, borderWidth: 1, gap: 8
    },
    input: { flex: 1, height: '100%', fontFamily: 'Inter_400Regular', fontSize: 14 },
    list: { padding: 20, paddingTop: 0, paddingBottom: 100 },

    // Card
    card: { borderRadius: 16, marginBottom: 12, borderWidth: 1, overflow: 'hidden' },
    cardHeader: { flexDirection: 'row', alignItems: 'flex-start', padding: 14 },
    invoiceRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 3 },
    invoice: { fontFamily: 'Inter_600SemiBold', fontSize: 13, flex: 1 },
    date: { fontFamily: 'Inter_400Regular', fontSize: 11, marginTop: 2 },
    amount: { fontFamily: 'Inter_700Bold', fontSize: 16 },

    payBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 7, paddingVertical: 3, borderRadius: 6 },
    payBadgeText: { fontSize: 10, fontFamily: 'Inter_600SemiBold' },
    successBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6, marginTop: 4 },
    successText: { fontSize: 10, fontFamily: 'Inter_600SemiBold' },

    itemPreviewList: { paddingHorizontal: 14, paddingVertical: 8, borderTopWidth: 0.5 },
    previewRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 3 },
    previewName: { flex: 1, fontSize: 12, fontFamily: 'Inter_400Regular' },
    previewQty: { fontSize: 12, fontFamily: 'Inter_500Medium', marginHorizontal: 8 },
    previewPrice: { fontSize: 12, fontFamily: 'Inter_600SemiBold', minWidth: 50, textAlign: 'right' },
    moreItems: { fontSize: 11, fontFamily: 'Inter_600SemiBold', marginTop: 4 },

    cardFooter: {
        flexDirection: 'row', justifyContent: 'space-between',
        paddingHorizontal: 14, paddingVertical: 10, borderTopWidth: 0.5
    },
    footerItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
    footerText: { fontSize: 11, fontFamily: 'Inter_400Regular' },
    footerTextBlue: { fontSize: 11, fontFamily: 'Inter_600SemiBold' },

    empty: { alignItems: 'center', marginTop: 60, gap: 12 },
    emptyText: { fontFamily: 'Inter_500Medium' },

    // Modal
    modalOverlay: { flex: 1, justifyContent: 'flex-end' },
    modalBackdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.55)' },
    modalSheet: {
        borderTopLeftRadius: 24, borderTopRightRadius: 24,
        paddingBottom: 34, maxHeight: '90%'
    },
    handle: { width: 40, height: 4, borderRadius: 2, alignSelf: 'center', marginTop: 12, marginBottom: 4 },

    modalHeader: {
        flexDirection: 'row', alignItems: 'flex-start',
        paddingHorizontal: 20, paddingVertical: 14,
        borderBottomWidth: 1, gap: 12
    },
    modalTitle: { fontSize: 15, fontFamily: 'Inter_700Bold' },
    modalDate: { fontSize: 12, fontFamily: 'Inter_400Regular', marginTop: 2 },
    closeBtn: { padding: 4, marginLeft: 8 },

    modalBody: { padding: 20, gap: 12 },

    // Info Row
    infoRow: {
        flexDirection: 'row', borderRadius: 12, borderWidth: 1, overflow: 'hidden'
    },
    infoItem: { flex: 1, padding: 12, alignItems: 'center' },
    infoLabel: { fontSize: 11, fontFamily: 'Inter_400Regular', marginBottom: 4 },
    infoValue: { fontSize: 14, fontFamily: 'Inter_600SemiBold' },
    infoSep: { width: 1 },

    sectionTitle: { fontSize: 13, fontFamily: 'Inter_700Bold', marginTop: 4 },

    // Items Card
    itemsCard: { borderRadius: 12, borderWidth: 1, overflow: 'hidden' },
    itemRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 10, paddingHorizontal: 14 },
    itemIndexBadge: { width: 24, height: 24, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
    itemIndexText: { fontSize: 11, fontFamily: 'Inter_700Bold' },
    itemName: { fontSize: 13, fontFamily: 'Inter_600SemiBold' },
    itemMeta: { fontSize: 11, fontFamily: 'Inter_400Regular', marginTop: 2 },
    itemAmt: { fontSize: 14, fontFamily: 'Inter_700Bold' },

    // Breakdown Card
    breakdownCard: { borderRadius: 12, borderWidth: 1, padding: 14, gap: 10 },
    breakdownRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    breakdownLabelRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    breakdownLabel: { fontSize: 13, fontFamily: 'Inter_400Regular' },
    breakdownValue: { fontSize: 13, fontFamily: 'Inter_500Medium' },
    totalDivider: { height: 1, marginVertical: 4 },
    totalRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    totalLabel: { fontSize: 15, fontFamily: 'Inter_700Bold' },
    totalAmount: { fontSize: 20, fontFamily: 'Inter_700Bold' },
});
