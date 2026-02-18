import { randomUUID } from "crypto";

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

class RetailStorage {
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
    const pastDate = (days: number) => { const d = new Date(now); d.setDate(d.getDate() - days); return fmt(d); };

    const products: Product[] = [
      { id: "P001", name: "Tata Salt (1kg)", sku: "TS001", barcode: "8901234567890", category: "Groceries", sellingPrice: 28, costPrice: 22, stock: 450, minStock: 50, unit: "kg", gstRate: 5, manufacturingDate: "2025-06-01", expiryDate: futureDate(180), supplier: "Tata Consumer", batchNo: "B2024-001", section: "Aisle 1", lastUpdated: fmt(now) },
      { id: "P002", name: "Fortune Sunflower Oil (1L)", sku: "FS001", barcode: "8901234567891", category: "Groceries", sellingPrice: 155, costPrice: 130, stock: 200, minStock: 30, unit: "L", gstRate: 5, manufacturingDate: "2025-05-15", expiryDate: futureDate(25), supplier: "Adani Wilmar", batchNo: "B2024-002", section: "Aisle 1", lastUpdated: fmt(now) },
      { id: "P003", name: "Surf Excel Matic (2kg)", sku: "SE001", barcode: "8901234567892", category: "Household", sellingPrice: 480, costPrice: 380, stock: 120, minStock: 20, unit: "kg", gstRate: 18, manufacturingDate: "2025-04-01", expiryDate: futureDate(365), supplier: "Hindustan Unilever", batchNo: "B2024-003", section: "Aisle 3", lastUpdated: fmt(now) },
      { id: "P004", name: "Colgate MaxFresh (150g)", sku: "CM001", barcode: "8901234567893", category: "Personal Care", sellingPrice: 95, costPrice: 75, stock: 340, minStock: 40, unit: "pcs", gstRate: 18, manufacturingDate: "2025-03-01", expiryDate: futureDate(300), supplier: "Colgate-Palmolive", batchNo: "B2024-004", section: "Aisle 2", lastUpdated: fmt(now) },
      { id: "P005", name: "Amul Butter (500g)", sku: "AB001", barcode: "8901234567894", category: "Dairy", sellingPrice: 270, costPrice: 230, stock: 85, minStock: 20, unit: "pcs", gstRate: 12, manufacturingDate: "2025-08-01", expiryDate: futureDate(45), supplier: "Gujarat Co-op", batchNo: "B2024-005", section: "Aisle 4", lastUpdated: fmt(now) },
      { id: "P006", name: "Lays Classic Salted (52g)", sku: "LC001", barcode: "8901234567895", category: "Snacks", sellingPrice: 20, costPrice: 15, stock: 600, minStock: 100, unit: "pcs", gstRate: 12, manufacturingDate: "2025-07-01", expiryDate: futureDate(90), supplier: "PepsiCo India", batchNo: "B2024-006", section: "Aisle 5", lastUpdated: fmt(now) },
      { id: "P007", name: "Coca Cola (750ml)", sku: "CC001", barcode: "8901234567896", category: "Beverages", sellingPrice: 40, costPrice: 32, stock: 500, minStock: 80, unit: "pcs", gstRate: 28, manufacturingDate: "2025-06-15", expiryDate: futureDate(120), supplier: "Hindustan Coca-Cola", batchNo: "B2024-007", section: "Aisle 5", lastUpdated: fmt(now) },
      { id: "P008", name: "Aashirvaad Atta (5kg)", sku: "AA001", barcode: "8901234567897", category: "Groceries", sellingPrice: 295, costPrice: 250, stock: 200, minStock: 30, unit: "kg", gstRate: 5, manufacturingDate: "2025-05-01", expiryDate: futureDate(180), supplier: "ITC Limited", batchNo: "B2024-008", section: "Aisle 1", lastUpdated: fmt(now) },
      { id: "P009", name: "Dettol Handwash (250ml)", sku: "DH001", barcode: "8901234567898", category: "Personal Care", sellingPrice: 99, costPrice: 75, stock: 25, minStock: 30, unit: "pcs", gstRate: 18, manufacturingDate: "2025-04-01", expiryDate: futureDate(5), supplier: "Reckitt Benckiser", batchNo: "B2024-009", section: "Aisle 2", lastUpdated: fmt(now) },
      { id: "P010", name: "Maggi Noodles (Pack of 12)", sku: "MN001", barcode: "8901234567899", category: "Snacks", sellingPrice: 168, costPrice: 140, stock: 18, minStock: 25, unit: "pcs", gstRate: 12, manufacturingDate: "2025-03-01", expiryDate: futureDate(150), supplier: "Nestle India", batchNo: "B2024-010", section: "Aisle 5", lastUpdated: fmt(now) },
      { id: "P011", name: "Vim Dishwash Bar (300g)", sku: "VD001", barcode: "8901234567900", category: "Household", sellingPrice: 32, costPrice: 24, stock: 380, minStock: 50, unit: "pcs", gstRate: 18, manufacturingDate: "2025-05-01", expiryDate: futureDate(365), supplier: "Hindustan Unilever", batchNo: "B2024-011", section: "Aisle 3", lastUpdated: fmt(now) },
      { id: "P012", name: "Mother Dairy Milk (1L)", sku: "MD001", barcode: "8901234567901", category: "Dairy", sellingPrice: 66, costPrice: 56, stock: 180, minStock: 40, unit: "L", gstRate: 5, manufacturingDate: "2025-09-01", expiryDate: futureDate(10), supplier: "Mother Dairy", batchNo: "B2024-012", section: "Aisle 4", lastUpdated: fmt(now) },
      { id: "P013", name: "McCain French Fries (450g)", sku: "MF001", barcode: "8901234567902", category: "Frozen Foods", sellingPrice: 199, costPrice: 155, stock: 65, minStock: 15, unit: "pcs", gstRate: 12, manufacturingDate: "2025-04-01", expiryDate: futureDate(200), supplier: "McCain Foods", batchNo: "B2024-013", section: "Aisle 6", lastUpdated: fmt(now) },
      { id: "P014", name: "Red Bull Energy Drink (250ml)", sku: "RB001", barcode: "8901234567903", category: "Beverages", sellingPrice: 115, costPrice: 90, stock: 200, minStock: 30, unit: "pcs", gstRate: 28, manufacturingDate: "2025-06-01", expiryDate: futureDate(365), supplier: "Red Bull India", batchNo: "B2024-014", section: "Aisle 5", lastUpdated: fmt(now) },
      { id: "P015", name: "Dove Shampoo (340ml)", sku: "DS001", barcode: "8901234567904", category: "Personal Care", sellingPrice: 320, costPrice: 260, stock: 90, minStock: 20, unit: "pcs", gstRate: 18, manufacturingDate: "2025-05-01", expiryDate: futureDate(400), supplier: "Hindustan Unilever", batchNo: "B2024-015", section: "Aisle 2", lastUpdated: fmt(now) },
      { id: "P016", name: "Amul Taza Milk 500ml", sku: "AM001", barcode: "8901234567905", category: "Dairy", sellingPrice: 25, costPrice: 20, stock: 5, minStock: 20, unit: "pcs", gstRate: 5, manufacturingDate: "2025-09-10", expiryDate: futureDate(3), supplier: "Gujarat Co-op", batchNo: "B2024-016", section: "Aisle 4", lastUpdated: fmt(now) },
      { id: "P017", name: "Britannia Bread", sku: "BB001", barcode: "8901234567906", category: "Dairy", sellingPrice: 45, costPrice: 35, stock: 60, minStock: 15, unit: "pcs", gstRate: 5, manufacturingDate: "2025-09-12", expiryDate: futureDate(5), supplier: "Britannia", batchNo: "B2024-017", section: "Aisle 4", lastUpdated: fmt(now) },
      { id: "P018", name: "Parle-G Biscuits (800g)", sku: "PG001", barcode: "8901234567907", category: "Snacks", sellingPrice: 80, costPrice: 65, stock: 350, minStock: 50, unit: "pcs", gstRate: 12, manufacturingDate: "2025-06-01", expiryDate: futureDate(240), supplier: "Parle Products", batchNo: "B2024-018", section: "Aisle 5", lastUpdated: fmt(now) },
      { id: "P019", name: "Harpic Toilet Cleaner (500ml)", sku: "HT001", barcode: "8901234567908", category: "Household", sellingPrice: 89, costPrice: 68, stock: 150, minStock: 25, unit: "pcs", gstRate: 18, manufacturingDate: "2025-04-01", expiryDate: futureDate(500), supplier: "Reckitt Benckiser", batchNo: "B2024-019", section: "Aisle 3", lastUpdated: fmt(now) },
      { id: "P020", name: "Clinic Plus Shampoo (175ml)", sku: "CP001", barcode: "8901234567909", category: "Personal Care", sellingPrice: 95, costPrice: 72, stock: 220, minStock: 30, unit: "pcs", gstRate: 18, manufacturingDate: "2025-05-01", expiryDate: futureDate(400), supplier: "Hindustan Unilever", batchNo: "B2024-020", section: "Aisle 2", lastUpdated: fmt(now) },
      { id: "P021", name: "Haldiram's Aloo Bhujia (400g)", sku: "HA001", barcode: "8901234567910", category: "Snacks", sellingPrice: 120, costPrice: 95, stock: 180, minStock: 25, unit: "pcs", gstRate: 12, manufacturingDate: "2025-07-01", expiryDate: futureDate(180), supplier: "Haldiram's", batchNo: "B2024-021", section: "Aisle 5", lastUpdated: fmt(now) },
      { id: "P022", name: "Nescafe Classic (100g)", sku: "NC001", barcode: "8901234567911", category: "Beverages", sellingPrice: 245, costPrice: 200, stock: 130, minStock: 20, unit: "pcs", gstRate: 18, manufacturingDate: "2025-05-01", expiryDate: futureDate(365), supplier: "Nestle India", batchNo: "B2024-022", section: "Aisle 1", lastUpdated: fmt(now) },
      { id: "P023", name: "Dabur Honey (500g)", sku: "DH002", barcode: "8901234567912", category: "Groceries", sellingPrice: 210, costPrice: 170, stock: 95, minStock: 15, unit: "pcs", gstRate: 5, manufacturingDate: "2025-04-01", expiryDate: futureDate(500), supplier: "Dabur India", batchNo: "B2024-023", section: "Aisle 1", lastUpdated: fmt(now) },
      { id: "P024", name: "Lizol Floor Cleaner (975ml)", sku: "LF001", barcode: "8901234567913", category: "Household", sellingPrice: 165, costPrice: 130, stock: 110, minStock: 20, unit: "pcs", gstRate: 18, manufacturingDate: "2025-05-01", expiryDate: futureDate(500), supplier: "Reckitt Benckiser", batchNo: "B2024-024", section: "Aisle 3", lastUpdated: fmt(now) },
      { id: "P025", name: "Himalaya Face Wash (150ml)", sku: "HF001", barcode: "8901234567914", category: "Personal Care", sellingPrice: 175, costPrice: 140, stock: 160, minStock: 25, unit: "pcs", gstRate: 18, manufacturingDate: "2025-06-01", expiryDate: futureDate(400), supplier: "Himalaya Wellness", batchNo: "B2024-025", section: "Aisle 2", lastUpdated: fmt(now) },
      { id: "P026", name: "Pepsi (2L)", sku: "PP001", barcode: "8901234567915", category: "Beverages", sellingPrice: 85, costPrice: 68, stock: 300, minStock: 50, unit: "pcs", gstRate: 28, manufacturingDate: "2025-06-01", expiryDate: futureDate(150), supplier: "PepsiCo India", batchNo: "B2024-026", section: "Aisle 5", lastUpdated: fmt(now) },
      { id: "P027", name: "Toor Dal (1kg)", sku: "TD001", barcode: "8901234567916", category: "Groceries", sellingPrice: 150, costPrice: 120, stock: 250, minStock: 40, unit: "kg", gstRate: 5, manufacturingDate: "2025-05-01", expiryDate: futureDate(300), supplier: "Tata Consumer", batchNo: "B2024-027", section: "Aisle 1", lastUpdated: fmt(now) },
      { id: "P028", name: "Whisper Ultra (30 pads)", sku: "WU001", barcode: "8901234567917", category: "Personal Care", sellingPrice: 340, costPrice: 280, stock: 140, minStock: 20, unit: "pcs", gstRate: 12, manufacturingDate: "2025-06-01", expiryDate: futureDate(500), supplier: "P&G India", batchNo: "B2024-028", section: "Aisle 2", lastUpdated: fmt(now) },
      { id: "P029", name: "Saffola Gold Oil (1L)", sku: "SG001", barcode: "8901234567918", category: "Groceries", sellingPrice: 185, costPrice: 155, stock: 170, minStock: 25, unit: "L", gstRate: 5, manufacturingDate: "2025-05-01", expiryDate: futureDate(180), supplier: "Marico Limited", batchNo: "B2024-029", section: "Aisle 1", lastUpdated: fmt(now) },
      { id: "P030", name: "Good Day Biscuits (600g)", sku: "GD001", barcode: "8901234567919", category: "Snacks", sellingPrice: 95, costPrice: 75, stock: 280, minStock: 40, unit: "pcs", gstRate: 12, manufacturingDate: "2025-06-01", expiryDate: futureDate(200), supplier: "Britannia", batchNo: "B2024-030", section: "Aisle 5", lastUpdated: fmt(now) },
      { id: "P031", name: "Godrej No.1 Soap (4x100g)", sku: "GN001", barcode: "8901234567920", category: "Personal Care", sellingPrice: 120, costPrice: 95, stock: 200, minStock: 30, unit: "pcs", gstRate: 18, manufacturingDate: "2025-05-01", expiryDate: futureDate(500), supplier: "Godrej Consumer", batchNo: "B2024-031", section: "Aisle 2", lastUpdated: fmt(now) },
      { id: "P032", name: "Real Fruit Juice (1L)", sku: "RF001", barcode: "8901234567921", category: "Beverages", sellingPrice: 99, costPrice: 78, stock: 160, minStock: 25, unit: "pcs", gstRate: 12, manufacturingDate: "2025-06-01", expiryDate: futureDate(180), supplier: "Dabur India", batchNo: "B2024-032", section: "Aisle 5", lastUpdated: fmt(now) },
      { id: "P033", name: "Basmati Rice (5kg)", sku: "BR001", barcode: "8901234567922", category: "Groceries", sellingPrice: 450, costPrice: 380, stock: 120, minStock: 20, unit: "kg", gstRate: 5, manufacturingDate: "2025-04-01", expiryDate: futureDate(365), supplier: "India Gate", batchNo: "B2024-033", section: "Aisle 1", lastUpdated: fmt(now) },
      { id: "P034", name: "Pedigree Dog Food (3kg)", sku: "PD001", barcode: "8901234567923", category: "Groceries", sellingPrice: 550, costPrice: 450, stock: 40, minStock: 10, unit: "kg", gstRate: 18, manufacturingDate: "2025-05-01", expiryDate: futureDate(300), supplier: "Mars India", batchNo: "B2024-034", section: "Aisle 6", lastUpdated: fmt(now) },
      { id: "P035", name: "Amul Cheese Slices (200g)", sku: "AC001", barcode: "8901234567924", category: "Dairy", sellingPrice: 110, costPrice: 88, stock: 75, minStock: 15, unit: "pcs", gstRate: 12, manufacturingDate: "2025-08-15", expiryDate: futureDate(60), supplier: "Gujarat Co-op", batchNo: "B2024-035", section: "Aisle 4", lastUpdated: fmt(now) },
      { id: "P036", name: "Sugar (5kg)", sku: "SU001", barcode: "8901234567925", category: "Groceries", sellingPrice: 220, costPrice: 185, stock: 300, minStock: 50, unit: "kg", gstRate: 5, manufacturingDate: "2025-04-01", expiryDate: futureDate(500), supplier: "Dhampur Sugar", batchNo: "B2024-036", section: "Aisle 1", lastUpdated: fmt(now) },
      { id: "P037", name: "Yakult Probiotic (5x65ml)", sku: "YK001", barcode: "8901234567926", category: "Dairy", sellingPrice: 90, costPrice: 72, stock: 55, minStock: 15, unit: "pcs", gstRate: 5, manufacturingDate: "2025-09-05", expiryDate: futureDate(7), supplier: "Yakult Danone", batchNo: "B2024-037", section: "Aisle 4", lastUpdated: fmt(now) },
      { id: "P038", name: "Eno Fruit Salt (5g x 30)", sku: "EN001", barcode: "8901234567927", category: "Personal Care", sellingPrice: 145, costPrice: 115, stock: 190, minStock: 25, unit: "pcs", gstRate: 12, manufacturingDate: "2025-06-01", expiryDate: futureDate(400), supplier: "GSK India", batchNo: "B2024-038", section: "Aisle 2", lastUpdated: fmt(now) },
      { id: "P039", name: "Kurkure Masala Munch (100g)", sku: "KM001", barcode: "8901234567928", category: "Snacks", sellingPrice: 30, costPrice: 22, stock: 400, minStock: 60, unit: "pcs", gstRate: 12, manufacturingDate: "2025-07-01", expiryDate: futureDate(120), supplier: "PepsiCo India", batchNo: "B2024-039", section: "Aisle 5", lastUpdated: fmt(now) },
      { id: "P040", name: "Ghee Amul (1L)", sku: "GA001", barcode: "8901234567929", category: "Dairy", sellingPrice: 560, costPrice: 480, stock: 60, minStock: 10, unit: "L", gstRate: 12, manufacturingDate: "2025-07-01", expiryDate: futureDate(180), supplier: "Gujarat Co-op", batchNo: "B2024-040", section: "Aisle 4", lastUpdated: fmt(now) },
      { id: "P041", name: "Tide Detergent (2kg)", sku: "TI001", barcode: "8901234567930", category: "Household", sellingPrice: 350, costPrice: 280, stock: 130, minStock: 20, unit: "kg", gstRate: 18, manufacturingDate: "2025-04-01", expiryDate: futureDate(500), supplier: "P&G India", batchNo: "B2024-041", section: "Aisle 3", lastUpdated: fmt(now) },
      { id: "P042", name: "Tropicana Orange Juice (1L)", sku: "TO001", barcode: "8901234567931", category: "Beverages", sellingPrice: 105, costPrice: 82, stock: 140, minStock: 20, unit: "pcs", gstRate: 12, manufacturingDate: "2025-06-01", expiryDate: futureDate(90), supplier: "PepsiCo India", batchNo: "B2024-042", section: "Aisle 5", lastUpdated: fmt(now) },
      { id: "P043", name: "Nivea Body Lotion (400ml)", sku: "NB001", barcode: "8901234567932", category: "Personal Care", sellingPrice: 310, costPrice: 250, stock: 80, minStock: 15, unit: "pcs", gstRate: 18, manufacturingDate: "2025-05-01", expiryDate: futureDate(500), supplier: "Nivea India", batchNo: "B2024-043", section: "Aisle 2", lastUpdated: fmt(now) },
      { id: "P044", name: "Bournvita (500g)", sku: "BV001", barcode: "8901234567933", category: "Beverages", sellingPrice: 230, costPrice: 185, stock: 110, minStock: 20, unit: "pcs", gstRate: 18, manufacturingDate: "2025-05-01", expiryDate: futureDate(365), supplier: "Mondelez India", batchNo: "B2024-044", section: "Aisle 1", lastUpdated: fmt(now) },
      { id: "P045", name: "Cello Pen (Pack of 10)", sku: "CE001", barcode: "8901234567934", category: "Groceries", sellingPrice: 60, costPrice: 45, stock: 500, minStock: 50, unit: "pcs", gstRate: 18, manufacturingDate: "2025-01-01", expiryDate: futureDate(1000), supplier: "Cello Writing", batchNo: "B2024-045", section: "Aisle 6", lastUpdated: fmt(now) },
      { id: "P046", name: "Paneer (200g)", sku: "PN001", barcode: "8901234567935", category: "Dairy", sellingPrice: 80, costPrice: 65, stock: 45, minStock: 15, unit: "pcs", gstRate: 5, manufacturingDate: "2025-09-12", expiryDate: futureDate(4), supplier: "Mother Dairy", batchNo: "B2024-046", section: "Aisle 4", lastUpdated: fmt(now) },
      { id: "P047", name: "Cadbury Dairy Milk (110g)", sku: "CD001", barcode: "8901234567936", category: "Snacks", sellingPrice: 95, costPrice: 78, stock: 250, minStock: 30, unit: "pcs", gstRate: 28, manufacturingDate: "2025-06-01", expiryDate: futureDate(300), supplier: "Mondelez India", batchNo: "B2024-047", section: "Aisle 5", lastUpdated: fmt(now) },
      { id: "P048", name: "Lifebuoy Soap (4x125g)", sku: "LB001", barcode: "8901234567937", category: "Personal Care", sellingPrice: 155, costPrice: 125, stock: 180, minStock: 25, unit: "pcs", gstRate: 18, manufacturingDate: "2025-05-01", expiryDate: futureDate(500), supplier: "Hindustan Unilever", batchNo: "B2024-048", section: "Aisle 2", lastUpdated: fmt(now) },
      { id: "P049", name: "Catch Turmeric Powder (200g)", sku: "CT001", barcode: "8901234567938", category: "Groceries", sellingPrice: 55, costPrice: 42, stock: 300, minStock: 40, unit: "pcs", gstRate: 5, manufacturingDate: "2025-03-01", expiryDate: futureDate(365), supplier: "DS Group", batchNo: "B2024-049", section: "Aisle 1", lastUpdated: fmt(now) },
      { id: "P050", name: "Paper Napkins (100 pcs)", sku: "PAP01", barcode: "8901234567939", category: "Household", sellingPrice: 45, costPrice: 32, stock: 400, minStock: 50, unit: "pcs", gstRate: 12, manufacturingDate: "2025-01-01", expiryDate: futureDate(1000), supplier: "Origami", batchNo: "B2024-050", section: "Aisle 6", lastUpdated: fmt(now) },
    ];
    products.forEach(p => this.products.set(p.id, p));

    const actions = [
      "Sold 5x Amul Milk", "Updated Stock: Surf Excel (+50)", "Added new product: Dove Shampoo",
      "Sold 3x Maggi Noodles", "Performed Stock Audit, Aisle 2", "Sold 2x Colgate MaxFresh",
      "Updated Stock: Fortune Oil (+30)", "Sold 1x Aashirvaad Atta", "Changed Price: Lays Classic to Rs.20",
      "Sold 4x Coca Cola", "Sold 2x Red Bull Energy", "Added employee: Vikram Singh",
      "Updated Stock: Tata Salt (+100)", "Sold 6x Mother Dairy Milk", "Performed Stock Audit, Aisle 4",
      "Sold 3x Dettol Handwash", "Updated Stock: Amul Butter (+25)", "Sold 1x Dove Shampoo",
      "Sold 2x Britannia Bread", "Changed Price: Parle-G to Rs.80", "Sold 5x Lays Classic",
      "Updated Stock: Maggi Noodles (+40)", "Sold 1x Basmati Rice", "Sold 3x Good Day Biscuits",
      "Performed Stock Audit, Aisle 1", "Sold 2x Nescafe Classic", "Updated Stock: Pepsi (+60)",
      "Sold 4x Kurkure Masala", "Sold 1x Ghee Amul", "Added new product: Yakult Probiotic",
      "Sold 2x Paneer", "Updated Stock: Sugar (+80)", "Sold 3x Real Fruit Juice",
      "Changed discount: Cadbury 10% off", "Sold 1x Pedigree Dog Food", "Performed Stock Audit, Aisle 5",
      "Updated Stock: Harpic (+40)", "Sold 2x Haldiram's Bhujia", "Sold 5x Eno Fruit Salt",
      "Sold 3x Tropicana Juice", "Updated Stock: Tide (+35)", "Sold 1x Himalaya Face Wash",
      "Sold 4x Godrej Soap", "Updated Stock: Whisper (+50)", "Sold 2x Clinic Plus Shampoo",
      "Sold 1x Nivea Body Lotion", "Performed Stock Audit, Aisle 3", "Sold 3x Toor Dal",
      "Updated Stock: Bournvita (+20)", "Sold 2x Amul Cheese Slices",
    ];

    const roles = ["ADMIN", "CASHIER", "STOCK_CLERK", "CASHIER", "STOCK_CLERK"];
    const names = ["Rajesh Kumar", "Priya Sharma", "Amit Patel", "Sneha Reddy", "Vikram Singh"];

    for (let i = 0; i < 50; i++) {
      const d = new Date(now);
      d.setMinutes(d.getMinutes() - (i * 15 + Math.floor(Math.random() * 10)));
      const roleIdx = i % 5;
      this.activityLogs.push({
        id: randomUUID(),
        userId: `U00${roleIdx + 1}`,
        userName: names[roleIdx],
        userRole: roles[roleIdx],
        action: actions[i],
        details: actions[i],
        timestamp: d.toISOString(),
      });
    }

    const transactions: Transaction[] = [
      {
        id: "T001", invoiceNo: "INV-2026-0001",
        items: [
          { productId: "P003", productName: "Surf Excel Matic (2kg)", qty: 1, price: 480, gstRate: 18, total: 480 },
          { productId: "P004", productName: "Colgate MaxFresh (150g)", qty: 2, price: 95, gstRate: 18, total: 190 },
          { productId: "P010", productName: "Maggi Noodles (Pack of 12)", qty: 3, price: 168, gstRate: 12, total: 504 },
        ],
        subtotal: 1174, discount: 0, gstAmount: 183.96, total: 1357.96,
        paymentMethod: "Cash", customerPhone: "9876543100",
        cashierId: "U002", cashierName: "Priya Sharma", createdAt: pastDate(0) + "T10:30:00Z",
      },
      {
        id: "T002", invoiceNo: "INV-2026-0002",
        items: [
          { productId: "P012", productName: "Mother Dairy Milk (1L)", qty: 1, price: 66, gstRate: 5, total: 66 },
          { productId: "P005", productName: "Amul Butter (500g)", qty: 1, price: 270, gstRate: 12, total: 270 },
          { productId: "P011", productName: "Vim Dishwash Bar (300g)", qty: 1, price: 32, gstRate: 18, total: 32 },
        ],
        subtotal: 368, discount: 0, gstAmount: 41.06, total: 409.06,
        paymentMethod: "UPI", customerPhone: "",
        cashierId: "U002", cashierName: "Priya Sharma", createdAt: pastDate(0) + "T11:15:00Z",
      },
      {
        id: "T003", invoiceNo: "INV-2026-0003",
        items: [
          { productId: "P008", productName: "Aashirvaad Atta (5kg)", qty: 1, price: 295, gstRate: 5, total: 295 },
          { productId: "P001", productName: "Tata Salt (1kg)", qty: 2, price: 28, gstRate: 5, total: 56 },
          { productId: "P027", productName: "Toor Dal (1kg)", qty: 2, price: 150, gstRate: 5, total: 300 },
        ],
        subtotal: 651, discount: 10, gstAmount: 32.05, total: 673.05,
        paymentMethod: "Card", customerPhone: "9876543101",
        cashierId: "U004", cashierName: "Sneha Reddy", createdAt: pastDate(0) + "T12:00:00Z",
      },
      {
        id: "T004", invoiceNo: "INV-2026-0004",
        items: [
          { productId: "P007", productName: "Coca Cola (750ml)", qty: 4, price: 40, gstRate: 28, total: 160 },
          { productId: "P006", productName: "Lays Classic Salted (52g)", qty: 5, price: 20, gstRate: 12, total: 100 },
        ],
        subtotal: 260, discount: 0, gstAmount: 56.8, total: 316.8,
        paymentMethod: "Cash", customerPhone: "",
        cashierId: "U004", cashierName: "Sneha Reddy", createdAt: pastDate(0) + "T14:30:00Z",
      },
      {
        id: "T005", invoiceNo: "INV-2026-0005",
        items: [
          { productId: "P015", productName: "Dove Shampoo (340ml)", qty: 1, price: 320, gstRate: 18, total: 320 },
          { productId: "P025", productName: "Himalaya Face Wash (150ml)", qty: 1, price: 175, gstRate: 18, total: 175 },
        ],
        subtotal: 495, discount: 0, gstAmount: 89.1, total: 584.1,
        paymentMethod: "UPI", customerPhone: "9876543102",
        cashierId: "U002", cashierName: "Priya Sharma", createdAt: pastDate(1) + "T09:30:00Z",
      },
      {
        id: "T006", invoiceNo: "INV-2026-0006",
        items: [
          { productId: "P022", productName: "Nescafe Classic (100g)", qty: 1, price: 245, gstRate: 18, total: 245 },
          { productId: "P036", productName: "Sugar (5kg)", qty: 1, price: 220, gstRate: 5, total: 220 },
          { productId: "P012", productName: "Mother Dairy Milk (1L)", qty: 2, price: 66, gstRate: 5, total: 132 },
        ],
        subtotal: 597, discount: 15, gstAmount: 60.06, total: 642.06,
        paymentMethod: "Card", customerPhone: "",
        cashierId: "U004", cashierName: "Sneha Reddy", createdAt: pastDate(1) + "T15:00:00Z",
      },
      {
        id: "T007", invoiceNo: "INV-2026-0007",
        items: [
          { productId: "P047", productName: "Cadbury Dairy Milk (110g)", qty: 3, price: 95, gstRate: 28, total: 285 },
          { productId: "P039", productName: "Kurkure Masala Munch (100g)", qty: 4, price: 30, gstRate: 12, total: 120 },
        ],
        subtotal: 405, discount: 0, gstAmount: 94.2, total: 499.2,
        paymentMethod: "Cash", customerPhone: "",
        cashierId: "U002", cashierName: "Priya Sharma", createdAt: pastDate(2) + "T11:00:00Z",
      },
    ];
    transactions.forEach(t => this.transactions.set(t.id, t));

    this.attendance = [
      { id: "A001", userId: "U002", userName: "Priya Sharma", date: fmt(now), checkIn: "08:55", checkOut: "17:05", shift: "Morning", status: "Present" },
      { id: "A002", userId: "U003", userName: "Amit Patel", date: fmt(now), checkIn: "09:15", checkOut: "", shift: "Morning", status: "Late" },
      { id: "A003", userId: "U004", userName: "Sneha Reddy", date: fmt(now), checkIn: "13:00", checkOut: "", shift: "Afternoon", status: "Present" },
      { id: "A004", userId: "U005", userName: "Vikram Singh", date: fmt(now), checkIn: "", checkOut: "", shift: "Morning", status: "Absent" },
      { id: "A005", userId: "U002", userName: "Priya Sharma", date: pastDate(1), checkIn: "09:00", checkOut: "18:00", shift: "Morning", status: "Present" },
      { id: "A006", userId: "U003", userName: "Amit Patel", date: pastDate(1), checkIn: "09:00", checkOut: "18:00", shift: "Morning", status: "Present" },
      { id: "A007", userId: "U004", userName: "Sneha Reddy", date: pastDate(1), checkIn: "13:00", checkOut: "21:00", shift: "Afternoon", status: "Present" },
    ];

    this.sessionLogs = [
      { id: "S001", userId: "U001", userName: "Rajesh Kumar", userRole: "ADMIN", loginTime: fmt(now) + "T07:06:38", logoutTime: "", duration: "", status: "Active" },
      { id: "S002", userId: "U002", userName: "Priya Sharma", userRole: "CASHIER", loginTime: fmt(now) + "T09:00:00", logoutTime: "", duration: "", status: "Active" },
      { id: "S003", userId: "U003", userName: "Amit Patel", userRole: "STOCK_CLERK", loginTime: fmt(now) + "T09:15:00", logoutTime: "", duration: "", status: "Active" },
      { id: "S004", userId: "U004", userName: "Sneha Reddy", userRole: "CASHIER", loginTime: fmt(now) + "T13:00:00", logoutTime: "", duration: "", status: "Active" },
      { id: "S005", userId: "U002", userName: "Priya Sharma", userRole: "CASHIER", loginTime: pastDate(1) + "T08:55:00", logoutTime: pastDate(1) + "T17:05:00", duration: "8h 10m", status: "Ended" },
      { id: "S006", userId: "U003", userName: "Amit Patel", userRole: "STOCK_CLERK", loginTime: pastDate(1) + "T09:00:00", logoutTime: pastDate(1) + "T18:00:00", duration: "9h 0m", status: "Ended" },
    ];
  }

  getUsers(): User[] { return Array.from(this.users.values()); }
  getUser(id: string): User | undefined { return this.users.get(id); }
  getUserByEmail(email: string): User | undefined { return Array.from(this.users.values()).find(u => u.email === email); }
  getUserByPin(pin: string): User | undefined { return Array.from(this.users.values()).find(u => u.pin === pin); }
  createUser(user: Omit<User, "id">): User { const id = "U" + String(this.users.size + 1).padStart(3, "0"); const u = { ...user, id }; this.users.set(id, u); return u; }
  updateUser(id: string, data: Partial<User>): User | undefined { const u = this.users.get(id); if (!u) return undefined; const updated = { ...u, ...data }; this.users.set(id, updated); return updated; }
  deleteUser(id: string): boolean { return this.users.delete(id); }

  getProducts(): Product[] { return Array.from(this.products.values()); }
  getProduct(id: string): Product | undefined { return this.products.get(id); }
  createProduct(product: Omit<Product, "id">): Product { const id = "P" + String(this.products.size + 1).padStart(3, "0"); const p = { ...product, id }; this.products.set(id, p); return p; }
  updateProduct(id: string, data: Partial<Product>): Product | undefined { const p = this.products.get(id); if (!p) return undefined; const updated = { ...p, ...data, lastUpdated: new Date().toISOString().split("T")[0] }; this.products.set(id, updated); return updated; }
  deleteProduct(id: string): boolean { return this.products.delete(id); }
  updateStock(id: string, qty: number): Product | undefined { const p = this.products.get(id); if (!p) return undefined; p.stock += qty; p.lastUpdated = new Date().toISOString().split("T")[0]; return p; }

  getTransactions(): Transaction[] { return Array.from(this.transactions.values()); }
  getTransaction(id: string): Transaction | undefined { return this.transactions.get(id); }
  createTransaction(tx: Omit<Transaction, "id">): Transaction { const id = "T" + String(this.transactions.size + 1).padStart(3, "0"); const t = { ...tx, id }; this.transactions.set(id, t); return t; }

  getActivityLogs(): ActivityLog[] { return this.activityLogs.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()); }
  addActivityLog(log: Omit<ActivityLog, "id">): ActivityLog { const l = { ...log, id: randomUUID() }; this.activityLogs.unshift(l); return l; }

  getAttendance(): Attendance[] { return this.attendance; }
  getSessionLogs(): SessionLog[] { return this.sessionLogs; }
}

export const storage = new RetailStorage();
