import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, TextInput, Pressable, StyleSheet, Platform,
  KeyboardAvoidingView, ScrollView, Animated, Dimensions,
} from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { useTheme } from '@/lib/theme-context';
import { useAuth } from '@/lib/auth-context';
import { apiRequest } from '@/lib/query-client';

const { width } = Dimensions.get('window');

export default function LoginScreen() {
  const { colors, isDark } = useTheme();
  const { setUser } = useAuth();
  const insets = useSafeAreaInsets();
  const [tab, setTab] = useState<'email' | 'pin'>('email');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [pin, setPin] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;

  // Route each role to their correct home screen
  const getHomeRoute = (role: string) => {
    if (role === 'CASHIER') return '/(main)/pos';
    if (role === 'STOCK_CLERK') return '/(main)/pos';
    return '/(main)/dashboard'; // ADMIN
  };

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 800, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 600, useNativeDriver: true }),
    ]).start();
  }, []);

  const handleEmailLogin = async () => {
    if (!email || !password) { setError('Please fill all fields'); return; }
    setLoading(true); setError('');
    try {
      const res = await apiRequest('POST', '/api/auth/login', { email, password });
      const data = await res.json();
      if (Platform.OS !== 'web') Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setUser(data.user);
      router.replace(getHomeRoute(data.user.role) as any);
    } catch (e: any) {
      setError(e.message?.includes('401') ? 'Invalid email or password' : 'Login failed');
      if (Platform.OS !== 'web') Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } finally { setLoading(false); }
  };

  const handlePinLogin = async () => {
    if (pin.length !== 4) { setError('Enter 4-digit PIN'); return; }
    setLoading(true); setError('');
    try {
      const res = await apiRequest('POST', '/api/auth/pin-login', { pin });
      const data = await res.json();
      if (Platform.OS !== 'web') Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setUser(data.user);
      router.replace(getHomeRoute(data.user.role) as any);
    } catch (e: any) {
      setError(e.message?.includes('401') ? 'Invalid PIN' : 'Login failed');
      if (Platform.OS !== 'web') Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } finally { setLoading(false); }
  };

  const pinDigits = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '', '0', 'del'];

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView
          contentContainerStyle={[styles.scrollContent, { paddingTop: insets.top + (Platform.OS === 'web' ? 67 : 20), paddingBottom: insets.bottom + (Platform.OS === 'web' ? 34 : 20) }]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <Animated.View style={[styles.header, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
            <View style={[styles.logoContainer, { backgroundColor: colors.tint + '20' }]}>
              <MaterialCommunityIcons name="store" size={48} color={colors.tint} />
            </View>
            <Text style={[styles.appName, { color: colors.text, fontFamily: 'Inter_700Bold' }]}>RetailPro</Text>
            <Text style={[styles.subtitle, { color: colors.textSecondary, fontFamily: 'Inter_400Regular' }]}>Inventory & Billing System</Text>
          </Animated.View>

          <View style={[styles.tabRow, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Pressable
              onPress={() => { setTab('email'); setError(''); }}
              style={[styles.tabBtn, tab === 'email' && { backgroundColor: colors.tint }]}
            >
              <Ionicons name="mail-outline" size={16} color={tab === 'email' ? '#fff' : colors.textSecondary} />
              <Text style={[styles.tabText, { color: tab === 'email' ? '#fff' : colors.textSecondary, fontFamily: 'Inter_600SemiBold' }]}>Admin / Email</Text>
            </Pressable>
            <Pressable
              onPress={() => { setTab('pin'); setError(''); }}
              style={[styles.tabBtn, tab === 'pin' && { backgroundColor: colors.tint }]}
            >
              <Ionicons name="keypad-outline" size={16} color={tab === 'pin' ? '#fff' : colors.textSecondary} />
              <Text style={[styles.tabText, { color: tab === 'pin' ? '#fff' : colors.textSecondary, fontFamily: 'Inter_600SemiBold' }]}>Quick PIN</Text>
            </Pressable>
          </View>

          <View style={[styles.formCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            {tab === 'email' ? (
              <>
                <Text style={[styles.label, { color: colors.textSecondary, fontFamily: 'Inter_500Medium' }]}>Email Address</Text>
                <View style={[styles.inputRow, { backgroundColor: colors.inputBg, borderColor: colors.border }]}>
                  <Ionicons name="mail-outline" size={20} color={colors.textMuted} />
                  <TextInput
                    style={[styles.input, { color: colors.text, fontFamily: 'Inter_400Regular' }]}
                    placeholder="Enter your email"
                    placeholderTextColor={colors.textMuted}
                    value={email}
                    onChangeText={setEmail}
                    keyboardType="email-address"
                    autoCapitalize="none"
                  />
                </View>

                <Text style={[styles.label, { color: colors.textSecondary, fontFamily: 'Inter_500Medium', marginTop: 16 }]}>Password</Text>
                <View style={[styles.inputRow, { backgroundColor: colors.inputBg, borderColor: colors.border }]}>
                  <Ionicons name="lock-closed-outline" size={20} color={colors.textMuted} />
                  <TextInput
                    style={[styles.input, { color: colors.text, fontFamily: 'Inter_400Regular' }]}
                    placeholder="Enter your password"
                    placeholderTextColor={colors.textMuted}
                    value={password}
                    onChangeText={setPassword}
                    secureTextEntry={!showPassword}
                  />
                  <Pressable onPress={() => setShowPassword(!showPassword)}>
                    <Ionicons name={showPassword ? "eye-outline" : "eye-off-outline"} size={20} color={colors.textMuted} />
                  </Pressable>
                </View>

                <Pressable
                  onPress={handleEmailLogin}
                  disabled={loading}
                  style={({ pressed }) => [styles.loginBtn, { backgroundColor: colors.tint, opacity: pressed || loading ? 0.7 : 1 }]}
                >
                  <Ionicons name="log-in-outline" size={22} color="#fff" />
                  <Text style={[styles.loginBtnText, { fontFamily: 'Inter_600SemiBold' }]}>{loading ? 'Logging in...' : 'Login'}</Text>
                </Pressable>
              </>
            ) : (
              <>
                <Text style={[styles.pinTitle, { color: colors.text, fontFamily: 'Inter_600SemiBold' }]}>Enter 4-Digit PIN</Text>
                <View style={styles.pinDotsRow}>
                  {[0, 1, 2, 3].map(i => (
                    <View key={i} style={[styles.pinDot, { borderColor: colors.border, backgroundColor: pin.length > i ? colors.tint : 'transparent' }]} />
                  ))}
                </View>
                <View style={styles.pinPad}>
                  {pinDigits.map((d, i) => (
                    <Pressable
                      key={i}
                      onPress={() => {
                        if (d === 'del') { setPin(prev => prev.slice(0, -1)); }
                        else if (d && pin.length < 4) { setPin(prev => prev + d); if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); }
                      }}
                      style={({ pressed }) => [styles.pinKey, { backgroundColor: d ? (pressed ? colors.tint + '30' : colors.inputBg) : 'transparent', borderColor: d ? colors.border : 'transparent' }]}
                      disabled={!d}
                    >
                      {d === 'del' ? (
                        <Ionicons name="backspace-outline" size={24} color={colors.text} />
                      ) : (
                        <Text style={[styles.pinKeyText, { color: colors.text, fontFamily: 'Inter_600SemiBold' }]}>{d}</Text>
                      )}
                    </Pressable>
                  ))}
                </View>
                <Pressable
                  onPress={handlePinLogin}
                  disabled={loading || pin.length !== 4}
                  style={({ pressed }) => [styles.loginBtn, { backgroundColor: colors.tint, opacity: pressed || loading || pin.length !== 4 ? 0.5 : 1 }]}
                >
                  <Ionicons name="log-in-outline" size={22} color="#fff" />
                  <Text style={[styles.loginBtnText, { fontFamily: 'Inter_600SemiBold' }]}>{loading ? 'Logging in...' : 'Login'}</Text>
                </Pressable>
              </>
            )}

            {!!error && (
              <View style={[styles.errorBox, { backgroundColor: colors.danger + '15' }]}>
                <Ionicons name="alert-circle" size={18} color={colors.danger} />
                <Text style={[styles.errorText, { color: colors.danger, fontFamily: 'Inter_500Medium' }]}>{error}</Text>
              </View>
            )}
          </View>

          <View style={[styles.demoCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={styles.demoHeader}>
              <Ionicons name="information-circle-outline" size={18} color={colors.tint} />
              <Text style={[styles.demoTitle, { color: colors.text, fontFamily: 'Inter_600SemiBold' }]}>Demo Credentials</Text>
            </View>
            <View style={styles.demoRow}>
              <View style={[styles.demoBadge, { backgroundColor: colors.admin + '20' }]}>
                <Text style={[styles.demoBadgeText, { color: colors.admin, fontFamily: 'Inter_600SemiBold' }]}>ADMIN</Text>
              </View>
            </View>
            <View style={styles.demoRow}>
              <View style={[styles.demoBadge, { backgroundColor: colors.cashier + '20' }]}>
                <Text style={[styles.demoBadgeText, { color: colors.cashier, fontFamily: 'Inter_600SemiBold' }]}>CASHIER</Text>
              </View>
            </View>
            <View style={styles.demoRow}>
              <View style={[styles.demoBadge, { backgroundColor: colors.stockClerk + '20' }]}>
                <Text style={[styles.demoBadgeText, { color: colors.stockClerk, fontFamily: 'Inter_600SemiBold' }]}>STOCK_CLERK</Text>
              </View>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: { flexGrow: 1, alignItems: 'center', paddingHorizontal: 24 },
  header: { alignItems: 'center', marginBottom: 32, marginTop: 20 },
  logoContainer: { width: 88, height: 88, borderRadius: 24, alignItems: 'center', justifyContent: 'center', marginBottom: 16 },
  appName: { fontSize: 32, marginBottom: 4 },
  subtitle: { fontSize: 15 },
  tabRow: { flexDirection: 'row', borderRadius: 12, padding: 4, width: '100%', maxWidth: 400, marginBottom: 20, borderWidth: 1 },
  tabBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 12, borderRadius: 10, gap: 6 },
  tabText: { fontSize: 13 },
  formCard: { width: '100%', maxWidth: 400, borderRadius: 16, padding: 24, borderWidth: 1, marginBottom: 16 },
  label: { fontSize: 13, marginBottom: 8 },
  inputRow: { flexDirection: 'row', alignItems: 'center', borderRadius: 12, paddingHorizontal: 14, height: 50, gap: 10, borderWidth: 1 },
  input: { flex: 1, fontSize: 15, height: '100%' },
  loginBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', height: 52, borderRadius: 14, gap: 8, marginTop: 24 },
  loginBtnText: { fontSize: 17, color: '#fff' },
  errorBox: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 16, padding: 12, borderRadius: 10 },
  errorText: { fontSize: 13, flex: 1 },
  pinTitle: { fontSize: 16, textAlign: 'center', marginBottom: 20 },
  pinDotsRow: { flexDirection: 'row', justifyContent: 'center', gap: 16, marginBottom: 24 },
  pinDot: { width: 16, height: 16, borderRadius: 8, borderWidth: 2 },
  pinPad: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 12 },
  pinKey: { width: 72, height: 56, borderRadius: 14, alignItems: 'center', justifyContent: 'center', borderWidth: 1 },
  pinKeyText: { fontSize: 22 },
  demoCard: { width: '100%', maxWidth: 400, borderRadius: 16, padding: 16, borderWidth: 1, marginBottom: 40 },
  demoHeader: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 12 },
  demoTitle: { fontSize: 14 },
  demoRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 8 },
  demoBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  demoBadgeText: { fontSize: 10 },
  demoText: { fontSize: 13 },
});
