import React, { useState } from 'react';
import {
  View, Text, ScrollView, StyleSheet, Pressable, Platform,
  TextInput, Modal, Alert, FlatList,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useQuery, useMutation } from '@tanstack/react-query';
import * as Haptics from 'expo-haptics';
import { useTheme } from '@/lib/theme-context';
import { apiRequest, queryClient } from '@/lib/query-client';
import type { Employee } from '@/lib/types';

type Tab = 'employees' | 'attendance' | 'sessions' | 'performance';

export default function EmployeesScreen() {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const [tab, setTab] = useState<Tab>('employees');
  const [showAddModal, setShowAddModal] = useState(false);
  const [newEmployee, setNewEmployee] = useState({ name: '', email: '', phone: '', password: '', pin: '', role: 'CASHIER' as const, status: 'Active' });

  const usersQuery = useQuery<Employee[]>({ queryKey: ['/api/users'] });
  const attendanceQuery = useQuery<any[]>({ queryKey: ['/api/attendance'] });
  const sessionsQuery = useQuery<any[]>({ queryKey: ['/api/session-logs'] });

  const users = usersQuery.data || [];
  const attendance = attendanceQuery.data || [];
  const sessions = sessionsQuery.data || [];

  const totalStaff = users.length;
  const activeStaff = users.filter(u => u.status === 'Active').length;
  const inactiveStaff = users.filter(u => u.status === 'Inactive').length;
  const onlineNow = sessions.filter(s => s.status === 'Active').length;

  const addMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest('POST', '/api/users', newEmployee);
      return res.json();
    },
    onSuccess: () => {
      setShowAddModal(false);
      setNewEmployee({ name: '', email: '', phone: '', password: '', pin: '', role: 'CASHIER', status: 'Active' });
      queryClient.invalidateQueries({ queryKey: ['/api/users'] });
      if (Platform.OS !== 'web') Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    },
    onError: (e: any) => Alert.alert('Error', e.message || 'Failed to add employee'),
  });

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'ADMIN': return colors.admin;
      case 'CASHIER': return colors.cashier;
      case 'STOCK_CLERK': return colors.stockClerk;
      default: return colors.textMuted;
    }
  };

  const getStatusColor = (status: string) => status === 'Active' ? colors.success : colors.danger;
  const getAttendanceColor = (status: string) => {
    if (status === 'Present') return colors.success;
    if (status === 'Late') return colors.warning;
    return colors.danger;
  };

  const tabs: { key: Tab; label: string }[] = [
    { key: 'employees', label: 'Employees' },
    { key: 'attendance', label: 'Attendance' },
    { key: 'sessions', label: 'Sessions' },
    { key: 'performance', label: 'Performance' },
  ];

  const cashiers = users.filter(u => u.role === 'CASHIER' && u.status === 'Active');

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { paddingTop: insets.top + (Platform.OS === 'web' ? 67 : 8) }]}>
        <View>
          <Text style={[styles.headerTitle, { color: colors.text, fontFamily: 'Inter_700Bold' }]}>Employee Management</Text>
          <Text style={[styles.headerSub, { color: colors.textSecondary, fontFamily: 'Inter_400Regular' }]}>Staff, attendance & performance</Text>
        </View>
        <Pressable onPress={() => setShowAddModal(true)} style={[styles.addBtn, { backgroundColor: colors.tint }]}>
          <Ionicons name="person-add" size={18} color="#fff" />
        </Pressable>
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.statsRow}>
        <View style={[styles.miniStat, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Ionicons name="people" size={20} color={colors.tint} />
          <Text style={[styles.miniStatValue, { color: colors.text, fontFamily: 'Inter_700Bold' }]}>{totalStaff}</Text>
          <Text style={[styles.miniStatLabel, { color: colors.textMuted, fontFamily: 'Inter_400Regular' }]}>Total Staff</Text>
        </View>
        <View style={[styles.miniStat, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Ionicons name="checkmark-circle" size={20} color={colors.success} />
          <Text style={[styles.miniStatValue, { color: colors.success, fontFamily: 'Inter_700Bold' }]}>{activeStaff}</Text>
          <Text style={[styles.miniStatLabel, { color: colors.textMuted, fontFamily: 'Inter_400Regular' }]}>Active</Text>
        </View>
        <View style={[styles.miniStat, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Ionicons name="close-circle" size={20} color={colors.danger} />
          <Text style={[styles.miniStatValue, { color: colors.danger, fontFamily: 'Inter_700Bold' }]}>{inactiveStaff}</Text>
          <Text style={[styles.miniStatLabel, { color: colors.textMuted, fontFamily: 'Inter_400Regular' }]}>Inactive</Text>
        </View>
        <View style={[styles.miniStat, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Ionicons name="wifi" size={20} color={colors.success} />
          <Text style={[styles.miniStatValue, { color: colors.success, fontFamily: 'Inter_700Bold' }]}>{onlineNow}</Text>
          <Text style={[styles.miniStatLabel, { color: colors.textMuted, fontFamily: 'Inter_400Regular' }]}>Online</Text>
        </View>
      </ScrollView>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabRow}>
        {tabs.map(t => (
          <Pressable key={t.key} onPress={() => setTab(t.key)}
            style={[styles.tabPill, { backgroundColor: tab === t.key ? colors.tint : 'transparent', borderBottomColor: tab === t.key ? colors.tint : 'transparent' }]}>
            <Text style={[styles.tabPillText, { color: tab === t.key ? '#fff' : colors.textSecondary, fontFamily: 'Inter_500Medium' }]}>{t.label}</Text>
          </Pressable>
        ))}
      </ScrollView>

      <ScrollView contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 100 }} showsVerticalScrollIndicator={false}>
        {tab === 'employees' && users.map(u => (
          <View key={u.id} style={[styles.empRow, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={[styles.avatar, { backgroundColor: getRoleBadgeColor(u.role) + '20' }]}>
              <Text style={[styles.avatarText, { color: getRoleBadgeColor(u.role), fontFamily: 'Inter_700Bold' }]}>{u.name.split(' ').map(n => n[0]).join('')}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.empName, { color: colors.text, fontFamily: 'Inter_600SemiBold' }]}>{u.name}</Text>
              <Text style={[styles.empEmail, { color: colors.textMuted, fontFamily: 'Inter_400Regular' }]}>{u.email}</Text>
            </View>
            <View style={[styles.roleBadge, { backgroundColor: getRoleBadgeColor(u.role) + '20' }]}>
              <Text style={[styles.roleBadgeText, { color: getRoleBadgeColor(u.role), fontFamily: 'Inter_600SemiBold' }]}>{u.role.replace('_', ' ')}</Text>
            </View>
            <View style={[styles.statusDot, { backgroundColor: getStatusColor(u.status) }]} />
          </View>
        ))}

        {tab === 'attendance' && attendance.map(a => (
          <View key={a.id} style={[styles.empRow, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={{ flex: 1 }}>
              <Text style={[styles.empName, { color: colors.text, fontFamily: 'Inter_600SemiBold' }]}>{a.userName}</Text>
              <Text style={[styles.empEmail, { color: colors.textMuted, fontFamily: 'Inter_400Regular' }]}>{a.date}</Text>
            </View>
            <Text style={[styles.attTime, { color: colors.textSecondary, fontFamily: 'Inter_400Regular' }]}>{a.checkIn || '-'}</Text>
            <Text style={[styles.attTime, { color: colors.textSecondary, fontFamily: 'Inter_400Regular' }]}>{a.checkOut || '-'}</Text>
            <View style={[styles.shiftBadge, { backgroundColor: a.shift === 'Morning' ? colors.tint + '20' : colors.accent + '20' }]}>
              <Text style={[styles.shiftBadgeText, { color: a.shift === 'Morning' ? colors.tint : colors.accent, fontFamily: 'Inter_500Medium' }]}>{a.shift}</Text>
            </View>
            <View style={[styles.statusPill, { backgroundColor: getAttendanceColor(a.status) + '15' }]}>
              <Text style={[styles.statusPillText, { color: getAttendanceColor(a.status), fontFamily: 'Inter_600SemiBold' }]}>{a.status}</Text>
            </View>
          </View>
        ))}

        {tab === 'sessions' && sessions.map(s => (
          <View key={s.id} style={[styles.empRow, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={{ flex: 1 }}>
              <Text style={[styles.empName, { color: colors.text, fontFamily: 'Inter_600SemiBold' }]}>{s.userName}</Text>
              <View style={[styles.roleBadge, { backgroundColor: getRoleBadgeColor(s.userRole) + '20', alignSelf: 'flex-start', marginTop: 4 }]}>
                <Text style={[styles.roleBadgeText, { color: getRoleBadgeColor(s.userRole), fontFamily: 'Inter_600SemiBold' }]}>{s.userRole}</Text>
              </View>
            </View>
            <View style={{ alignItems: 'flex-end' }}>
              <Text style={[styles.sessionTime, { color: colors.textSecondary, fontFamily: 'Inter_400Regular' }]}>{new Date(s.loginTime).toLocaleString('en-IN', { dateStyle: 'short', timeStyle: 'short' })}</Text>
              {s.duration ? <Text style={[styles.sessionDuration, { color: colors.textMuted, fontFamily: 'Inter_400Regular' }]}>{s.duration}</Text> : null}
            </View>
            <View style={[styles.statusPill, { backgroundColor: (s.status === 'Active' ? colors.success : colors.textMuted) + '15' }]}>
              <Text style={[styles.statusPillText, { color: s.status === 'Active' ? colors.success : colors.textMuted, fontFamily: 'Inter_600SemiBold' }]}>{s.status}</Text>
            </View>
          </View>
        ))}

        {tab === 'performance' && cashiers.map(u => {
          return (
            <View key={u.id} style={[styles.perfCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <View style={styles.perfHeader}>
                <View style={[styles.avatar, { backgroundColor: getRoleBadgeColor(u.role) + '20' }]}>
                  <Text style={[styles.avatarText, { color: getRoleBadgeColor(u.role), fontFamily: 'Inter_700Bold' }]}>{u.name.split(' ').map(n => n[0]).join('')}</Text>
                </View>
                <View>
                  <Text style={[styles.empName, { color: colors.text, fontFamily: 'Inter_600SemiBold' }]}>{u.name}</Text>
                  <Text style={[styles.empEmail, { color: colors.textMuted, fontFamily: 'Inter_400Regular' }]}>{u.role} - {u.id}</Text>
                </View>
              </View>
              <View style={styles.perfStats}>
                <View style={styles.perfStatItem}>
                  <Text style={[styles.perfStatValue, { color: colors.tint, fontFamily: 'Inter_700Bold' }]}>-</Text>
                  <Text style={[styles.perfStatLabel, { color: colors.textMuted, fontFamily: 'Inter_400Regular' }]}>Txns</Text>
                </View>
                <View style={styles.perfStatItem}>
                  <Text style={[styles.perfStatValue, { color: colors.success, fontFamily: 'Inter_700Bold' }]}>-</Text>
                  <Text style={[styles.perfStatLabel, { color: colors.textMuted, fontFamily: 'Inter_400Regular' }]}>Revenue</Text>
                </View>
                <View style={styles.perfStatItem}>
                  <Text style={[styles.perfStatValue, { color: colors.accent, fontFamily: 'Inter_700Bold' }]}>-</Text>
                  <Text style={[styles.perfStatLabel, { color: colors.textMuted, fontFamily: 'Inter_400Regular' }]}>Avg/Txn</Text>
                </View>
              </View>
            </View>
          );
        })}
      </ScrollView>

      <Modal visible={showAddModal} animationType="slide" transparent>
        <View style={[styles.modalOverlay, { backgroundColor: colors.overlay }]}>
          <View style={[styles.formSheet, { backgroundColor: colors.background, paddingBottom: insets.bottom + 16 }]}>
            <View style={[styles.formHeader, { borderBottomColor: colors.border }]}>
              <Text style={[styles.formTitle, { color: colors.text, fontFamily: 'Inter_700Bold' }]}>Add Employee</Text>
              <Pressable onPress={() => setShowAddModal(false)}>
                <Ionicons name="close" size={24} color={colors.text} />
              </Pressable>
            </View>
            <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 16 }} keyboardShouldPersistTaps="handled">
              {[
                { label: 'Full Name', key: 'name', placeholder: 'Full Name' },
                { label: 'Email', key: 'email', placeholder: 'Email', keyboard: 'email-address' as const },
                { label: 'Phone', key: 'phone', placeholder: 'Phone', keyboard: 'phone-pad' as const },
                { label: 'Password', key: 'password', placeholder: 'Password', secure: true },
                { label: 'Quick PIN (4 digits)', key: 'pin', placeholder: '0000', keyboard: 'numeric' as const },
              ].map(f => (
                <View key={f.key} style={styles.formField}>
                  <Text style={[styles.formLabel, { color: colors.textSecondary, fontFamily: 'Inter_500Medium' }]}>{f.label}</Text>
                  <TextInput
                    style={[styles.formInput, { color: colors.text, backgroundColor: colors.inputBg, borderColor: colors.border, fontFamily: 'Inter_400Regular' }]}
                    placeholder={f.placeholder}
                    placeholderTextColor={colors.textMuted}
                    value={(newEmployee as any)[f.key]}
                    onChangeText={v => setNewEmployee(prev => ({ ...prev, [f.key]: v }))}
                    keyboardType={f.keyboard}
                    secureTextEntry={f.secure}
                    autoCapitalize="none"
                  />
                </View>
              ))}
              <View style={styles.formField}>
                <Text style={[styles.formLabel, { color: colors.textSecondary, fontFamily: 'Inter_500Medium' }]}>Role</Text>
                <View style={styles.roleSelectRow}>
                  {(['CASHIER', 'STOCK_CLERK', 'ADMIN'] as const).map(r => (
                    <Pressable key={r} onPress={() => setNewEmployee(p => ({ ...p, role: r }))}
                      style={[styles.roleSelectPill, { backgroundColor: newEmployee.role === r ? getRoleBadgeColor(r) : colors.inputBg, borderColor: colors.border }]}>
                      <Text style={[styles.roleSelectText, { color: newEmployee.role === r ? '#fff' : colors.textSecondary, fontFamily: 'Inter_500Medium' }]}>{r.replace('_', ' ')}</Text>
                    </Pressable>
                  ))}
                </View>
              </View>
              <Pressable onPress={() => addMutation.mutate()} disabled={addMutation.isPending || !newEmployee.name || !newEmployee.email}
                style={[styles.submitBtn, { backgroundColor: colors.tint, opacity: addMutation.isPending || !newEmployee.name ? 0.5 : 1 }]}>
                <Ionicons name="person-add" size={18} color="#fff" />
                <Text style={[styles.submitBtnText, { fontFamily: 'Inter_600SemiBold' }]}>{addMutation.isPending ? 'Adding...' : 'Add Employee'}</Text>
              </Pressable>
            </ScrollView>
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
  addBtn: { width: 42, height: 42, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  statsRow: { paddingHorizontal: 16, gap: 10, marginBottom: 12 },
  miniStat: { paddingHorizontal: 16, paddingVertical: 12, borderRadius: 14, borderWidth: 1, alignItems: 'center', gap: 4, minWidth: 80 },
  miniStatValue: { fontSize: 18 },
  miniStatLabel: { fontSize: 10 },
  tabRow: { paddingHorizontal: 16, gap: 6, marginBottom: 12 },
  tabPill: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20 },
  tabPillText: { fontSize: 13 },
  empRow: { flexDirection: 'row', alignItems: 'center', padding: 14, borderRadius: 14, borderWidth: 1, marginBottom: 8, gap: 10 },
  avatar: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  avatarText: { fontSize: 14 },
  empName: { fontSize: 14 },
  empEmail: { fontSize: 11, marginTop: 1 },
  roleBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  roleBadgeText: { fontSize: 9 },
  statusDot: { width: 8, height: 8, borderRadius: 4 },
  attTime: { fontSize: 12, minWidth: 40, textAlign: 'center' },
  shiftBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  shiftBadgeText: { fontSize: 10 },
  statusPill: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
  statusPillText: { fontSize: 10 },
  sessionTime: { fontSize: 11 },
  sessionDuration: { fontSize: 10, marginTop: 2 },
  perfCard: { borderRadius: 14, padding: 16, borderWidth: 1, marginBottom: 10 },
  perfHeader: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 12 },
  perfStats: { flexDirection: 'row', gap: 12 },
  perfStatItem: { flex: 1, alignItems: 'center', paddingVertical: 8, borderRadius: 10 },
  perfStatValue: { fontSize: 16 },
  perfStatLabel: { fontSize: 10, marginTop: 2 },
  modalOverlay: { flex: 1, justifyContent: 'flex-end' },
  formSheet: { height: '85%', borderTopLeftRadius: 24, borderTopRightRadius: 24 },
  formHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 16, borderBottomWidth: 1 },
  formTitle: { fontSize: 18 },
  formField: { marginBottom: 14 },
  formLabel: { fontSize: 12, marginBottom: 6 },
  formInput: { borderWidth: 1, borderRadius: 10, paddingHorizontal: 14, height: 44, fontSize: 14 },
  roleSelectRow: { flexDirection: 'row', gap: 8 },
  roleSelectPill: { flex: 1, paddingVertical: 10, borderRadius: 10, borderWidth: 1, alignItems: 'center' },
  roleSelectText: { fontSize: 12 },
  submitBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', height: 48, borderRadius: 12, gap: 8, marginTop: 16 },
  submitBtnText: { fontSize: 15, color: '#fff' },
});
