import React, { useState, useCallback, useMemo } from 'react';
import {
  View, Text, ScrollView, StyleSheet, Pressable, Platform,
  TextInput, FlatList, Modal, Alert, Dimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useQuery, useMutation } from '@tanstack/react-query';
import * as Haptics from 'expo-haptics';
import { useTheme } from '@/lib/theme-context';
import { useAuth } from '@/lib/auth-context';
import { apiRequest, queryClient } from '@/lib/query-client';
import type { Product, CartItem } from '@/lib/types';

const CATEGORIES = ['All', 'Groceries', 'Dairy', 'Household', 'Personal Care', 'Beverages', 'Snacks', 'Frozen Foods'];

export default function POSScreen() {
  const { colors } = useTheme();
  const { user } = useAuth();
  const insets = useSafeAreaInsets();
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [showCart, setShowCart] = useState(false);
  const [showReceipt, setShowReceipt] = useState(false);
  const [lastReceipt, setLastReceipt] = useState<any>(null);
  const [paymentMethod, setPaymentMethod] = useState<'Cash' | 'Card' | 'UPI'>('Cash');
  const [customerPhone, setCustomerPhone] = useState('');
  const [discount, setDiscount] = useState('');

  const productsQuery = useQuery<Product[]>({ queryKey: ['/api/products'] });
  const products = productsQuery.data || [];

  const filtered = useMemo(() => {
    let list = products.filter(p => p.stock > 0);
    if (selectedCategory !== 'All') list = list.filter(p => p.category === selectedCategory);
    if (search) list = list.filter(p => p.name.toLowerCase().includes(search.toLowerCase()) || p.barcode.includes(search));
    return list;
  }, [products, selectedCategory, search]);

  const addToCart = useCallback((product: Product) => {
    if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setCart(prev => {
      const existing = prev.find(c => c.product.id === product.id);
      if (existing) {
        if (existing.qty >= product.stock) return prev;
        return prev.map(c => c.product.id === product.id ? { ...c, qty: c.qty + 1 } : c);
      }
      return [...prev, { product, qty: 1 }];
    });
  }, []);

  const updateQty = useCallback((productId: string, delta: number) => {
    setCart(prev => {
      return prev.map(c => {
        if (c.product.id !== productId) return c;
        const newQty = c.qty + delta;
        if (newQty <= 0) return null as any;
        if (newQty > c.product.stock) return c;
        return { ...c, qty: newQty };
      }).filter(Boolean);
    });
  }, []);

  const removeFromCart = useCallback((productId: string) => {
    setCart(prev => prev.filter(c => c.product.id !== productId));
  }, []);

  const clearCart = useCallback(() => setCart([]), []);

  const subtotal = cart.reduce((s, c) => s + c.product.sellingPrice * c.qty, 0);
  const gstAmount = cart.reduce((s, c) => s + (c.product.sellingPrice * c.qty * c.product.gstRate / 100), 0);
  const discountAmount = Number(discount) || 0;
  const total = subtotal - discountAmount + gstAmount;

  const checkoutMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest('POST', '/api/transactions', {
        items: cart.map(c => ({ productId: c.product.id, qty: c.qty })),
        paymentMethod, customerPhone, discount: discountAmount,
        // Only send ID if the user is actually a CASHIER. 
        // Otherwise send empty string so the server randomizes between Priya/Sneha.
        cashierId: user?.role === 'CASHIER' ? user.id : '',
        cashierName: user?.role === 'CASHIER' ? user.name : '',
      });
      return res.json();
    },
    onSuccess: (data) => {
      setLastReceipt(data);
      setShowCart(false);
      setShowReceipt(true);
      setCart([]);
      setDiscount('');
      setCustomerPhone('');
      queryClient.invalidateQueries({ queryKey: ['/api/products'] });
      queryClient.invalidateQueries({ queryKey: ['/api/dashboard/stats'] });
      queryClient.invalidateQueries({ queryKey: ['/api/transactions'] });
      if (Platform.OS !== 'web') Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    },
    onError: (e: any) => {
      Alert.alert('Error', e.message || 'Checkout failed');
    },
  });

  const cartCount = cart.reduce((s, c) => s + c.qty, 0);

  const renderProductCard = ({ item: p }: { item: Product }) => {
    const inCart = cart.find(c => c.product.id === p.id);
    return (
      <Pressable onPress={() => addToCart(p)} style={[styles.productCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={styles.productTop}>
          <View style={[styles.stockTag, { backgroundColor: p.stock <= p.minStock ? colors.danger + '15' : colors.success + '15' }]}>
            <Text style={[styles.stockTagText, { color: p.stock <= p.minStock ? colors.danger : colors.success, fontFamily: 'Inter_600SemiBold' }]}>{p.stock} left</Text>
          </View>
          {!!inCart && (
            <View style={[styles.cartQtyBadge, { backgroundColor: colors.tint }]}>
              <Text style={[styles.cartQtyBadgeText, { fontFamily: 'Inter_700Bold' }]}>{inCart.qty}</Text>
            </View>
          )}
        </View>
        <Text style={[styles.productName, { color: colors.text, fontFamily: 'Inter_600SemiBold' }]} numberOfLines={2}>{p.name}</Text>
        <Text style={[styles.productCategory, { color: colors.textMuted, fontFamily: 'Inter_400Regular' }]}>{p.category}</Text>
        <View style={styles.productBottom}>
          <Text style={[styles.productPrice, { color: colors.tint, fontFamily: 'Inter_700Bold' }]}>Rs.{p.sellingPrice}</Text>
          <Text style={[styles.productGst, { color: colors.textMuted, fontFamily: 'Inter_400Regular' }]}>GST {p.gstRate}%</Text>
        </View>
      </Pressable>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { paddingTop: insets.top + (Platform.OS === 'web' ? 67 : 8) }]}>
        <Text style={[styles.headerTitle, { color: colors.text, fontFamily: 'Inter_700Bold' }]}>Point of Sale</Text>
        <View style={styles.headerActions}>
          {cart.length > 0 && (
            <Pressable onPress={clearCart} style={[styles.clearBtn, { borderColor: colors.danger + '40' }]}>
              <Text style={[styles.clearBtnText, { color: colors.danger, fontFamily: 'Inter_500Medium' }]}>Clear</Text>
            </Pressable>
          )}
        </View>
      </View>

      <View style={[styles.searchRow, { backgroundColor: colors.inputBg, marginHorizontal: 16, borderColor: colors.border }]}>
        <Ionicons name="search" size={18} color={colors.textMuted} />
        <TextInput
          style={[styles.searchInput, { color: colors.text, fontFamily: 'Inter_400Regular' }]}
          placeholder="Search product or barcode..."
          placeholderTextColor={colors.textMuted}
          value={search}
          onChangeText={setSearch}
        />
      </View>

      <View style={styles.catContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.catRow}>
          {CATEGORIES.map(cat => (
            <Pressable
              key={cat}
              onPress={() => setSelectedCategory(cat)}
              style={[styles.catPill, { backgroundColor: selectedCategory === cat ? colors.tint : colors.card, borderColor: colors.border }]}
            >
              <Text style={[styles.catPillText, { color: selectedCategory === cat ? '#fff' : colors.textSecondary, fontFamily: 'Inter_500Medium' }]}>{cat}</Text>
            </Pressable>
          ))}
        </ScrollView>
      </View>

      <FlatList
        data={filtered}
        renderItem={renderProductCard}
        keyExtractor={p => p.id}
        numColumns={2}
        columnWrapperStyle={styles.productRow}
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 120 }}
        showsVerticalScrollIndicator={false}
        scrollEnabled={filtered.length > 0}
      />

      {cartCount > 0 && (
        <Pressable
          onPress={() => setShowCart(true)}
          style={[styles.fab, { backgroundColor: colors.tint, bottom: insets.bottom + (Platform.OS === 'web' ? 84 : 80) }]}
        >
          <Ionicons name="cart" size={22} color="#fff" />
          <Text style={[styles.fabText, { fontFamily: 'Inter_600SemiBold' }]}>Cart ({cartCount}) - Rs.{Math.round(total)}</Text>
        </Pressable>
      )}

      <Modal visible={showCart} animationType="slide" transparent>
        <View style={[styles.modalOverlay, { backgroundColor: colors.overlay }]}>
          <View style={[styles.cartSheet, { backgroundColor: colors.background, paddingBottom: insets.bottom + 16 }]}>
            <View style={[styles.cartHeader, { borderBottomColor: colors.border }]}>
              <Text style={[styles.cartTitle, { color: colors.text, fontFamily: 'Inter_700Bold' }]}>Cart ({cartCount})</Text>
              <Pressable onPress={() => setShowCart(false)}>
                <Ionicons name="close" size={24} color={colors.text} />
              </Pressable>
            </View>

            <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 16 }}>
              {cart.map(c => (
                <View key={c.product.id} style={[styles.cartItem, { borderColor: colors.border }]}>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.cartItemName, { color: colors.text, fontFamily: 'Inter_600SemiBold' }]} numberOfLines={1}>{c.product.name}</Text>
                    <Text style={[styles.cartItemPrice, { color: colors.textMuted, fontFamily: 'Inter_400Regular' }]}>Rs.{c.product.sellingPrice} x {c.qty}</Text>
                  </View>
                  <View style={styles.qtyControls}>
                    <Pressable onPress={() => updateQty(c.product.id, -1)} style={[styles.qtyBtn, { borderColor: colors.border }]}>
                      <Ionicons name="remove" size={16} color={colors.text} />
                    </Pressable>
                    <Text style={[styles.qtyText, { color: colors.text, fontFamily: 'Inter_600SemiBold' }]}>{c.qty}</Text>
                    <Pressable onPress={() => updateQty(c.product.id, 1)} style={[styles.qtyBtn, { borderColor: colors.border }]}>
                      <Ionicons name="add" size={16} color={colors.text} />
                    </Pressable>
                  </View>
                  <Text style={[styles.cartItemTotal, { color: colors.tint, fontFamily: 'Inter_700Bold' }]}>Rs.{c.product.sellingPrice * c.qty}</Text>
                  <Pressable onPress={() => removeFromCart(c.product.id)}>
                    <Ionicons name="trash-outline" size={18} color={colors.danger} />
                  </Pressable>
                </View>
              ))}

              <View style={[styles.summarySection, { borderTopColor: colors.border }]}>
                <View style={styles.summaryRow}>
                  <Text style={[styles.summaryLabel, { color: colors.textSecondary, fontFamily: 'Inter_400Regular' }]}>Subtotal</Text>
                  <Text style={[styles.summaryValue, { color: colors.text, fontFamily: 'Inter_500Medium' }]}>Rs.{subtotal.toFixed(2)}</Text>
                </View>
                <View style={styles.summaryRow}>
                  <Text style={[styles.summaryLabel, { color: colors.warning, fontFamily: 'Inter_500Medium' }]}>Discount</Text>
                  <TextInput
                    style={[styles.discountInput, { color: colors.warning, borderColor: colors.border, fontFamily: 'Inter_500Medium' }]}
                    placeholder="0"
                    placeholderTextColor={colors.textMuted}
                    value={discount}
                    onChangeText={setDiscount}
                    keyboardType="numeric"
                  />
                </View>
                <View style={styles.summaryRow}>
                  <Text style={[styles.summaryLabel, { color: colors.textSecondary, fontFamily: 'Inter_400Regular' }]}>GST/Tax</Text>
                  <Text style={[styles.summaryValue, { color: colors.success, fontFamily: 'Inter_500Medium' }]}>+Rs.{gstAmount.toFixed(2)}</Text>
                </View>
                <View style={[styles.summaryRow, styles.totalRow]}>
                  <Text style={[styles.totalLabel, { color: colors.text, fontFamily: 'Inter_700Bold' }]}>Total</Text>
                  <Text style={[styles.totalValue, { color: colors.text, fontFamily: 'Inter_700Bold' }]}>Rs.{total.toFixed(2)}</Text>
                </View>
              </View>

              <TextInput
                style={[styles.phoneInput, { color: colors.text, borderColor: colors.border, backgroundColor: colors.inputBg, fontFamily: 'Inter_400Regular' }]}
                placeholder="Customer phone (optional)"
                placeholderTextColor={colors.textMuted}
                value={customerPhone}
                onChangeText={setCustomerPhone}
                keyboardType="phone-pad"
              />

              <View style={styles.paymentMethods}>
                {(['Cash', 'Card', 'UPI'] as const).map(m => (
                  <Pressable
                    key={m}
                    onPress={() => setPaymentMethod(m)}
                    style={[styles.pmBtn, { backgroundColor: paymentMethod === m ? colors.tint : colors.card, borderColor: paymentMethod === m ? colors.tint : colors.border }]}
                  >
                    <Ionicons name={m === 'Cash' ? 'cash-outline' : m === 'Card' ? 'card-outline' : 'phone-portrait-outline'} size={16} color={paymentMethod === m ? '#fff' : colors.textSecondary} />
                    <Text style={[styles.pmBtnText, { color: paymentMethod === m ? '#fff' : colors.textSecondary, fontFamily: 'Inter_500Medium' }]}>{m}</Text>
                  </Pressable>
                ))}
              </View>
            </ScrollView>

            <Pressable
              onPress={() => checkoutMutation.mutate()}
              disabled={checkoutMutation.isPending}
              style={[styles.checkoutBtn, { backgroundColor: colors.success, opacity: checkoutMutation.isPending ? 0.6 : 1, marginHorizontal: 16 }]}
            >
              <Ionicons name="checkmark-circle" size={22} color="#fff" />
              <Text style={[styles.checkoutBtnText, { fontFamily: 'Inter_600SemiBold' }]}>
                {checkoutMutation.isPending ? 'Processing...' : `Checkout - Rs.${total.toFixed(2)}`}
              </Text>
            </Pressable>
          </View>
        </View>
      </Modal>

      <Modal visible={showReceipt} animationType="fade" transparent>
        <View style={[styles.modalOverlay, { backgroundColor: colors.overlay }]}>
          <View style={[styles.receiptCard, { backgroundColor: '#fff' }]}>
            <View style={styles.receiptHeader}>
              <Ionicons name="checkmark-circle" size={28} color="#16a34a" />
              <Text style={[styles.receiptTitle, { fontFamily: 'Inter_700Bold' }]}>Payment Successful</Text>
            </View>
            <View style={styles.receiptDivider} />
            <Text style={[styles.receiptStore, { fontFamily: 'Inter_700Bold' }]}>RetailPro Hypermarket</Text>
            <Text style={[styles.receiptAddr, { fontFamily: 'Inter_400Regular' }]}>123 Market Street, Mumbai - 400001</Text>
            {lastReceipt && (
              <>
                <View style={styles.receiptMeta}>
                  <Text style={[styles.receiptMetaText, { fontFamily: 'Inter_400Regular' }]}>Invoice: {lastReceipt.invoiceNo}</Text>
                  <Text style={[styles.receiptMetaText, { fontFamily: 'Inter_400Regular' }]}>{new Date(lastReceipt.createdAt).toLocaleString('en-IN')}</Text>
                </View>
                <View style={styles.receiptDivider} />
                {lastReceipt.items.map((item: any, i: number) => (
                  <View key={i} style={styles.receiptItem}>
                    <Text style={[styles.receiptItemName, { fontFamily: 'Inter_400Regular' }]} numberOfLines={1}>{item.productName}</Text>
                    <Text style={[styles.receiptItemQty, { fontFamily: 'Inter_400Regular' }]}>{item.qty}</Text>
                    <Text style={[styles.receiptItemTotal, { fontFamily: 'Inter_500Medium' }]}>Rs.{item.total}</Text>
                  </View>
                ))}
                <View style={styles.receiptDivider} />
                <View style={styles.receiptSummRow}>
                  <Text style={[styles.receiptSummLabel, { fontFamily: 'Inter_400Regular' }]}>Subtotal</Text>
                  <Text style={[styles.receiptSummVal, { fontFamily: 'Inter_500Medium' }]}>Rs.{lastReceipt.subtotal.toFixed(2)}</Text>
                </View>
                <View style={styles.receiptSummRow}>
                  <Text style={[styles.receiptSummLabel, { fontFamily: 'Inter_400Regular' }]}>GST</Text>
                  <Text style={[styles.receiptSummVal, { fontFamily: 'Inter_500Medium' }]}>+Rs.{lastReceipt.gstAmount.toFixed(2)}</Text>
                </View>
                <View style={[styles.receiptSummRow, { marginTop: 4 }]}>
                  <Text style={[styles.receiptTotal, { fontFamily: 'Inter_700Bold' }]}>Total</Text>
                  <Text style={[styles.receiptTotal, { fontFamily: 'Inter_700Bold' }]}>Rs.{lastReceipt.total.toFixed(2)}</Text>
                </View>
                <Text style={[styles.receiptPayment, { fontFamily: 'Inter_500Medium' }]}>Payment: {lastReceipt.paymentMethod}</Text>
              </>
            )}
            <Pressable onPress={() => setShowReceipt(false)} style={styles.receiptCloseBtn}>
              <Ionicons name="close" size={22} color="#666" />
            </Pressable>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingBottom: 12 },
  headerTitle: { fontSize: 22 },
  headerActions: { flexDirection: 'row', gap: 8 },
  clearBtn: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8, borderWidth: 1 },
  clearBtnText: { fontSize: 13 },
  searchRow: { flexDirection: 'row', alignItems: 'center', borderRadius: 12, paddingHorizontal: 14, height: 44, gap: 8, borderWidth: 1, marginBottom: 12 },
  searchInput: { flex: 1, fontSize: 14, height: '100%' },
  catContainer: { marginBottom: 16, zIndex: 10, position: 'relative' },
  catRow: { paddingHorizontal: 16, gap: 8 },
  catPill: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, borderWidth: 1, minWidth: 70, alignItems: 'center', justifyContent: 'center' },
  catPillText: { fontSize: 13, textAlign: 'center' },
  productRow: { gap: 10, marginBottom: 10 },
  productCard: { flex: 1, borderRadius: 14, padding: 12, borderWidth: 1 },
  productTop: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  stockTag: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6 },
  stockTagText: { fontSize: 10 },
  cartQtyBadge: { width: 22, height: 22, borderRadius: 11, alignItems: 'center', justifyContent: 'center' },
  cartQtyBadgeText: { fontSize: 11, color: '#fff' },
  productName: { fontSize: 13, marginBottom: 2, minHeight: 34 },
  productCategory: { fontSize: 11, marginBottom: 6 },
  productBottom: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  productPrice: { fontSize: 16 },
  productGst: { fontSize: 10 },
  fab: { position: 'absolute', left: 16, right: 16, height: 52, borderRadius: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, elevation: 8, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8 },
  fabText: { fontSize: 15, color: '#fff' },
  modalOverlay: { flex: 1, justifyContent: 'flex-end' },
  cartSheet: { height: '85%', borderTopLeftRadius: 24, borderTopRightRadius: 24 },
  cartHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 16, borderBottomWidth: 1 },
  cartTitle: { fontSize: 18 },
  cartItem: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 12, borderBottomWidth: 0.5 },
  cartItemName: { fontSize: 14 },
  cartItemPrice: { fontSize: 12, marginTop: 2 },
  qtyControls: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  qtyBtn: { width: 30, height: 30, borderRadius: 8, alignItems: 'center', justifyContent: 'center', borderWidth: 1 },
  qtyText: { fontSize: 15, minWidth: 20, textAlign: 'center' },
  cartItemTotal: { fontSize: 14, minWidth: 60, textAlign: 'right' },
  summarySection: { marginTop: 16, paddingTop: 16, borderTopWidth: 1 },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  summaryLabel: { fontSize: 14 },
  summaryValue: { fontSize: 14 },
  discountInput: { fontSize: 14, borderWidth: 1, borderRadius: 8, paddingHorizontal: 12, paddingVertical: 4, width: 80, textAlign: 'right' },
  totalRow: { marginTop: 8, paddingTop: 12, borderTopWidth: 1 },
  totalLabel: { fontSize: 18 },
  totalValue: { fontSize: 18 },
  phoneInput: { borderWidth: 1, borderRadius: 12, paddingHorizontal: 14, height: 44, marginTop: 16, fontSize: 14 },
  paymentMethods: { flexDirection: 'row', gap: 10, marginTop: 16, marginBottom: 16 },
  pmBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 12, borderRadius: 12, borderWidth: 1 },
  pmBtnText: { fontSize: 13 },
  checkoutBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', height: 52, borderRadius: 14, gap: 8 },
  checkoutBtnText: { fontSize: 16, color: '#fff' },
  receiptCard: { margin: 20, borderRadius: 16, padding: 24, maxHeight: '80%' },
  receiptHeader: { alignItems: 'center', gap: 8, marginBottom: 12 },
  receiptTitle: { fontSize: 18, color: '#16a34a' },
  receiptDivider: { height: 1, backgroundColor: '#e5e7eb', marginVertical: 12 },
  receiptStore: { fontSize: 16, color: '#111', textAlign: 'center' },
  receiptAddr: { fontSize: 11, color: '#666', textAlign: 'center', marginTop: 2 },
  receiptMeta: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 12 },
  receiptMetaText: { fontSize: 11, color: '#666' },
  receiptItem: { flexDirection: 'row', alignItems: 'center', marginBottom: 6 },
  receiptItemName: { flex: 1, fontSize: 13, color: '#333' },
  receiptItemQty: { width: 30, fontSize: 13, color: '#666', textAlign: 'center' },
  receiptItemTotal: { width: 70, fontSize: 13, color: '#111', textAlign: 'right' },
  receiptSummRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
  receiptSummLabel: { fontSize: 13, color: '#666' },
  receiptSummVal: { fontSize: 13, color: '#333' },
  receiptTotal: { fontSize: 18, color: '#111' },
  receiptPayment: { textAlign: 'center', color: '#2563eb', marginTop: 12, fontSize: 13 },
  receiptCloseBtn: { position: 'absolute', top: 12, right: 12, width: 32, height: 32, borderRadius: 16, backgroundColor: '#f3f4f6', alignItems: 'center', justifyContent: 'center' },
});
