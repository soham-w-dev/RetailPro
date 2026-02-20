import { randomUUID } from "crypto";
import admin from 'firebase-admin';
import { getFirestore, Timestamp } from 'firebase-admin/firestore';
import fs from 'fs';
import path from 'path';

export interface User {
  id: string;
  name: string;
  email: string;
  password: string;
  phone: string;
  pin: string;
  role: "ADMIN" | "CASHIER" | "STOCK_CLERK";
  status: "Active" | "Inactive";
  joinedDate: string;
}

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
  paymentMethod: "Cash" | "Card" | "UPI";
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

export interface Attendance {
  id: string;
  userId: string;
  userName: string;
  date: string;
  checkIn: string;
  checkOut: string;
  shift: "Morning" | "Afternoon" | "Night";
  status: "Present" | "Absent" | "Late";
}

export interface SessionLog {
  id: string;
  userId: string;
  userName: string;
  userRole: string;
  loginTime: string;
  logoutTime: string;
  duration: string;
  status: "Active" | "Ended";
}

export interface IStorage {
  getUsers(): Promise<User[]>;
  getUser(id: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  getUserByPin(pin: string): Promise<User | undefined>;
  createUser(user: Omit<User, "id">): Promise<User>;
  updateUser(id: string, data: Partial<User>): Promise<User | undefined>;
  deleteUser(id: string): Promise<boolean>;

  getProducts(): Promise<Product[]>;
  getProduct(id: string): Promise<Product | undefined>;
  createProduct(product: Omit<Product, "id">): Promise<Product>;
  updateProduct(id: string, data: Partial<Product>): Promise<Product | undefined>;
  deleteProduct(id: string): Promise<boolean>;
  updateStock(id: string, qty: number): Promise<Product | undefined>;

  getTransactions(): Promise<Transaction[]>;
  getTransaction(id: string): Promise<Transaction | undefined>;
  createTransaction(tx: Omit<Transaction, "id">): Promise<Transaction>;

  getActivityLogs(): Promise<ActivityLog[]>;
  addActivityLog(log: Omit<ActivityLog, "id">): Promise<ActivityLog>;

  getAttendance(): Promise<Attendance[]>;
  getSessionLogs(): Promise<SessionLog[]>;
}

class MemStorage implements IStorage {
  users: Map<string, User> = new Map();
  products: Map<string, Product> = new Map();
  transactions: Map<string, Transaction> = new Map();
  activityLogs: ActivityLog[] = [];
  attendance: Attendance[] = [];
  sessionLogs: SessionLog[] = [];

  constructor() {
    this.seed();
  }

  private seed() {
    // Basic seed if memory is empty (always true on restart for MemStorage)
    const users: User[] = [
      { id: "U001", name: "Rajesh Kumar", email: "admin@retailpro.com", password: "admin123", phone: "9876543210", pin: "1234", role: "ADMIN", status: "Active", joinedDate: "2024-01-15" },
      { id: "U002", name: "Priya Sharma", email: "priya@retailpro.com", password: "priya123", phone: "9876543211", pin: "2345", role: "CASHIER", status: "Active", joinedDate: "2024-03-20" },
      { id: "U003", name: "Amit Patel", email: "amit@retailpro.com", password: "amit123", phone: "9876543212", pin: "3456", role: "STOCK_CLERK", status: "Active", joinedDate: "2024-06-10" },
      { id: "U004", name: "Sneha Reddy", email: "sneha@retailpro.com", password: "sneha123", phone: "9876543213", pin: "4567", role: "CASHIER", status: "Active", joinedDate: "2024-08-05" },
      { id: "U005", name: "Vikram Singh", email: "vikram@retailpro.com", password: "vikram123", phone: "9876543214", pin: "5678", role: "STOCK_CLERK", status: "Inactive", joinedDate: "2024-12-01" },
    ];
    users.forEach(u => this.users.set(u.id, u));

    const now = new Date();
    const fmt = (d: Date) => d.toISOString().split("T")[0];
    const futureDate = (days: number) => { const d = new Date(now); d.setDate(d.getDate() + days); return fmt(d); };

    // Add same products from original seed
    const products: Product[] = [
      { id: "P001", name: "Tata Salt (1kg)", sku: "TS001", barcode: "8901234567890", category: "Groceries", sellingPrice: 28, costPrice: 22, stock: 450, minStock: 50, unit: "kg", gstRate: 5, manufacturingDate: "2025-06-01", expiryDate: futureDate(180), supplier: "Tata Consumer", batchNo: "B2024-001", section: "Aisle 1", lastUpdated: fmt(now) },
      // ... keep it concise for now, just a few examples or full list if needed
      { id: "P002", name: "Fortune Sunflower Oil (1L)", sku: "FS001", barcode: "8901234567891", category: "Groceries", sellingPrice: 155, costPrice: 130, stock: 200, minStock: 30, unit: "L", gstRate: 5, manufacturingDate: "2025-05-15", expiryDate: futureDate(25), supplier: "Adani Wilmar", batchNo: "B2024-002", section: "Aisle 1", lastUpdated: fmt(now) },
      { id: "P003", name: "Surf Excel Matic (2kg)", sku: "SE001", barcode: "8901234567892", category: "Household", sellingPrice: 480, costPrice: 380, stock: 120, minStock: 20, unit: "kg", gstRate: 18, manufacturingDate: "2025-04-01", expiryDate: futureDate(365), supplier: "Hindustan Unilever", batchNo: "B2024-003", section: "Aisle 3", lastUpdated: fmt(now) },
    ];
    products.forEach(p => this.products.set(p.id, p));

    // Seed Attendance (last 7 days for each user)
    const attendanceData: Attendance[] = [];
    const staffMembers = [
      { id: 'U001', name: 'Rajesh Kumar' },
      { id: 'U002', name: 'Priya Sharma' },
      { id: 'U003', name: 'Amit Patel' },
      { id: 'U004', name: 'Sneha Reddy' },
      { id: 'U005', name: 'Vikram Singh' },
    ];
    const shiftsPattern: ('Morning' | 'Afternoon' | 'Night')[] = ['Morning', 'Morning', 'Afternoon', 'Morning', 'Morning'];
    const statusMatrix: ('Present' | 'Late' | 'Absent')[][] = [
      // Day 0 (today)
      ['Present', 'Present', 'Late', 'Present', 'Absent'],
      // Day 1
      ['Present', 'Present', 'Present', 'Late', 'Absent'],
      // Day 2
      ['Present', 'Late', 'Present', 'Present', 'Present'],
      // Day 3
      ['Present', 'Present', 'Absent', 'Present', 'Late'],
      // Day 4
      ['Present', 'Present', 'Present', 'Present', 'Present'],
      // Day 5
      ['Present', 'Absent', 'Present', 'Present', 'Late'],
      // Day 6
      ['Present', 'Present', 'Present', 'Late', 'Absent'],
    ];
    const checkInTimes = [
      ['09:00', '08:55', '09:15', '13:00', ''],
      ['09:01', '09:00', '09:05', '13:20', ''],
      ['09:02', '09:35', '09:00', '13:00', '09:00'],
      ['09:00', '09:00', '', '13:10', '09:40'],
      ['09:00', '09:00', '09:00', '13:00', '09:00'],
      ['09:00', '', '09:00', '13:00', '09:30'],
      ['09:00', '09:00', '09:00', '13:25', ''],
    ];
    const checkOutTimes = [
      ['18:00', '17:05', '', '-', ''],
      ['18:00', '18:00', '18:00', '-', ''],
      ['18:00', '17:55', '18:00', '21:05', '18:00'],
      ['18:00', '18:00', '', '21:00', '18:00'],
      ['18:00', '18:00', '18:00', '21:00', '18:00'],
      ['18:00', '', '18:00', '21:00', '18:00'],
      ['18:00', '18:00', '18:00', '-', ''],
    ];
    for (let dayOffset = 0; dayOffset < 7; dayOffset++) {
      const d = new Date(now);
      d.setDate(d.getDate() - dayOffset);
      const dateStr = fmt(d);
      staffMembers.forEach((staff, si) => {
        const status = statusMatrix[dayOffset][si];
        attendanceData.push({
          id: `ATT-${dateStr}-${staff.id}`,
          userId: staff.id,
          userName: staff.name,
          date: dateStr,
          checkIn: status === 'Absent' ? '-' : checkInTimes[dayOffset][si],
          checkOut: status === 'Absent' ? '-' : checkOutTimes[dayOffset][si],
          shift: shiftsPattern[si],
          status,
        });
      });
    }
    this.attendance = attendanceData;

    // Seed Session Logs
    const sessionData: SessionLog[] = [
      { id: 'SL001', userId: 'U001', userName: 'Rajesh Kumar', userRole: 'ADMIN', loginTime: new Date(now.getTime() - 2 * 3600000).toISOString(), logoutTime: '', duration: '', status: 'Active' },
      { id: 'SL002', userId: 'U002', userName: 'Priya Sharma', userRole: 'CASHIER', loginTime: new Date(now.getTime() - 8 * 3600000).toISOString(), logoutTime: new Date(now.getTime() - 1 * 3600000).toISOString(), duration: '7h 0m', status: 'Ended' },
      { id: 'SL003', userId: 'U003', userName: 'Amit Patel', userRole: 'STOCK_CLERK', loginTime: new Date(now.getTime() - 24 * 3600000).toISOString(), logoutTime: new Date(now.getTime() - 16 * 3600000).toISOString(), duration: '8h 0m', status: 'Ended' },
      { id: 'SL004', userId: 'U004', userName: 'Sneha Reddy', userRole: 'CASHIER', loginTime: new Date(now.getTime() - 5 * 3600000).toISOString(), logoutTime: '', duration: '', status: 'Active' },
      { id: 'SL005', userId: 'U005', userName: 'Vikram Singh', userRole: 'STOCK_CLERK', loginTime: new Date(now.getTime() - 48 * 3600000).toISOString(), logoutTime: new Date(now.getTime() - 40 * 3600000).toISOString(), duration: '8h 0m', status: 'Ended' },
    ];
    this.sessionLogs = sessionData;
  }

  async getUsers(): Promise<User[]> { return Array.from(this.users.values()); }
  async getUser(id: string): Promise<User | undefined> { return this.users.get(id); }
  async getUserByEmail(email: string): Promise<User | undefined> { return Array.from(this.users.values()).find(u => u.email === email); }
  async getUserByPin(pin: string): Promise<User | undefined> { return Array.from(this.users.values()).find(u => u.pin === pin); }
  async createUser(user: Omit<User, "id">): Promise<User> { const id = "U" + String(this.users.size + 1).padStart(3, "0"); const u = { ...user, id }; this.users.set(id, u); return u; }
  async updateUser(id: string, data: Partial<User>): Promise<User | undefined> { const u = this.users.get(id); if (!u) return undefined; const updated = { ...u, ...data }; this.users.set(id, updated); return updated; }
  async deleteUser(id: string): Promise<boolean> { return this.users.delete(id); }

  async getProducts(): Promise<Product[]> { return Array.from(this.products.values()); }
  async getProduct(id: string): Promise<Product | undefined> { return this.products.get(id); }
  async createProduct(product: Omit<Product, "id">): Promise<Product> { const id = "P" + String(this.products.size + 1).padStart(3, "0"); const p = { ...product, id }; this.products.set(id, p); return p; }
  async updateProduct(id: string, data: Partial<Product>): Promise<Product | undefined> { const p = this.products.get(id); if (!p) return undefined; const updated = { ...p, ...data, lastUpdated: new Date().toISOString().split("T")[0] }; this.products.set(id, updated); return updated; }
  async deleteProduct(id: string): Promise<boolean> { return this.products.delete(id); }
  async updateStock(id: string, qty: number): Promise<Product | undefined> { const p = this.products.get(id); if (!p) return undefined; p.stock += qty; p.lastUpdated = new Date().toISOString().split("T")[0]; return p; }

  async getTransactions(): Promise<Transaction[]> { return Array.from(this.transactions.values()); }
  async getTransaction(id: string): Promise<Transaction | undefined> { return this.transactions.get(id); }
  async createTransaction(tx: Omit<Transaction, "id">): Promise<Transaction> { const id = "T" + String(this.transactions.size + 1).padStart(3, "0"); const t = { ...tx, id }; this.transactions.set(id, t); return t; }

  async getActivityLogs(): Promise<ActivityLog[]> { return this.activityLogs.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()); }
  async addActivityLog(log: Omit<ActivityLog, "id">): Promise<ActivityLog> { const l = { ...log, id: randomUUID() }; this.activityLogs.unshift(l); return l; }

  async getAttendance(): Promise<Attendance[]> { return this.attendance; }
  async getSessionLogs(): Promise<SessionLog[]> { return this.sessionLogs; }
}

class FirebaseStorage implements IStorage {
  db: FirebaseFirestore.Firestore;

  constructor(serviceAccountPath: string) {
    if (!admin.apps.length) {
      if (fs.existsSync(serviceAccountPath)) {
        const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, 'utf8'));
        admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
      } else {
        // Fallback for cloud run or if user sets GOOGLE_APPLICATION_CREDENTIALS
        admin.initializeApp();
      }
    }
    this.db = getFirestore();
    this.seed();
  }

  private async seed() {
    try {
      const usersSnap = await this.db.collection('users').limit(1).get();
      if (usersSnap.empty) {
        console.log("Seeding default users to Firestore...");
        const users: User[] = [
          { id: "U001", name: "Rajesh Kumar", email: "admin@retailpro.com", password: "admin123", phone: "9876543210", pin: "1234", role: "ADMIN", status: "Active", joinedDate: "2024-01-15" },
          { id: "U002", name: "Priya Sharma", email: "priya@retailpro.com", password: "priya123", phone: "9876543211", pin: "2345", role: "CASHIER", status: "Active", joinedDate: "2024-03-20" },
          { id: "U003", name: "Amit Patel", email: "amit@retailpro.com", password: "amit123", phone: "9876543212", pin: "3456", role: "STOCK_CLERK", status: "Active", joinedDate: "2024-06-10" },
          { id: "U004", name: "Sneha Reddy", email: "sneha@retailpro.com", password: "sneha123", phone: "9876543213", pin: "4567", role: "CASHIER", status: "Active", joinedDate: "2024-08-05" },
          { id: "U005", name: "Vikram Singh", email: "vikram@retailpro.com", password: "vikram123", phone: "9876543214", pin: "5678", role: "STOCK_CLERK", status: "Inactive", joinedDate: "2024-12-01" },
        ];
        for (const u of users) {
          await this.db.collection('users').doc(u.id).set(u);
        }
        console.log("Users seeding verified.");
      }

      const productsSnap = await this.db.collection('products').limit(1).get();
      if (productsSnap.empty) {
        console.log("Seeding default products to Firestore...");

        const now = new Date();
        const fmt = (d: Date) => d.toISOString().split("T")[0];
        const futureDate = (days: number) => { const d = new Date(now); d.setDate(d.getDate() + days); return fmt(d); };
        const pastDate = (days: number) => { const d = new Date(now); d.setDate(d.getDate() - days); return fmt(d); };

        const products: Product[] = [
          // Groceries
          { id: "P001", name: "Tata Salt (1kg)", sku: "GR001", barcode: "8901234567890", category: "Groceries", sellingPrice: 28, costPrice: 22, stock: 450, minStock: 50, unit: "kg", gstRate: 5, manufacturingDate: pastDate(60), expiryDate: futureDate(180), supplier: "Tata Consumer", batchNo: "B2024-001", section: "Aisle 1", lastUpdated: fmt(now) },
          { id: "P002", name: "Fortune Sunflower Oil (1L)", sku: "GR002", barcode: "8901234567891", category: "Groceries", sellingPrice: 155, costPrice: 130, stock: 200, minStock: 30, unit: "L", gstRate: 5, manufacturingDate: pastDate(45), expiryDate: futureDate(90), supplier: "Adani Wilmar", batchNo: "B2024-002", section: "Aisle 1", lastUpdated: fmt(now) },
          { id: "P003", name: "Aashirvaad Atta (5kg)", sku: "GR003", barcode: "8901234567892", category: "Groceries", sellingPrice: 275, costPrice: 230, stock: 150, minStock: 40, unit: "kg", gstRate: 0, manufacturingDate: pastDate(20), expiryDate: futureDate(120), supplier: "ITC Limited", batchNo: "B2024-003", section: "Aisle 2", lastUpdated: fmt(now) },
          { id: "P004", name: "Daawat Basmati Rice (5kg)", sku: "GR004", barcode: "8901234567893", category: "Groceries", sellingPrice: 650, costPrice: 500, stock: 80, minStock: 20, unit: "kg", gstRate: 5, manufacturingDate: pastDate(90), expiryDate: futureDate(365), supplier: "LT Foods", batchNo: "B2024-004", section: "Aisle 2", lastUpdated: fmt(now) },
          { id: "P005", name: "Toor Dal (1kg)", sku: "GR005", barcode: "8901234567894", category: "Groceries", sellingPrice: 160, costPrice: 130, stock: 300, minStock: 50, unit: "kg", gstRate: 5, manufacturingDate: pastDate(30), expiryDate: futureDate(150), supplier: "Local Mills", batchNo: "B2024-005", section: "Aisle 2", lastUpdated: fmt(now) },

          // Dairy
          { id: "P006", name: "Amul Butter (500g)", sku: "DR001", barcode: "8901234567895", category: "Dairy", sellingPrice: 285, costPrice: 250, stock: 60, minStock: 15, unit: "pc", gstRate: 12, manufacturingDate: pastDate(10), expiryDate: futureDate(180), supplier: "Amul", batchNo: "B2024-006", section: "Fridge 1", lastUpdated: fmt(now) },
          { id: "P007", name: "Amul Cheese Slices (10 pack)", sku: "DR002", barcode: "8901234567896", category: "Dairy", sellingPrice: 140, costPrice: 115, stock: 100, minStock: 20, unit: "pk", gstRate: 12, manufacturingDate: pastDate(40), expiryDate: futureDate(200), supplier: "Amul", batchNo: "B2024-007", section: "Fridge 1", lastUpdated: fmt(now) },
          { id: "P008", name: "Mother Dairy Milk (1L)", sku: "DR003", barcode: "8901234567897", category: "Dairy", sellingPrice: 72, costPrice: 65, stock: 50, minStock: 10, unit: "pk", gstRate: 5, manufacturingDate: pastDate(2), expiryDate: futureDate(2), supplier: "Mother Dairy", batchNo: "B2024-008", section: "Fridge 1", lastUpdated: fmt(now) },

          // Household
          { id: "P009", name: "Surf Excel Matic (2kg)", sku: "HH001", barcode: "8901234567898", category: "Household", sellingPrice: 480, costPrice: 380, stock: 120, minStock: 25, unit: "kg", gstRate: 18, manufacturingDate: pastDate(60), expiryDate: futureDate(730), supplier: "Hindustan Unilever", batchNo: "B2024-009", section: "Aisle 3", lastUpdated: fmt(now) },
          { id: "P010", name: "Vim Dishwash Gel (750ml)", sku: "HH002", barcode: "8901234567899", category: "Household", sellingPrice: 180, costPrice: 140, stock: 180, minStock: 40, unit: "btl", gstRate: 18, manufacturingDate: pastDate(45), expiryDate: futureDate(365), supplier: "Hindustan Unilever", batchNo: "B2024-010", section: "Aisle 3", lastUpdated: fmt(now) },
          { id: "P011", name: "Lizol Floor Cleaner (1L)", sku: "HH003", barcode: "8901234567900", category: "Household", sellingPrice: 220, costPrice: 175, stock: 140, minStock: 35, unit: "btl", gstRate: 18, manufacturingDate: pastDate(50), expiryDate: futureDate(730), supplier: "Reckitt Benckiser", batchNo: "B2024-011", section: "Aisle 3", lastUpdated: fmt(now) },

          // Personal Care
          { id: "P012", name: "Colgate Strong Teeth (200g)", sku: "PC001", barcode: "8901234567901", category: "Personal Care", sellingPrice: 110, costPrice: 85, stock: 250, minStock: 50, unit: "pc", gstRate: 18, manufacturingDate: pastDate(30), expiryDate: futureDate(365), supplier: "Colgate-Palmolive", batchNo: "B2024-012", section: "Aisle 4", lastUpdated: fmt(now) },
          { id: "P013", name: "Dove Moisture Soap (3x100g)", sku: "PC002", barcode: "8901234567902", category: "Personal Care", sellingPrice: 195, costPrice: 155, stock: 200, minStock: 40, unit: "pk", gstRate: 18, manufacturingDate: pastDate(40), expiryDate: futureDate(730), supplier: "Hindustan Unilever", batchNo: "B2024-013", section: "Aisle 4", lastUpdated: fmt(now) },
          { id: "P014", name: "Parachute Coconut Oil (250ml)", sku: "PC003", barcode: "8901234567903", category: "Personal Care", sellingPrice: 125, costPrice: 105, stock: 300, minStock: 60, unit: "btl", gstRate: 12, manufacturingDate: pastDate(20), expiryDate: futureDate(540), supplier: "Marico", batchNo: "B2024-014", section: "Aisle 4", lastUpdated: fmt(now) },

          // Beverages
          { id: "P015", name: "Coca Cola (2L)", sku: "BV001", barcode: "8901234567904", category: "Beverages", sellingPrice: 95, costPrice: 75, stock: 120, minStock: 30, unit: "btl", gstRate: 28, manufacturingDate: pastDate(15), expiryDate: futureDate(120), supplier: "Coca-Cola", batchNo: "B2024-015", section: "Fridge 2", lastUpdated: fmt(now) },
          { id: "P016", name: "Nescafe Classic Coffee (100g)", sku: "BV002", barcode: "8901234567905", category: "Beverages", sellingPrice: 320, costPrice: 260, stock: 100, minStock: 25, unit: "jar", gstRate: 18, manufacturingDate: pastDate(60), expiryDate: futureDate(365), supplier: "Nestle", batchNo: "B2024-016", section: "Aisle 5", lastUpdated: fmt(now) },
          { id: "P017", name: "Red Label Tea (500g)", sku: "BV003", barcode: "8901234567906", category: "Beverages", sellingPrice: 280, costPrice: 230, stock: 180, minStock: 45, unit: "pk", gstRate: 5, manufacturingDate: pastDate(30), expiryDate: futureDate(270), supplier: "Hindustan Unilever", batchNo: "B2024-017", section: "Aisle 5", lastUpdated: fmt(now) },

          // Snacks & Others
          { id: "P018", name: "Lays Magic Masala (50g)", sku: "SN001", barcode: "8901234567907", category: "Snacks", sellingPrice: 20, costPrice: 15, stock: 500, minStock: 100, unit: "pk", gstRate: 12, manufacturingDate: pastDate(10), expiryDate: futureDate(90), supplier: "PepsiCo", batchNo: "B2024-018", section: "Aisle 6", lastUpdated: fmt(now) },
          { id: "P019", name: "Britannia Good Day Cashew (200g)", sku: "SN002", barcode: "8901234567908", category: "Snacks", sellingPrice: 40, costPrice: 32, stock: 300, minStock: 60, unit: "pk", gstRate: 12, manufacturingDate: pastDate(25), expiryDate: futureDate(150), supplier: "Britannia", batchNo: "B2024-019", section: "Aisle 6", lastUpdated: fmt(now) },
          { id: "P020", name: "McCain French Fries (400g)", sku: "FZ001", barcode: "8901234567909", category: "Frozen Foods", sellingPrice: 135, costPrice: 105, stock: 80, minStock: 15, unit: "pk", gstRate: 12, manufacturingDate: pastDate(30), expiryDate: futureDate(270), supplier: "McCain", batchNo: "B2024-020", section: "Freezer 1", lastUpdated: fmt(now) },
        ];

        for (const p of products) {
          await this.db.collection('products').doc(p.id).set(p);
        }
        console.log("Products seeding verified.");
      }

      // Seed Attendance if empty
      const attSnap = await this.db.collection('attendance').limit(1).get();
      if (attSnap.empty) {
        console.log("Seeding attendance data to Firestore...");
        const staffMembers = [
          { id: 'U001', name: 'Rajesh Kumar', role: 'ADMIN' },
          { id: 'U002', name: 'Priya Sharma', role: 'CASHIER' },
          { id: 'U003', name: 'Amit Patel', role: 'STOCK_CLERK' },
          { id: 'U004', name: 'Sneha Reddy', role: 'CASHIER' },
          { id: 'U005', name: 'Vikram Singh', role: 'STOCK_CLERK' },
        ];
        const shifts: ('Morning' | 'Afternoon')[] = ['Morning', 'Morning', 'Afternoon', 'Morning', 'Morning'];
        const statusMatrix: ('Present' | 'Late' | 'Absent')[][] = [
          ['Present', 'Present', 'Late', 'Present', 'Absent'],
          ['Present', 'Present', 'Present', 'Late', 'Absent'],
          ['Present', 'Late', 'Present', 'Present', 'Present'],
          ['Present', 'Present', 'Absent', 'Present', 'Late'],
          ['Present', 'Present', 'Present', 'Present', 'Present'],
        ];
        const checkIns = [['09:00', '08:55', '09:15', '13:00', ''], ['09:01', '09:00', '09:05', '13:20', ''], ['09:02', '09:35', '09:00', '13:00', '09:00'], ['09:00', '09:00', '', '13:10', '09:40'], ['09:00', '09:00', '09:00', '13:00', '09:00']];
        const checkOuts = [['18:00', '17:05', '-', '-', ''], ['18:00', '18:00', '18:00', '-', ''], ['18:00', '17:55', '18:00', '21:05', '18:00'], ['18:00', '18:00', '', '-', '18:00'], ['18:00', '18:00', '18:00', '21:00', '18:00']];
        const nowTs = new Date();
        for (let dayOffset = 0; dayOffset < 5; dayOffset++) {
          const d = new Date(nowTs);
          d.setDate(d.getDate() - dayOffset);
          const dateStr = d.toISOString().split('T')[0];
          for (let si = 0; si < staffMembers.length; si++) {
            const staff = staffMembers[si];
            const status = statusMatrix[dayOffset][si];
            const rec: Attendance = {
              id: `ATT-${dateStr}-${staff.id}`,
              userId: staff.id,
              userName: staff.name,
              date: dateStr,
              checkIn: status === 'Absent' ? '-' : checkIns[dayOffset][si],
              checkOut: status === 'Absent' ? '-' : checkOuts[dayOffset][si],
              shift: shifts[si],
              status,
            };
            await this.db.collection('attendance').doc(rec.id).set(rec);
          }
        }
        // Seed Session Logs if empty
        const sessSnap = await this.db.collection('sessionLogs').limit(1).get();
        if (sessSnap.empty) {
          const sessNow = new Date();
          const sessions: SessionLog[] = [
            { id: 'SL001', userId: 'U001', userName: 'Rajesh Kumar', userRole: 'ADMIN', loginTime: new Date(sessNow.getTime() - 2 * 3600000).toISOString(), logoutTime: '', duration: '', status: 'Active' },
            { id: 'SL002', userId: 'U002', userName: 'Priya Sharma', userRole: 'CASHIER', loginTime: new Date(sessNow.getTime() - 8 * 3600000).toISOString(), logoutTime: new Date(sessNow.getTime() - 1 * 3600000).toISOString(), duration: '7h 0m', status: 'Ended' },
            { id: 'SL003', userId: 'U004', userName: 'Sneha Reddy', userRole: 'CASHIER', loginTime: new Date(sessNow.getTime() - 5 * 3600000).toISOString(), logoutTime: '', duration: '', status: 'Active' },
          ];
          for (const s of sessions) {
            await this.db.collection('sessionLogs').doc(s.id).set(s);
          }
        }
        console.log("Attendance seeding verified.");
      }
    } catch (e) {
      console.error("Error seeding Firestore:", e);
    }
  }

  // Helper to convert Firestore doc to object
  private docToObj<T>(doc: FirebaseFirestore.QueryDocumentSnapshot): T {
    const data = doc.data();
    // Convert timestamps back to ISO strings if needed, but for simplicity returning as is
    return { ...data, id: doc.id } as T;
  }

  async getUsers(): Promise<User[]> {
    const snap = await this.db.collection('users').get();
    return snap.docs.map(d => this.docToObj<User>(d));
  }
  async getUser(id: string): Promise<User | undefined> {
    const doc = await this.db.collection('users').doc(id).get();
    return doc.exists ? { ...doc.data(), id: doc.id } as User : undefined;
  }
  async getUserByEmail(email: string): Promise<User | undefined> {
    const snap = await this.db.collection('users').where('email', '==', email).limit(1).get();
    if (snap.empty) return undefined;
    return this.docToObj<User>(snap.docs[0]);
  }
  async getUserByPin(pin: string): Promise<User | undefined> {
    const snap = await this.db.collection('users').where('pin', '==', pin).limit(1).get();
    if (snap.empty) return undefined;
    return this.docToObj<User>(snap.docs[0]);
  }
  async createUser(user: Omit<User, "id">): Promise<User> {
    const ref = await this.db.collection('users').add(user);
    const doc = await ref.get();
    return { ...doc.data(), id: doc.id } as User;
  }
  async updateUser(id: string, data: Partial<User>): Promise<User | undefined> {
    await this.db.collection('users').doc(id).update(data);
    return this.getUser(id);
  }
  async deleteUser(id: string): Promise<boolean> {
    await this.db.collection('users').doc(id).delete();
    return true;
  }

  async getProducts(): Promise<Product[]> {
    const snap = await this.db.collection('products').get();
    return snap.docs.map(d => this.docToObj<Product>(d));
  }
  async getProduct(id: string): Promise<Product | undefined> {
    const doc = await this.db.collection('products').doc(id).get();
    return doc.exists ? { ...doc.data(), id: doc.id } as Product : undefined;
  }
  async createProduct(product: Omit<Product, "id">): Promise<Product> {
    const ref = await this.db.collection('products').add(product);
    const doc = await ref.get();
    return { ...doc.data(), id: doc.id } as Product;
  }
  async updateProduct(id: string, data: Partial<Product>): Promise<Product | undefined> {
    await this.db.collection('products').doc(id).update(data);
    return this.getProduct(id);
  }
  async deleteProduct(id: string): Promise<boolean> {
    await this.db.collection('products').doc(id).delete();
    return true;
  }
  async updateStock(id: string, qty: number): Promise<Product | undefined> {
    const ref = this.db.collection('products').doc(id);
    await this.db.runTransaction(async (t) => {
      const doc = await t.get(ref);
      if (!doc.exists) throw new Error("Product not found");
      const current = doc.data()?.stock || 0;
      t.update(ref, {
        stock: current + qty,
        lastUpdated: new Date().toISOString().split("T")[0]
      });
    });
    return this.getProduct(id);
  }

  async getTransactions(): Promise<Transaction[]> {
    const snap = await this.db.collection('transactions').orderBy('createdAt', 'desc').get();
    return snap.docs.map(d => this.docToObj<Transaction>(d));
  }
  async getTransaction(id: string): Promise<Transaction | undefined> {
    const doc = await this.db.collection('transactions').doc(id).get();
    return doc.exists ? { ...doc.data(), id: doc.id } as Transaction : undefined;
  }
  async createTransaction(tx: Omit<Transaction, "id">): Promise<Transaction> {
    const ref = await this.db.collection('transactions').add(tx);
    const doc = await ref.get();
    return { ...doc.data(), id: doc.id } as Transaction;
  }

  async getActivityLogs(): Promise<ActivityLog[]> {
    const snap = await this.db.collection('activityLogs').orderBy('timestamp', 'desc').limit(50).get();
    return snap.docs.map(d => this.docToObj<ActivityLog>(d));
  }
  async addActivityLog(log: Omit<ActivityLog, "id">): Promise<ActivityLog> {
    const ref = await this.db.collection('activityLogs').add(log);
    const doc = await ref.get();
    return { ...doc.data(), id: doc.id } as ActivityLog;
  }

  async getAttendance(): Promise<Attendance[]> {
    const snap = await this.db.collection('attendance').orderBy('date', 'desc').get();
    return snap.docs.map(d => this.docToObj<Attendance>(d));
  }
  async getSessionLogs(): Promise<SessionLog[]> {
    const snap = await this.db.collection('sessionLogs').orderBy('loginTime', 'desc').get();
    return snap.docs.map(d => this.docToObj<SessionLog>(d));
  }
}

// Logic to select storage
const serviceAccountPath = path.resolve(__dirname, 'serviceAccountKey.json');
const useFirebase = fs.existsSync(serviceAccountPath) || process.env.GOOGLE_APPLICATION_CREDENTIALS;

export const storage: IStorage = useFirebase
  ? new FirebaseStorage(serviceAccountPath)
  : new MemStorage();

// If upgrading to Firebase but no data, seed it (optional implementation)
// For simplicity, we stick to MemStorage default data or empty Firebase
