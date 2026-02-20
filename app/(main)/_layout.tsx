import React from 'react';
import { Tabs } from 'expo-router';
import { Platform, StyleSheet, View } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { useTheme } from '@/lib/theme-context';
import { useAuth } from '@/lib/auth-context';

export default function MainLayout() {
  const { colors, isDark } = useTheme();
  const { user } = useAuth();
  const isWeb = Platform.OS === 'web';
  const isIOS = Platform.OS === 'ios';

  const isAdmin = user?.role === 'ADMIN';
  const isCashier = user?.role === 'CASHIER';
  const isStockClerk = user?.role === 'STOCK_CLERK';

  // Helper: returns the href for a tab based on who should see it
  // showFor is an array of roles that CAN see this tab
  const showFor = (roles: string[], path: string): any =>
    user?.role && roles.includes(user.role) ? path : null;

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.tint,
        tabBarInactiveTintColor: colors.tabIconDefault,
        tabBarLabelStyle: { fontFamily: 'Inter_500Medium', fontSize: 11 },
        tabBarStyle: {
          position: 'absolute' as const,
          backgroundColor: isIOS ? 'transparent' : colors.tabBar,
          borderTopWidth: isWeb ? 1 : 0,
          borderTopColor: colors.border,
          elevation: 0,
          ...(isWeb ? { height: 84 } : {}),
        },
        tabBarBackground: () =>
          isIOS ? (
            <BlurView intensity={100} tint={isDark ? 'dark' : 'light'} style={StyleSheet.absoluteFill} />
          ) : isWeb ? (
            <View style={[StyleSheet.absoluteFill, { backgroundColor: colors.tabBar }]} />
          ) : null,
      }}
    >
      {/* ── Dashboard: Admin only ───────────────────────────── */}
      <Tabs.Screen
        name="dashboard"
        options={{
          href: showFor(['ADMIN'], '/dashboard'),
          title: 'Dashboard',
          tabBarIcon: ({ color, size }) => <Ionicons name="grid" size={size} color={color} />,
        }}
      />

      {/* ── Inventory: Admin + Stock Clerk ──────────────────── */}
      <Tabs.Screen
        name="inventory"
        options={{
          href: showFor(['ADMIN', 'STOCK_CLERK'], '/inventory'),
          title: 'Inventory',
          tabBarIcon: ({ color, size }) => <MaterialCommunityIcons name="package-variant-closed" size={size} color={color} />,
        }}
      />

      {/* ── POS: Admin + Cashier + Stock Clerk ─────────────── */}
      <Tabs.Screen
        name="pos"
        options={{
          href: showFor(['ADMIN', 'CASHIER', 'STOCK_CLERK'], '/pos'),
          title: 'POS',
          tabBarIcon: ({ color, size }) => <Ionicons name="cart" size={size} color={color} />,
        }}
      />

      {/* ── Transactions: Admin + Cashier + Stock Clerk ──────── */}
      <Tabs.Screen
        name="transactions"
        options={{
          href: showFor(['ADMIN', 'CASHIER', 'STOCK_CLERK'], '/transactions'),
          title: 'Transactions',
          tabBarIcon: ({ color, size }) => <Ionicons name="receipt" size={size} color={color} />,
        }}
      />

      {/* ── Staff / Employees: Admin only ───────────────────── */}
      <Tabs.Screen
        name="employees"
        options={{
          href: showFor(['ADMIN'], '/employees'),
          title: 'Staff',
          tabBarIcon: ({ color, size }) => <Ionicons name="people" size={size} color={color} />,
        }}
      />

      {/* ── Reports: Admin only ─────────────────────────────── */}
      <Tabs.Screen
        name="reports"
        options={{
          href: showFor(['ADMIN'], '/reports'),
          title: 'Reports',
          tabBarIcon: ({ color, size }) => <Ionicons name="bar-chart" size={size} color={color} />,
        }}
      />

      {/* ── Profile: All roles ──────────────────────────────── */}
      <Tabs.Screen
        name="profile"
        options={{
          href: showFor(['CASHIER', 'STOCK_CLERK'], '/profile'),
          title: 'Profile',
          tabBarIcon: ({ color, size }) => <Ionicons name="person" size={size} color={color} />,
        }}
      />
    </Tabs>
  );
}
