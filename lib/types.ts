export interface Product {
  id: string;
  name: string;
  sku: string;
  barcode: string;
  category: string;
  sellingPrice: number;
  costPrice: number;
  stock: number;
  minStock: number;
  unit: string;
  gstRate: number;
  manufacturingDate: string;
  expiryDate: string;
  supplier: string;
  batchNo: string;
  section: string;
  lastUpdated: string;
}

export interface CartItem {
  product: Product;
  qty: number;
}

export interface TransactionItem {
  productId: string;
  productName: string;
  qty: number;
  price: number;
  gstRate: number;
  total: number;
}

export interface Transaction {
  id: string;
  invoiceNo: string;
  items: TransactionItem[];
  subtotal: number;
  discount: number;
  gstAmount: number;
  total: number;
  paymentMethod: 'Cash' | 'Card' | 'UPI';
  customerPhone: string;
  cashierId: string;
  cashierName: string;
  createdAt: string;
}

export interface ActivityLog {
  id: string;
  userId: string;
  userName: string;
  userRole: string;
  action: string;
  details: string;
  timestamp: string;
}

export interface DashboardStats {
  totalRevenue: number;
  todayRevenue: number;
  netProfit: number;
  totalTransactions: number;
  todayTransactions: number;
  totalProducts: number;
  lowStockCount: number;
  expiringCount: number;
  activeEmployees: number;
  inventoryValue: number;
  totalGst: number;
  categoryRevenue: Record<string, number>;
  paymentMethods: Record<string, { count: number; total: number }>;
  last7Days: { date: string; revenue: number; profit: number }[];
  lowStockProducts: { id: string; name: string; stock: number; minStock: number }[];
  expiringProducts: { id: string; name: string; expiryDate: string; daysLeft: number; stock: number; costPrice: number; potentialLoss: number }[];
}

export interface Employee {
  id: string;
  name: string;
  email: string;
  phone: string;
  pin: string;
  role: 'ADMIN' | 'CASHIER' | 'STOCK_CLERK';
  status: string;
  joinedDate: string;
}

export interface ReportData {
  totalRevenue: number;
  netProfit: number;
  totalTransactions: number;
  avgTransaction: number;
  totalDiscount: number;
  totalGst: number;
  itemsSold: number;
  topProducts: { name: string; qty: number; revenue: number }[];
  cashierPerformance: { name: string; transactions: number; revenue: number }[];
  paymentBreakdown: Record<string, { count: number; total: number }>;
  reorderSuggestions: { id: string; name: string; stock: number; minStock: number; suggestedOrder: number; estimatedCost: number }[];
}
