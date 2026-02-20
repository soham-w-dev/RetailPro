
import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { useAuth } from '@/lib/auth-context';
import { useTheme } from '@/lib/theme-context';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';

export default function ProfileScreen() {
    const { user, logout } = useAuth();
    const { colors, isDark, toggleTheme } = useTheme();
    const insets = useSafeAreaInsets();

    if (!user) return null;

    return (
        <View style={[styles.container, { backgroundColor: colors.background, paddingTop: insets.top + 20 }]}>
            <View style={styles.header}>
                <Text style={[styles.title, { color: colors.text }]}>My Profile</Text>
            </View>

            <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <View style={styles.avatar}>
                    <Text style={[styles.avatarText, { color: colors.tint }]}>
                        {user.name.split(' ').map(n => n[0]).join('')}
                    </Text>
                </View>
                <Text style={[styles.name, { color: colors.text }]}>{user.name}</Text>
                <Text style={[styles.role, { color: colors.textMuted }]}>{user.role}</Text>

                <View style={[styles.infoRow, { borderTopColor: colors.border }]}>
                    <Text style={[styles.label, { color: colors.textSecondary }]}>Email</Text>
                    <Text style={[styles.value, { color: colors.text }]}>{user.email}</Text>
                </View>
                <View style={[styles.infoRow, { borderTopColor: colors.border }]}>
                    <Text style={[styles.label, { color: colors.textSecondary }]}>Phone</Text>
                    <Text style={[styles.value, { color: colors.text }]}>{user.phone}</Text>
                </View>
                <View style={[styles.infoRow, { borderTopColor: colors.border }]}>
                    <Text style={[styles.label, { color: colors.textSecondary }]}>Joined</Text>
                    <Text style={[styles.value, { color: colors.text }]}>
                        {new Date(user.joinedDate).toLocaleDateString()}
                    </Text>
                </View>
            </View>

            <View style={styles.actions}>
                <Pressable
                    onPress={toggleTheme}
                    style={[styles.actionBtn, { backgroundColor: colors.card, borderColor: colors.border }]}
                >
                    <Ionicons name={isDark ? "sunny" : "moon"} size={20} color={colors.text} />
                    <Text style={[styles.actionText, { color: colors.text }]}>
                        {isDark ? "Light Mode" : "Dark Mode"}
                    </Text>
                </Pressable>

                <Pressable
                    onPress={() => { logout(); router.replace('/'); }}
                    style={[styles.actionBtn, { backgroundColor: colors.danger + '10', borderColor: colors.danger + '30' }]}
                >
                    <Ionicons name="log-out-outline" size={20} color={colors.danger} />
                    <Text style={[styles.actionText, { color: colors.danger }]}>Logout</Text>
                </Pressable>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, padding: 20 },
    header: { marginBottom: 20 },
    title: { fontSize: 24, fontFamily: 'Inter_700Bold' },
    card: { borderRadius: 16, padding: 20, alignItems: 'center', borderWidth: 1, marginBottom: 20 },
    avatar: { width: 80, height: 80, borderRadius: 40, backgroundColor: '#e2e8f0', alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
    avatarText: { fontSize: 32, fontFamily: 'Inter_700Bold' },
    name: { fontSize: 20, fontFamily: 'Inter_600SemiBold', marginBottom: 4 },
    role: { fontSize: 14, fontFamily: 'Inter_400Regular', marginBottom: 20 },
    infoRow: { flexDirection: 'row', justifyContent: 'space-between', width: '100%', paddingVertical: 12, borderTopWidth: 1 },
    label: { fontSize: 14, fontFamily: 'Inter_400Regular' },
    value: { fontSize: 14, fontFamily: 'Inter_500Medium' },
    actions: { gap: 12 },
    actionBtn: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 16, borderRadius: 12, borderWidth: 1 },
    actionText: { fontSize: 16, fontFamily: 'Inter_500Medium' },
});
