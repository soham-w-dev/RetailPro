import React, { useState, useMemo, useCallback } from 'react';
import {
  View, Text, ScrollView, StyleSheet, Pressable, Platform,
  TextInput, FlatList, Modal, Alert, Animated,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useQuery, useMutation } from '@tanstack/react-query';
import * as Haptics from 'expo-haptics';
import { useTheme } from '@/lib/theme-context';
import { apiRequest, queryClient } from '@/lib/query-client';
import type { Product } from '@/lib/types';

const CATEGORIES = ['All', 'Groceries', 'Dairy', 'Household', 'Personal Care', 'Beverages', 'Snacks', 'Frozen Foods'];
const STOCK_FILTERS = ['All Stock', 'Low Stock', 'Out of Stock', 'In Stock'];

const MONTH_NAMES = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const DAY_LABELS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

// Parses 'YYYY-MM-DD' safely
function parseLocalDate(str: string): Date | null {
  if (!str || !/^\d{4}-\d{2}-\d{2}$/.test(str)) return null;
  const [y, m, d] = str.split('-').map(Number);
  return new Date(y, m - 1, d);
}

function formatDateStr(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

interface DatePickerFieldProps {
  label: string;
  value: string; // 'YYYY-MM-DD' or ''
  onChange: (val: string) => void;
  colors: any;
}

function DatePickerField({ label, value, onChange, colors }: DatePickerFieldProps) {
  const [open, setOpen] = useState(false);
  const parsed = parseLocalDate(value);
  const today = new Date();

  const [viewYear, setViewYear] = useState(parsed ? parsed.getFullYear() : today.getFullYear());
  const [viewMonth, setViewMonth] = useState(parsed ? parsed.getMonth() : today.getMonth());

  const openCalendar = useCallback(() => {
    const d = parseLocalDate(value);
    if (d) { setViewYear(d.getFullYear()); setViewMonth(d.getMonth()); }
    else { setViewYear(today.getFullYear()); setViewMonth(today.getMonth()); }
    setOpen(true);
  }, [value]);

  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  const firstWeekday = new Date(viewYear, viewMonth, 1).getDay();
  const cells: (number | null)[] = [
    ...Array(firstWeekday).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];
  // Pad to full rows
  while (cells.length % 7 !== 0) cells.push(null);

  const prevMonth = () => {
    if (viewMonth === 0) { setViewMonth(11); setViewYear(y => y - 1); }
    else setViewMonth(m => m - 1);
  };
  const nextMonth = () => {
    if (viewMonth === 11) { setViewMonth(0); setViewYear(y => y + 1); }
    else setViewMonth(m => m + 1);
  };

  const selectDay = (day: number) => {
    const selected = new Date(viewYear, viewMonth, day);
    onChange(formatDateStr(selected));
    setOpen(false);
  };

  const isSelected = (day: number) => {
    if (!parsed) return false;
    return parsed.getFullYear() === viewYear && parsed.getMonth() === viewMonth && parsed.getDate() === day;
  };

  const isToday = (day: number) =>
    today.getFullYear() === viewYear && today.getMonth() === viewMonth && today.getDate() === day;

  const displayValue = parsed
    ? `${String(parsed.getDate()).padStart(2, '0')} ${MONTH_NAMES[parsed.getMonth()].slice(0, 3)} ${parsed.getFullYear()}`
    : 'Select date';

  return (
    <View style={{ marginBottom: 0 }}>
      <Pressable
        onPress={openCalendar}
        style={[calStyles.dateBtn, { borderColor: colors.border, backgroundColor: colors.inputBg }]}
      >
        <Ionicons name="calendar-outline" size={16} color={parsed ? colors.tint : colors.textMuted} />
        <Text style={[calStyles.dateBtnText, { color: parsed ? colors.text : colors.textMuted }]}>
          {displayValue}
        </Text>
        {parsed && (
          <Pressable onPress={() => { onChange(''); }} hitSlop={8}>
            <Ionicons name="close-circle" size={15} color={colors.textMuted} />
          </Pressable>
        )}
      </Pressable>

      <Modal visible={open} transparent animationType="fade">
        <Pressable style={calStyles.calOverlay} onPress={() => setOpen(false)}>
          <Pressable
            onPress={e => e.stopPropagation()}
            style={[calStyles.calCard, { backgroundColor: colors.card, borderColor: colors.border }]}
          >
            {/* Month navigation */}
            <View style={calStyles.calHeader}>
              <Pressable onPress={prevMonth} style={calStyles.calNavBtn}>
                <Ionicons name="chevron-back" size={20} color={colors.text} />
              </Pressable>
              <Text style={[calStyles.calMonthLabel, { color: colors.text, fontFamily: 'Inter_600SemiBold' }]}>
                {MONTH_NAMES[viewMonth]} {viewYear}
              </Text>
              <Pressable onPress={nextMonth} style={calStyles.calNavBtn}>
                <Ionicons name="chevron-forward" size={20} color={colors.text} />
              </Pressable>
            </View>

            {/* Day labels */}
            <View style={calStyles.calDayRow}>
              {DAY_LABELS.map(d => (
                <Text key={d} style={[calStyles.calDayLabel, { color: colors.textMuted, fontFamily: 'Inter_500Medium' }]}>{d}</Text>
              ))}
            </View>

            {/* Day grid */}
            <View style={calStyles.calGrid}>
              {cells.map((day, idx) => (
                <View key={idx} style={calStyles.calCell}>
                  {day !== null && (
                    <Pressable
                      onPress={() => selectDay(day)}
                      style={[
                        calStyles.calDayBtn,
                        isSelected(day) && { backgroundColor: colors.tint },
                        !isSelected(day) && isToday(day) && { borderWidth: 1.5, borderColor: colors.tint },
                      ]}
                    >
                      <Text style={[
                        calStyles.calDayText,
                        { color: isSelected(day) ? '#fff' : isToday(day) ? colors.tint : colors.text },
                        { fontFamily: isSelected(day) ? 'Inter_700Bold' : 'Inter_400Regular' },
                      ]}>
                        {day}
                      </Text>
                    </Pressable>
                  )}
                </View>
              ))}
            </View>

            {/* Footer */}
            <Pressable
              onPress={() => setOpen(false)}
              style={[calStyles.calCloseBtn, { borderTopColor: colors.border }]}
            >
              <Text style={[calStyles.calCloseBtnText, { color: colors.textSecondary, fontFamily: 'Inter_500Medium' }]}>Close</Text>
            </Pressable>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

export default function InventoryScreen() {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [stockFilter, setStockFilter] = useState('All Stock');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [editMode, setEditMode] = useState(false);
  const [editData, setEditData] = useState<Partial<Product>>({});

  const [newProduct, setNewProduct] = useState({
    name: '', barcode: '', category: 'Groceries', sellingPrice: '', costPrice: '',
    stock: '', minStock: '', unit: 'pcs', gstRate: '5', manufacturingDate: '', expiryDate: '',
    supplier: '', batchNo: '', section: '',
  });

  const productsQuery = useQuery<Product[]>({ queryKey: ['/api/products'] });
  const products = productsQuery.data || [];

  const filtered = useMemo(() => {
    let list = [...products];
    if (selectedCategory !== 'All') list = list.filter(p => p.category === selectedCategory);
    if (stockFilter === 'Low Stock') list = list.filter(p => p.stock > 0 && p.stock <= p.minStock);
    else if (stockFilter === 'Out of Stock') list = list.filter(p => p.stock === 0);
    else if (stockFilter === 'In Stock') list = list.filter(p => p.stock > p.minStock);
    if (search) list = list.filter(p => p.name.toLowerCase().includes(search.toLowerCase()) || p.barcode.includes(search));
    return list;
  }, [products, selectedCategory, stockFilter, search]);

  const totalProducts = products.length;
  const lowStockCount = products.filter(p => p.stock > 0 && p.stock <= p.minStock).length;
  const outOfStock = products.filter(p => p.stock === 0).length;
  const inventoryValue = products.reduce((s, p) => s + p.costPrice * p.stock, 0);

  const addMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest('POST', '/api/products', {
        ...newProduct, sellingPrice: Number(newProduct.sellingPrice), costPrice: Number(newProduct.costPrice),
        stock: Number(newProduct.stock), minStock: Number(newProduct.minStock), gstRate: Number(newProduct.gstRate),
      });
      return res.json();
    },
    onSuccess: () => {
      setShowAddModal(false);
      setNewProduct({ name: '', barcode: '', category: 'Groceries', sellingPrice: '', costPrice: '', stock: '', minStock: '', unit: 'pcs', gstRate: '5', manufacturingDate: '', expiryDate: '', supplier: '', batchNo: '', section: '' });
      queryClient.invalidateQueries({ queryKey: ['/api/products'] });
      if (Platform.OS !== 'web') Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    },
    onError: (e: any) => Alert.alert('Error', e.message || 'Failed to add product'),
  });

  const restockMutation = useMutation({
    mutationFn: async ({ id, qty }: { id: string; qty: number }) => {
      const res = await apiRequest('POST', `/api/products/${id}/restock`, { qty });
      return res.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['/api/products'] });
      if (selectedProduct) setSelectedProduct(data);
      if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    },
  });

  const updateMutation = useMutation({
    mutationFn: async () => {
      if (!selectedProduct) return;
      const res = await apiRequest('PUT', `/api/products/${selectedProduct.id}`, editData);
      return res.json();
    },
    onSuccess: (data) => {
      setSelectedProduct(data);
      setEditMode(false);
      queryClient.invalidateQueries({ queryKey: ['/api/products'] });
    },
    onError: (e: any) => Alert.alert('Error', e.message || 'Failed to update'),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest('DELETE', `/api/products/${id}`);
    },
    onSuccess: () => {
      setShowDetailModal(false);
      setSelectedProduct(null);
      queryClient.invalidateQueries({ queryKey: ['/api/products'] });
    },
  });

  const getExpiryColor = (date: string) => {
    if (!date) return colors.textMuted;
    const days = Math.ceil((new Date(date).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
    if (days <= 7) return colors.danger;
    if (days <= 30) return colors.warning;
    return colors.success;
  };

  const getStockColor = (p: Product) => {
    if (p.stock === 0) return colors.danger;
    if (p.stock <= p.minStock) return colors.warning;
    return colors.success;
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { paddingTop: insets.top + (Platform.OS === 'web' ? 67 : 8) }]}>
        <View>
          <Text style={[styles.headerTitle, { color: colors.text, fontFamily: 'Inter_700Bold' }]}>Inventory</Text>
          <Text style={[styles.headerSub, { color: colors.textSecondary, fontFamily: 'Inter_400Regular' }]}>Manage products & stock levels</Text>
        </View>
        <Pressable onPress={() => setShowAddModal(true)} style={[styles.addBtn, { backgroundColor: colors.tint }]}>
          <Ionicons name="add" size={20} color="#fff" />
          <Text style={[styles.addBtnText, { fontFamily: 'Inter_600SemiBold' }]}>Add</Text>
        </Pressable>
      </View>

      <View style={styles.statsGrid}>
        <View style={[styles.miniStat, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <MaterialCommunityIcons name="package-variant" size={20} color={colors.tint} />
          <Text style={[styles.miniStatValue, { color: colors.text, fontFamily: 'Inter_700Bold' }]}>{totalProducts}</Text>
          <Text style={[styles.miniStatLabel, { color: colors.textMuted, fontFamily: 'Inter_400Regular' }]}>Total</Text>
        </View>
        <View style={[styles.miniStat, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Ionicons name="warning" size={20} color={colors.warning} />
          <Text style={[styles.miniStatValue, { color: colors.warning, fontFamily: 'Inter_700Bold' }]}>{lowStockCount}</Text>
          <Text style={[styles.miniStatLabel, { color: colors.textMuted, fontFamily: 'Inter_400Regular' }]}>Low Stock</Text>
        </View>
        <View style={[styles.miniStat, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Ionicons name="close-circle" size={20} color={colors.danger} />
          <Text style={[styles.miniStatValue, { color: colors.danger, fontFamily: 'Inter_700Bold' }]}>{outOfStock}</Text>
          <Text style={[styles.miniStatLabel, { color: colors.textMuted, fontFamily: 'Inter_400Regular' }]}>Out</Text>
        </View>
        <View style={[styles.miniStat, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <MaterialCommunityIcons name="currency-inr" size={20} color={colors.success} />
          <Text style={[styles.miniStatValue, { color: colors.success, fontFamily: 'Inter_700Bold' }]}>{inventoryValue >= 100000 ? (inventoryValue / 100000).toFixed(1) + 'L' : (inventoryValue / 1000).toFixed(0) + 'K'}</Text>
          <Text style={[styles.miniStatLabel, { color: colors.textMuted, fontFamily: 'Inter_400Regular' }]}>Value</Text>
        </View>
      </View>

      <View style={[styles.searchRow, { backgroundColor: colors.inputBg, marginHorizontal: 16, borderColor: colors.border }]}>
        <Ionicons name="search" size={18} color={colors.textMuted} />
        <TextInput
          style={[styles.searchInput, { color: colors.text, fontFamily: 'Inter_400Regular' }]}
          placeholder="Search by name or barcode..."
          placeholderTextColor={colors.textMuted}
          value={search}
          onChangeText={setSearch}
        />
      </View>

      <View style={styles.filterRow}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterScroll}>
          {CATEGORIES.map(cat => (
            <Pressable key={cat} onPress={() => setSelectedCategory(cat)}
              style={[styles.filterPill, { backgroundColor: selectedCategory === cat ? colors.tint : colors.card, borderColor: colors.border }]}>
              <Text style={[styles.filterPillText, { color: selectedCategory === cat ? '#fff' : colors.textSecondary, fontFamily: 'Inter_500Medium' }]}>{cat}</Text>
            </Pressable>
          ))}
        </ScrollView>
      </View>

      <View style={styles.filterRow}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterScroll}>
          {STOCK_FILTERS.map(f => (
            <Pressable key={f} onPress={() => setStockFilter(f)}
              style={[styles.filterPill, { backgroundColor: stockFilter === f ? colors.accent : colors.card, borderColor: colors.border }]}>
              <Text style={[styles.filterPillText, { color: stockFilter === f ? '#fff' : colors.textSecondary, fontFamily: 'Inter_500Medium' }]}>{f}</Text>
            </Pressable>
          ))}
        </ScrollView>
      </View>

      <FlatList
        data={filtered}
        keyExtractor={p => p.id}
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 100 }}
        showsVerticalScrollIndicator={false}
        scrollEnabled={filtered.length > 0}
        renderItem={({ item: p }) => (
          <Pressable
            onPress={() => { setSelectedProduct(p); setEditData(p); setShowDetailModal(true); setEditMode(false); }}
            style={[styles.productRow, { backgroundColor: colors.card, borderColor: colors.border }]}
          >
            <View style={{ flex: 1 }}>
              <Text style={[styles.productName, { color: colors.text, fontFamily: 'Inter_600SemiBold' }]} numberOfLines={1}>{p.name}</Text>
              <Text style={[styles.productMeta, { color: colors.textMuted, fontFamily: 'Inter_400Regular' }]}>{p.category} | {p.sku}</Text>
            </View>
            <View style={styles.productStats}>
              <Text style={[styles.productPrice, { color: colors.tint, fontFamily: 'Inter_700Bold' }]}>Rs.{p.sellingPrice}</Text>
              <View style={[styles.stockPill, { backgroundColor: getStockColor(p) + '15' }]}>
                <Text style={[styles.stockPillText, { color: getStockColor(p), fontFamily: 'Inter_600SemiBold' }]}>{p.stock}</Text>
              </View>
            </View>
            <View style={[styles.expiryDot, { backgroundColor: getExpiryColor(p.expiryDate) }]} />
          </Pressable>
        )}
      />

      <Modal visible={showAddModal} animationType="slide" transparent>
        <View style={[styles.modalOverlay, { backgroundColor: colors.overlay }]}>
          <View style={[styles.formSheet, { backgroundColor: colors.background, paddingBottom: insets.bottom + 16 }]}>
            <View style={[styles.formHeader, { borderBottomColor: colors.border }]}>
              <Text style={[styles.formTitle, { color: colors.text, fontFamily: 'Inter_700Bold' }]}>Add New Product</Text>
              <Pressable onPress={() => setShowAddModal(false)}>
                <Ionicons name="close" size={24} color={colors.text} />
              </Pressable>
            </View>
            <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 16 }} keyboardShouldPersistTaps="handled">
              {[
                { label: 'Product Name', key: 'name', placeholder: 'Product Name' },
                { label: 'Barcode', key: 'barcode', placeholder: 'Barcode' },
              ].map(f => (
                <View key={f.key} style={styles.formField}>
                  <Text style={[styles.formLabel, { color: colors.textSecondary, fontFamily: 'Inter_500Medium' }]}>{f.label}</Text>
                  <TextInput
                    style={[styles.formInput, { color: colors.text, backgroundColor: colors.inputBg, borderColor: colors.border, fontFamily: 'Inter_400Regular' }]}
                    placeholder={f.placeholder}
                    placeholderTextColor={colors.textMuted}
                    value={(newProduct as any)[f.key]}
                    onChangeText={v => setNewProduct(prev => ({ ...prev, [f.key]: v }))}
                  />
                </View>
              ))}
              <View style={styles.formRow}>
                <View style={[styles.formField, { flex: 1 }]}>
                  <Text style={[styles.formLabel, { color: colors.textSecondary, fontFamily: 'Inter_500Medium' }]}>Selling Price</Text>
                  <TextInput style={[styles.formInput, { color: colors.text, backgroundColor: colors.inputBg, borderColor: colors.border, fontFamily: 'Inter_400Regular' }]} placeholder="0" placeholderTextColor={colors.textMuted} value={newProduct.sellingPrice} onChangeText={v => setNewProduct(p => ({ ...p, sellingPrice: v }))} keyboardType="numeric" />
                </View>
                <View style={[styles.formField, { flex: 1 }]}>
                  <Text style={[styles.formLabel, { color: colors.textSecondary, fontFamily: 'Inter_500Medium' }]}>Cost Price</Text>
                  <TextInput style={[styles.formInput, { color: colors.text, backgroundColor: colors.inputBg, borderColor: colors.border, fontFamily: 'Inter_400Regular' }]} placeholder="0" placeholderTextColor={colors.textMuted} value={newProduct.costPrice} onChangeText={v => setNewProduct(p => ({ ...p, costPrice: v }))} keyboardType="numeric" />
                </View>
              </View>
              <View style={styles.formRow}>
                <View style={[styles.formField, { flex: 1 }]}>
                  <Text style={[styles.formLabel, { color: colors.textSecondary, fontFamily: 'Inter_500Medium' }]}>Stock</Text>
                  <TextInput style={[styles.formInput, { color: colors.text, backgroundColor: colors.inputBg, borderColor: colors.border, fontFamily: 'Inter_400Regular' }]} placeholder="0" placeholderTextColor={colors.textMuted} value={newProduct.stock} onChangeText={v => setNewProduct(p => ({ ...p, stock: v }))} keyboardType="numeric" />
                </View>
                <View style={[styles.formField, { flex: 1 }]}>
                  <Text style={[styles.formLabel, { color: colors.textSecondary, fontFamily: 'Inter_500Medium' }]}>Min Stock</Text>
                  <TextInput style={[styles.formInput, { color: colors.text, backgroundColor: colors.inputBg, borderColor: colors.border, fontFamily: 'Inter_400Regular' }]} placeholder="0" placeholderTextColor={colors.textMuted} value={newProduct.minStock} onChangeText={v => setNewProduct(p => ({ ...p, minStock: v }))} keyboardType="numeric" />
                </View>
              </View>
              <View style={styles.formRow}>
                <View style={[styles.formField, { flex: 1 }]}>
                  <Text style={[styles.formLabel, { color: colors.textSecondary, fontFamily: 'Inter_500Medium' }]}>Unit</Text>
                  <TextInput style={[styles.formInput, { color: colors.text, backgroundColor: colors.inputBg, borderColor: colors.border, fontFamily: 'Inter_400Regular' }]} value={newProduct.unit} onChangeText={v => setNewProduct(p => ({ ...p, unit: v }))} />
                </View>
                <View style={[styles.formField, { flex: 1 }]}>
                  <Text style={[styles.formLabel, { color: colors.textSecondary, fontFamily: 'Inter_500Medium' }]}>GST %</Text>
                  <TextInput style={[styles.formInput, { color: colors.text, backgroundColor: colors.inputBg, borderColor: colors.border, fontFamily: 'Inter_400Regular' }]} value={newProduct.gstRate} onChangeText={v => setNewProduct(p => ({ ...p, gstRate: v }))} keyboardType="numeric" />
                </View>
              </View>
              <View style={styles.formRow}>
                <View style={[styles.formField, { flex: 1 }]}>
                  <Text style={[styles.formLabel, { color: colors.textSecondary, fontFamily: 'Inter_500Medium' }]}>Mfg. Date</Text>
                  <DatePickerField
                    label="Manufacturing Date"
                    value={newProduct.manufacturingDate}
                    onChange={v => setNewProduct(p => ({ ...p, manufacturingDate: v }))}
                    colors={colors}
                  />
                </View>
                <View style={[styles.formField, { flex: 1 }]}>
                  <Text style={[styles.formLabel, { color: colors.textSecondary, fontFamily: 'Inter_500Medium' }]}>Expiry Date</Text>
                  <DatePickerField
                    label="Expiry Date"
                    value={newProduct.expiryDate}
                    onChange={v => setNewProduct(p => ({ ...p, expiryDate: v }))}
                    colors={colors}
                  />
                </View>
              </View>

              <View style={styles.formField}>
                <Text style={[styles.formLabel, { color: colors.textSecondary, fontFamily: 'Inter_500Medium' }]}>Category</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  <View style={styles.catSelectRow}>
                    {CATEGORIES.filter(c => c !== 'All').map(c => (
                      <Pressable key={c} onPress={() => setNewProduct(p => ({ ...p, category: c }))}
                        style={[styles.catSelectPill, { backgroundColor: newProduct.category === c ? colors.tint : colors.inputBg, borderColor: colors.border }]}>
                        <Text style={[styles.catSelectText, { color: newProduct.category === c ? '#fff' : colors.textSecondary, fontFamily: 'Inter_500Medium' }]}>{c}</Text>
                      </Pressable>
                    ))}
                  </View>
                </ScrollView>
              </View>
              <Pressable onPress={() => addMutation.mutate()} disabled={addMutation.isPending || !newProduct.name}
                style={[styles.submitBtn, { backgroundColor: colors.success, opacity: addMutation.isPending || !newProduct.name ? 0.5 : 1 }]}>
                <Ionicons name="add-circle" size={20} color="#fff" />
                <Text style={[styles.submitBtnText, { fontFamily: 'Inter_600SemiBold' }]}>{addMutation.isPending ? 'Adding...' : 'Add Product'}</Text>
              </Pressable>
            </ScrollView>
          </View>
        </View>
      </Modal>

      <Modal visible={showDetailModal} animationType="slide" transparent>
        <View style={[styles.modalOverlay, { backgroundColor: colors.overlay }]}>
          <View style={[styles.formSheet, { backgroundColor: colors.background, paddingBottom: insets.bottom + 16 }]}>
            <View style={[styles.formHeader, { borderBottomColor: colors.border }]}>
              <Text style={[styles.formTitle, { color: colors.text, fontFamily: 'Inter_700Bold' }]}>Product Details</Text>
              <View style={{ flexDirection: 'row', gap: 8 }}>
                <Pressable onPress={() => { if (editMode) updateMutation.mutate(); else setEditMode(true); }}>
                  <Ionicons name={editMode ? "checkmark" : "create-outline"} size={22} color={colors.tint} />
                </Pressable>
                <Pressable onPress={() => {
                  Alert.alert('Delete', 'Are you sure?', [
                    { text: 'Cancel', style: 'cancel' },
                    { text: 'Delete', style: 'destructive', onPress: () => selectedProduct && deleteMutation.mutate(selectedProduct.id) },
                  ]);
                }}>
                  <Ionicons name="trash-outline" size={22} color={colors.danger} />
                </Pressable>
                <Pressable onPress={() => { setShowDetailModal(false); setEditMode(false); }}>
                  <Ionicons name="close" size={24} color={colors.text} />
                </Pressable>
              </View>
            </View>
            {selectedProduct && (
              <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 16 }}>
                {selectedProduct.stock <= selectedProduct.minStock && (
                  <View style={[styles.warningBanner, { backgroundColor: colors.danger + '10', borderColor: colors.danger + '30' }]}>
                    <Ionicons name="alert-circle" size={18} color={colors.danger} />
                    <Text style={[styles.warningText, { color: colors.danger, fontFamily: 'Inter_500Medium' }]}>Low stock! Below minimum ({selectedProduct.minStock})</Text>
                  </View>
                )}
                <View style={[styles.detailCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                  <Text style={[styles.detailName, { color: colors.text, fontFamily: 'Inter_700Bold' }]}>{selectedProduct.name}</Text>
                  <Text style={[styles.detailSku, { color: colors.textMuted, fontFamily: 'Inter_400Regular' }]}>{selectedProduct.sku} | {selectedProduct.category}</Text>
                  <View style={styles.detailStatsRow}>
                    <View style={[styles.detailStatBox, { backgroundColor: colors.background }]}>
                      <Text style={[styles.detailStatValue, { color: colors.tint, fontFamily: 'Inter_700Bold' }]}>Rs.{selectedProduct.sellingPrice}</Text>
                      <Text style={[styles.detailStatLabel, { color: colors.textMuted, fontFamily: 'Inter_400Regular' }]}>Price</Text>
                    </View>
                    <View style={[styles.detailStatBox, { backgroundColor: getStockColor(selectedProduct) + '10' }]}>
                      <Text style={[styles.detailStatValue, { color: getStockColor(selectedProduct), fontFamily: 'Inter_700Bold' }]}>{selectedProduct.stock}</Text>
                      <Text style={[styles.detailStatLabel, { color: colors.textMuted, fontFamily: 'Inter_400Regular' }]}>Stock</Text>
                    </View>
                    <View style={[styles.detailStatBox, { backgroundColor: colors.background }]}>
                      <Text style={[styles.detailStatValue, { color: colors.text, fontFamily: 'Inter_700Bold' }]}>{selectedProduct.gstRate}%</Text>
                      <Text style={[styles.detailStatLabel, { color: colors.textMuted, fontFamily: 'Inter_400Regular' }]}>GST</Text>
                    </View>
                  </View>
                </View>

                <View style={[styles.detailCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                  <Text style={[styles.detailSectionTitle, { color: colors.text, fontFamily: 'Inter_600SemiBold' }]}>Quick Restock</Text>
                  <View style={styles.restockRow}>
                    {[10, 25, 50, 100].map(qty => (
                      <Pressable key={qty} onPress={() => restockMutation.mutate({ id: selectedProduct.id, qty })}
                        style={[styles.restockBtn, { borderColor: colors.tint + '40' }]}>
                        <Text style={[styles.restockBtnText, { color: colors.tint, fontFamily: 'Inter_600SemiBold' }]}>+{qty}</Text>
                      </Pressable>
                    ))}
                  </View>
                </View>

                {editMode ? (
                  <View style={[styles.editFormContainer, { backgroundColor: colors.card }]}>
                    <Text style={[styles.detailSectionTitle, { color: colors.text, fontFamily: 'Inter_600SemiBold', marginBottom: 16 }]}>Edit Product</Text>

                    <View style={styles.formField}>
                      <Text style={[styles.editLabel, { color: colors.textSecondary }]}>Product Name</Text>
                      <TextInput
                        style={[styles.editBoxInput, { color: colors.text, borderColor: colors.border, backgroundColor: colors.inputBg }]}
                        value={String(editData.name || '')}
                        onChangeText={v => setEditData(p => ({ ...p, name: v }))}
                      />
                    </View>

                    <View style={styles.formRow}>
                      <View style={[styles.formField, { flex: 1 }]}>
                        <Text style={[styles.editLabel, { color: colors.textSecondary }]}>Barcode</Text>
                        <TextInput
                          style={[styles.editBoxInput, { color: colors.text, borderColor: colors.border, backgroundColor: colors.inputBg }]}
                          value={String(editData.barcode || '')}
                          onChangeText={v => setEditData(p => ({ ...p, barcode: v }))}
                        />
                      </View>
                      <View style={[styles.formField, { flex: 1 }]}>
                        <Text style={[styles.editLabel, { color: colors.textSecondary }]}>Category</Text>
                        <TextInput
                          style={[styles.editBoxInput, { color: colors.text, borderColor: colors.border, backgroundColor: colors.inputBg }]}
                          value={String(editData.category || '')}
                          onChangeText={v => setEditData(p => ({ ...p, category: v }))}
                        />
                        {/* Note: ideally a dropdown, but text input works for flexibility for now */}
                      </View>
                    </View>

                    <View style={styles.formRow}>
                      <View style={[styles.formField, { flex: 1 }]}>
                        <Text style={[styles.editLabel, { color: colors.textSecondary }]}>Selling Price (₹)</Text>
                        <TextInput
                          style={[styles.editBoxInput, { color: colors.text, borderColor: colors.border, backgroundColor: colors.inputBg }]}
                          value={String(editData.sellingPrice ?? '')}
                          onChangeText={v => setEditData(p => ({ ...p, sellingPrice: Number(v) }))}
                          keyboardType="numeric"
                        />
                      </View>
                      <View style={[styles.formField, { flex: 1 }]}>
                        <Text style={[styles.editLabel, { color: colors.textSecondary }]}>Cost Price (₹)</Text>
                        <TextInput
                          style={[styles.editBoxInput, { color: colors.text, borderColor: colors.border, backgroundColor: colors.inputBg }]}
                          value={String(editData.costPrice ?? '')}
                          onChangeText={v => setEditData(p => ({ ...p, costPrice: Number(v) }))}
                          keyboardType="numeric"
                        />
                      </View>
                    </View>

                    <View style={styles.formRow}>
                      <View style={[styles.formField, { flex: 1 }]}>
                        <Text style={[styles.editLabel, { color: colors.textSecondary }]}>Stock Quantity</Text>
                        <TextInput
                          style={[styles.editBoxInput, { color: colors.text, borderColor: colors.border, backgroundColor: colors.inputBg }]}
                          value={String(editData.stock ?? '')}
                          onChangeText={v => setEditData(p => ({ ...p, stock: Number(v) }))}
                          keyboardType="numeric"
                        />
                      </View>
                      <View style={[styles.formField, { flex: 1 }]}>
                        <Text style={[styles.editLabel, { color: colors.textSecondary }]}>Min Stock (Alert)</Text>
                        <TextInput
                          style={[styles.editBoxInput, { color: colors.text, borderColor: colors.border, backgroundColor: colors.inputBg }]}
                          value={String(editData.minStock ?? '')}
                          onChangeText={v => setEditData(p => ({ ...p, minStock: Number(v) }))}
                          keyboardType="numeric"
                        />
                      </View>
                    </View>

                    <View style={styles.formRow}>
                      <View style={[styles.formField, { flex: 1 }]}>
                        <Text style={[styles.editLabel, { color: colors.textSecondary }]}>Unit</Text>
                        <TextInput
                          style={[styles.editBoxInput, { color: colors.text, borderColor: colors.border, backgroundColor: colors.inputBg }]}
                          value={String(editData.unit || '')}
                          onChangeText={v => setEditData(p => ({ ...p, unit: v }))}
                        />
                      </View>
                      <View style={[styles.formField, { flex: 1 }]}>
                        <Text style={[styles.editLabel, { color: colors.textSecondary }]}>GST Rate (%)</Text>
                        <TextInput
                          style={[styles.editBoxInput, { color: colors.text, borderColor: colors.border, backgroundColor: colors.inputBg }]}
                          value={String(editData.gstRate ?? '')}
                          onChangeText={v => setEditData(p => ({ ...p, gstRate: Number(v) }))}
                          keyboardType="numeric"
                        />
                      </View>
                    </View>

                    <View style={styles.formRow}>
                      <View style={[styles.formField, { flex: 1 }]}>
                        <Text style={[styles.editLabel, { color: colors.textSecondary }]}>Manufacturing Date</Text>
                        <DatePickerField
                          label="Manufacturing Date"
                          value={String(editData.manufacturingDate || '')}
                          onChange={v => setEditData(p => ({ ...p, manufacturingDate: v }))}
                          colors={colors}
                        />
                      </View>
                      <View style={[styles.formField, { flex: 1 }]}>
                        <Text style={[styles.editLabel, { color: colors.textSecondary }]}>Expiry Date</Text>
                        <DatePickerField
                          label="Expiry Date"
                          value={String(editData.expiryDate || '')}
                          onChange={v => setEditData(p => ({ ...p, expiryDate: v }))}
                          colors={colors}
                        />
                      </View>
                    </View>

                    <View style={styles.formRow}>
                      <View style={[styles.formField, { flex: 1 }]}>
                        <Text style={[styles.editLabel, { color: colors.textSecondary }]}>Supplier</Text>
                        <TextInput
                          style={[styles.editBoxInput, { color: colors.text, borderColor: colors.border, backgroundColor: colors.inputBg }]}
                          value={String(editData.supplier || '')}
                          onChangeText={v => setEditData(p => ({ ...p, supplier: v }))}
                        />
                      </View>
                      <View style={[styles.formField, { flex: 1 }]}>
                        <Text style={[styles.editLabel, { color: colors.textSecondary }]}>Batch No.</Text>
                        <TextInput
                          style={[styles.editBoxInput, { color: colors.text, borderColor: colors.border, backgroundColor: colors.inputBg }]}
                          value={String(editData.batchNo || '')}
                          onChangeText={v => setEditData(p => ({ ...p, batchNo: v }))}
                        />
                      </View>
                    </View>

                    <View style={{ flexDirection: 'row', gap: 12, marginTop: 12 }}>
                      <Pressable onPress={() => setEditMode(false)} style={[styles.actionBtn, { borderColor: colors.border, flex: 1 }]}>
                        <Text style={[styles.actionBtnText, { color: colors.text }]}>Cancel</Text>
                      </Pressable>
                      <Pressable onPress={() => updateMutation.mutate()} style={[styles.actionBtn, { backgroundColor: '#2563eb', flex: 1, borderColor: '#2563eb' }]}>
                        <Ionicons name="save-outline" size={18} color="#fff" />
                        <Text style={[styles.actionBtnText, { color: '#fff', fontWeight: '600' }]}>Update Product</Text>
                      </Pressable>
                    </View>
                  </View>
                ) : (
                  <View style={[styles.detailCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                    <Text style={[styles.detailSectionTitle, { color: colors.text, fontFamily: 'Inter_600SemiBold' }]}>Details</Text>
                    {[
                      { label: 'Cost Price', value: `Rs.${selectedProduct.costPrice}` },
                      { label: 'Min Stock Level', value: String(selectedProduct.minStock) },
                      { label: 'GST Rate', value: `${selectedProduct.gstRate}%` },
                      { label: 'Section', value: selectedProduct.section || '-' },
                      { label: 'Expiry Date', value: selectedProduct.expiryDate ? new Date(selectedProduct.expiryDate).toLocaleDateString('en-IN') : '-' },
                      { label: 'Last Updated', value: selectedProduct.lastUpdated },
                    ].map(d => (
                      <View key={d.label} style={styles.detailRow}>
                        <Text style={[styles.detailRowLabel, { color: colors.textMuted, fontFamily: 'Inter_400Regular' }]}>{d.label}</Text>
                        <Text style={[styles.detailRowValue, { color: colors.text, fontFamily: 'Inter_500Medium' }]}>{d.value}</Text>
                      </View>
                    ))}
                  </View>
                )}
              </ScrollView>
            )}
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
  headerSub: { fontSize: 13, marginTop: 2 },
  addBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 14, paddingVertical: 10, borderRadius: 12 },
  addBtnText: { fontSize: 14, color: '#fff' },
  statsGrid: { flexDirection: 'row', paddingHorizontal: 16, gap: 10, marginBottom: 12 },
  miniStat: { flex: 1, paddingVertical: 12, borderRadius: 14, borderWidth: 1, alignItems: 'center', gap: 4 },
  miniStatValue: { fontSize: 18 },
  miniStatLabel: { fontSize: 11 },
  searchRow: { flexDirection: 'row', alignItems: 'center', borderRadius: 12, paddingHorizontal: 14, height: 44, gap: 8, borderWidth: 1, marginBottom: 10 },
  searchInput: { flex: 1, fontSize: 14, height: '100%' },
  filterRow: { marginBottom: 6 },
  filterScroll: { paddingHorizontal: 16, gap: 8 },
  filterPill: { paddingHorizontal: 14, paddingVertical: 7, borderRadius: 18, borderWidth: 1, minWidth: 70, alignItems: 'center', justifyContent: 'center' },
  filterPillText: { fontSize: 12, textAlign: 'center' },
  productRow: { flexDirection: 'row', alignItems: 'center', padding: 14, borderRadius: 14, borderWidth: 1, marginBottom: 8, gap: 8 },
  productName: { fontSize: 14 },
  productMeta: { fontSize: 11, marginTop: 2 },
  productStats: { alignItems: 'flex-end', gap: 4 },
  productPrice: { fontSize: 14 },
  stockPill: { paddingHorizontal: 10, paddingVertical: 2, borderRadius: 8 },
  stockPillText: { fontSize: 12 },
  expiryDot: { width: 8, height: 8, borderRadius: 4 },
  modalOverlay: { flex: 1, justifyContent: 'flex-end' },
  formSheet: { height: '90%', borderTopLeftRadius: 24, borderTopRightRadius: 24 },
  formHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 16, borderBottomWidth: 1 },
  formTitle: { fontSize: 18 },
  formField: { marginBottom: 14 },
  formLabel: { fontSize: 12, marginBottom: 6 },
  formInput: { borderWidth: 1, borderRadius: 10, paddingHorizontal: 14, height: 44, fontSize: 14 },
  formRow: { flexDirection: 'row', gap: 12 },
  catSelectRow: { flexDirection: 'row', gap: 8 },
  catSelectPill: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 10, borderWidth: 1 },
  catSelectText: { fontSize: 12 },
  submitBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', height: 48, borderRadius: 12, gap: 8, marginTop: 16 },
  submitBtnText: { fontSize: 15, color: '#fff' },
  warningBanner: { flexDirection: 'row', alignItems: 'center', gap: 8, padding: 14, borderRadius: 12, borderWidth: 1, marginBottom: 12 },
  warningText: { fontSize: 13, flex: 1 },
  detailCard: { borderRadius: 14, padding: 16, borderWidth: 1, marginBottom: 12 },
  detailName: { fontSize: 18 },
  detailSku: { fontSize: 12, marginTop: 2, marginBottom: 12 },
  detailStatsRow: { flexDirection: 'row', gap: 10 },
  detailStatBox: { flex: 1, padding: 12, borderRadius: 10, alignItems: 'center' },
  detailStatValue: { fontSize: 18 },
  detailStatLabel: { fontSize: 11, marginTop: 2 },
  detailSectionTitle: { fontSize: 15, marginBottom: 12 },
  restockRow: { flexDirection: 'row', gap: 10 },
  restockBtn: { flex: 1, paddingVertical: 10, borderRadius: 10, borderWidth: 1, alignItems: 'center' },
  restockBtnText: { fontSize: 15 },
  detailRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 10, borderBottomWidth: 0.5, borderBottomColor: '#33415530' },
  detailRowLabel: { fontSize: 13 },
  detailRowValue: { fontSize: 13 },
  editField: { marginBottom: 12 },
  editLabel: { fontSize: 11, marginBottom: 4 },
  editInput: { borderBottomWidth: 1, paddingVertical: 8, fontSize: 14 },
  editFormContainer: { borderRadius: 14, padding: 16, marginBottom: 12, borderWidth: 1 },
  editBoxInput: { borderWidth: 1, borderRadius: 8, paddingHorizontal: 12, height: 40, fontSize: 13 },
  actionBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', height: 44, borderRadius: 10, borderWidth: 1, gap: 8 },
  actionBtnText: { fontSize: 14, fontFamily: 'Inter_500Medium' },
});

// ── Calendar Picker Styles ──────────────────────────────────────────────────
const calStyles = StyleSheet.create({
  dateBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    borderWidth: 1, borderRadius: 8, paddingHorizontal: 10, height: 40,
  },
  dateBtnText: { flex: 1, fontSize: 13, fontFamily: 'Inter_400Regular' },
  calOverlay: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.55)',
    justifyContent: 'center', alignItems: 'center', padding: 20,
  },
  calCard: {
    width: '100%', maxWidth: 340,
    borderRadius: 20, borderWidth: 1,
    overflow: 'hidden',
    shadowColor: '#000', shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25, shadowRadius: 20, elevation: 16,
  },
  calHeader: {
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 16,
  },
  calNavBtn: {
    width: 34, height: 34, borderRadius: 10,
    alignItems: 'center', justifyContent: 'center',
    backgroundColor: 'rgba(128,128,128,0.12)',
  },
  calMonthLabel: { fontSize: 16 },
  calDayRow: {
    flexDirection: 'row', paddingHorizontal: 12, marginBottom: 4,
  },
  calDayLabel: {
    flex: 1, textAlign: 'center', fontSize: 11, paddingVertical: 4,
  },
  calGrid: {
    flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 12, marginBottom: 8,
  },
  calCell: {
    width: `${100 / 7}%`, aspectRatio: 1,
    alignItems: 'center', justifyContent: 'center', padding: 2,
  },
  calDayBtn: {
    width: '100%', height: '100%',
    alignItems: 'center', justifyContent: 'center',
    borderRadius: 100,
  },
  calDayText: { fontSize: 13 },
  calCloseBtn: {
    borderTopWidth: 1, paddingVertical: 14,
    alignItems: 'center', justifyContent: 'center',
  },
  calCloseBtnText: { fontSize: 14 },
});
