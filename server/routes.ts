import type { Express, Request, Response } from "express";
import { createServer, type Server } from "node:http";
import { storage } from "./storage";

export async function registerRoutes(app: Express): Promise<Server> {
  app.post("/api/auth/login", (req: Request, res: Response) => {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ error: "Email and password required" });
    const user = storage.getUserByEmail(email);
    if (!user || user.password !== password) return res.status(401).json({ error: "Invalid credentials" });
    if (user.status === "Inactive") return res.status(403).json({ error: "Account is inactive" });
    const { password: _, ...safe } = user;
    storage.addActivityLog({ userId: user.id, userName: user.name, userRole: user.role, action: "Logged in", details: `${user.name} logged in via email`, timestamp: new Date().toISOString() });
    res.json({ user: safe });
  });

  app.post("/api/auth/pin-login", (req: Request, res: Response) => {
    const { pin } = req.body;
    if (!pin) return res.status(400).json({ error: "PIN required" });
    const user = storage.getUserByPin(pin);
    if (!user) return res.status(401).json({ error: "Invalid PIN" });
    if (user.status === "Inactive") return res.status(403).json({ error: "Account is inactive" });
    const { password: _, ...safe } = user;
    storage.addActivityLog({ userId: user.id, userName: user.name, userRole: user.role, action: "Logged in via PIN", details: `${user.name} logged in via Quick PIN`, timestamp: new Date().toISOString() });
    res.json({ user: safe });
  });

  app.get("/api/users", (_req: Request, res: Response) => {
    const users = storage.getUsers().map(({ password, ...u }) => u);
    res.json(users);
  });

  app.get("/api/users/:id", (req: Request, res: Response) => {
    const user = storage.getUser(req.params.id);
    if (!user) return res.status(404).json({ error: "User not found" });
    const { password, ...safe } = user;
    res.json(safe);
  });

  app.post("/api/users", (req: Request, res: Response) => {
    const { name, email, phone, password, pin, role, status } = req.body;
    if (!name || !email || !password || !pin || !role) return res.status(400).json({ error: "Missing required fields" });
    const existing = storage.getUserByEmail(email);
    if (existing) return res.status(409).json({ error: "Email already exists" });
    const user = storage.createUser({ name, email, phone: phone || "", password, pin, role, status: status || "Active", joinedDate: new Date().toISOString().split("T")[0] });
    storage.addActivityLog({ userId: user.id, userName: user.name, userRole: user.role, action: `Added employee: ${user.name}`, details: `New ${user.role} added`, timestamp: new Date().toISOString() });
    const { password: _, ...safe } = user;
    res.status(201).json(safe);
  });

  app.put("/api/users/:id", (req: Request, res: Response) => {
    const updated = storage.updateUser(req.params.id, req.body);
    if (!updated) return res.status(404).json({ error: "User not found" });
    const { password, ...safe } = updated;
    res.json(safe);
  });

  app.delete("/api/users/:id", (req: Request, res: Response) => {
    const ok = storage.deleteUser(req.params.id);
    if (!ok) return res.status(404).json({ error: "User not found" });
    res.json({ success: true });
  });

  app.get("/api/products", (_req: Request, res: Response) => {
    res.json(storage.getProducts());
  });

  app.get("/api/products/:id", (req: Request, res: Response) => {
    const p = storage.getProduct(req.params.id);
    if (!p) return res.status(404).json({ error: "Product not found" });
    res.json(p);
  });

  app.post("/api/products", (req: Request, res: Response) => {
    const { name, sku, barcode, category, sellingPrice, costPrice, stock, minStock, unit, gstRate, manufacturingDate, expiryDate, supplier, batchNo, section } = req.body;
    if (!name || sellingPrice === undefined || costPrice === undefined) return res.status(400).json({ error: "Missing required fields" });
    if (sellingPrice < 0 || costPrice < 0) return res.status(400).json({ error: "Prices must be positive" });
    if (manufacturingDate && expiryDate && new Date(manufacturingDate) > new Date(expiryDate)) return res.status(400).json({ error: "Manufacturing date cannot be after expiry date" });
    const product = storage.createProduct({
      name, sku: sku || "", barcode: barcode || "", category: category || "Groceries",
      sellingPrice: Number(sellingPrice), costPrice: Number(costPrice),
      stock: Number(stock) || 0, minStock: Number(minStock) || 0,
      unit: unit || "pcs", gstRate: Number(gstRate) || 5,
      manufacturingDate: manufacturingDate || "", expiryDate: expiryDate || "",
      supplier: supplier || "", batchNo: batchNo || "", section: section || "",
      lastUpdated: new Date().toISOString().split("T")[0],
    });
    storage.addActivityLog({ userId: "SYSTEM", userName: "System", userRole: "SYSTEM", action: `Added new product: ${product.name}`, details: `Product ${product.name} added to inventory`, timestamp: new Date().toISOString() });
    res.status(201).json(product);
  });

  app.put("/api/products/:id", (req: Request, res: Response) => {
    const existing = storage.getProduct(req.params.id);
    if (!existing) return res.status(404).json({ error: "Product not found" });
    if (req.body.sellingPrice !== undefined && req.body.costPrice !== undefined) {
      if (Number(req.body.sellingPrice) < Number(req.body.costPrice)) {
        if (!req.body.confirmLoss) return res.status(422).json({ error: "Selling price is less than cost price", requireConfirmation: true });
      }
    }
    const updated = storage.updateProduct(req.params.id, req.body);
    res.json(updated);
  });

  app.delete("/api/products/:id", (req: Request, res: Response) => {
    const ok = storage.deleteProduct(req.params.id);
    if (!ok) return res.status(404).json({ error: "Product not found" });
    res.json({ success: true });
  });

  app.post("/api/products/:id/restock", (req: Request, res: Response) => {
    const { qty } = req.body;
    if (!qty || qty <= 0) return res.status(400).json({ error: "Quantity must be positive" });
    const product = storage.updateStock(req.params.id, Number(qty));
    if (!product) return res.status(404).json({ error: "Product not found" });
    storage.addActivityLog({ userId: "SYSTEM", userName: "System", userRole: "SYSTEM", action: `Updated Stock: ${product.name} (+${qty})`, details: `Stock updated to ${product.stock}`, timestamp: new Date().toISOString() });
    res.json(product);
  });

  app.post("/api/transactions", (req: Request, res: Response) => {
    const { items, paymentMethod, customerPhone, cashierId, cashierName, discount } = req.body;
    if (!items || !items.length) return res.status(400).json({ error: "No items in cart" });

    for (const item of items) {
      const product = storage.getProduct(item.productId);
      if (!product) return res.status(400).json({ error: `Product ${item.productId} not found` });
      if (item.qty > product.stock) return res.status(400).json({ error: `Insufficient stock for ${product.name}. Available: ${product.stock}` });
    }

    let subtotal = 0;
    let gstAmount = 0;
    const txItems: any[] = [];

    for (const item of items) {
      const product = storage.getProduct(item.productId)!;
      const total = product.sellingPrice * item.qty;
      const gst = total * (product.gstRate / 100);
      subtotal += total;
      gstAmount += gst;
      txItems.push({
        productId: product.id, productName: product.name,
        qty: item.qty, price: product.sellingPrice, gstRate: product.gstRate, total,
      });
      storage.updateStock(product.id, -item.qty);
    }

    const discountAmount = Number(discount) || 0;
    const totalAmount = subtotal - discountAmount + gstAmount;
    const invoiceNo = `INV-${new Date().getFullYear()}-${String(storage.getTransactions().length + 1).padStart(4, "0")}`;

    const tx = storage.createTransaction({
      invoiceNo, items: txItems, subtotal, discount: discountAmount,
      gstAmount: Math.round(gstAmount * 100) / 100, total: Math.round(totalAmount * 100) / 100,
      paymentMethod: paymentMethod || "Cash", customerPhone: customerPhone || "",
      cashierId: cashierId || "", cashierName: cashierName || "", createdAt: new Date().toISOString(),
    });

    const itemSummary = txItems.map(i => `${i.qty}x ${i.productName}`).join(", ");
    storage.addActivityLog({
      userId: cashierId || "SYSTEM", userName: cashierName || "System", userRole: "CASHIER",
      action: `Sold ${itemSummary}`, details: `Invoice ${invoiceNo} - Total: Rs.${tx.total}`,
      timestamp: new Date().toISOString(),
    });

    res.status(201).json(tx);
  });

  app.get("/api/transactions", (_req: Request, res: Response) => {
    res.json(storage.getTransactions());
  });

  app.get("/api/transactions/:id", (req: Request, res: Response) => {
    const tx = storage.getTransaction(req.params.id);
    if (!tx) return res.status(404).json({ error: "Transaction not found" });
    res.json(tx);
  });

  app.get("/api/activity-logs", (_req: Request, res: Response) => {
    res.json(storage.getActivityLogs());
  });

  app.get("/api/attendance", (_req: Request, res: Response) => {
    res.json(storage.getAttendance());
  });

  app.get("/api/session-logs", (_req: Request, res: Response) => {
    res.json(storage.getSessionLogs());
  });

  app.get("/api/dashboard/stats", (_req: Request, res: Response) => {
    const transactions = storage.getTransactions();
    const products = storage.getProducts();
    const users = storage.getUsers();
    const now = new Date();
    const today = now.toISOString().split("T")[0];

    const todayTx = transactions.filter(t => t.createdAt.startsWith(today));
    const totalRevenue = transactions.reduce((s, t) => s + t.total, 0);
    const todayRevenue = todayTx.reduce((s, t) => s + t.total, 0);
    const totalCost = transactions.reduce((s, t) => s + t.items.reduce((c, i) => {
      const p = storage.getProduct(i.productId);
      return c + (p ? p.costPrice * i.qty : 0);
    }, 0), 0);
    const netProfit = totalRevenue - totalCost;

    const lowStockProducts = products.filter(p => p.stock <= p.minStock);
    const expiringProducts = products.filter(p => {
      if (!p.expiryDate) return false;
      const diff = (new Date(p.expiryDate).getTime() - now.getTime()) / (1000 * 60 * 60 * 24);
      return diff <= 30 && diff > 0;
    });

    const categoryRevenue: Record<string, number> = {};
    transactions.forEach(t => t.items.forEach(i => {
      const p = storage.getProduct(i.productId);
      if (p) categoryRevenue[p.category] = (categoryRevenue[p.category] || 0) + i.total;
    }));

    const paymentMethods: Record<string, { count: number; total: number }> = {};
    transactions.forEach(t => {
      if (!paymentMethods[t.paymentMethod]) paymentMethods[t.paymentMethod] = { count: 0, total: 0 };
      paymentMethods[t.paymentMethod].count++;
      paymentMethods[t.paymentMethod].total += t.total;
    });

    const last7Days: { date: string; revenue: number; profit: number }[] = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now); d.setDate(d.getDate() - i);
      const ds = d.toISOString().split("T")[0];
      const dayTx = transactions.filter(t => t.createdAt.startsWith(ds));
      const rev = dayTx.reduce((s, t) => s + t.total, 0);
      const cost = dayTx.reduce((s, t) => s + t.items.reduce((c, it) => {
        const p = storage.getProduct(it.productId);
        return c + (p ? p.costPrice * it.qty : 0);
      }, 0), 0);
      last7Days.push({ date: ds, revenue: Math.round(rev * 100) / 100, profit: Math.round((rev - cost) * 100) / 100 });
    }

    const inventoryValue = products.reduce((s, p) => s + p.costPrice * p.stock, 0);
    const activeEmployees = users.filter(u => u.status === "Active").length;
    const totalGst = transactions.reduce((s, t) => s + t.gstAmount, 0);

    res.json({
      totalRevenue: Math.round(totalRevenue * 100) / 100,
      todayRevenue: Math.round(todayRevenue * 100) / 100,
      netProfit: Math.round(netProfit * 100) / 100,
      totalTransactions: transactions.length,
      todayTransactions: todayTx.length,
      totalProducts: products.length,
      lowStockCount: lowStockProducts.length,
      expiringCount: expiringProducts.length,
      activeEmployees,
      inventoryValue: Math.round(inventoryValue),
      totalGst: Math.round(totalGst * 100) / 100,
      categoryRevenue,
      paymentMethods,
      last7Days,
      lowStockProducts: lowStockProducts.map(p => ({ id: p.id, name: p.name, stock: p.stock, minStock: p.minStock })),
      expiringProducts: expiringProducts.map(p => {
        const daysLeft = Math.ceil((new Date(p.expiryDate).getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
        return { id: p.id, name: p.name, expiryDate: p.expiryDate, daysLeft, stock: p.stock, costPrice: p.costPrice, potentialLoss: p.costPrice * p.stock };
      }),
    });
  });

  app.get("/api/reports", (_req: Request, res: Response) => {
    const transactions = storage.getTransactions();
    const products = storage.getProducts();
    const users = storage.getUsers();

    const totalRevenue = transactions.reduce((s, t) => s + t.total, 0);
    const totalCost = transactions.reduce((s, t) => s + t.items.reduce((c, i) => {
      const p = storage.getProduct(i.productId);
      return c + (p ? p.costPrice * i.qty : 0);
    }, 0), 0);
    const totalDiscount = transactions.reduce((s, t) => s + t.discount, 0);
    const totalGst = transactions.reduce((s, t) => s + t.gstAmount, 0);

    const productSales: Record<string, { name: string; qty: number; revenue: number }> = {};
    transactions.forEach(t => t.items.forEach(i => {
      if (!productSales[i.productId]) productSales[i.productId] = { name: i.productName, qty: 0, revenue: 0 };
      productSales[i.productId].qty += i.qty;
      productSales[i.productId].revenue += i.total;
    }));
    const topProducts = Object.values(productSales).sort((a, b) => b.revenue - a.revenue).slice(0, 10);

    const cashierPerf: Record<string, { name: string; transactions: number; revenue: number }> = {};
    transactions.forEach(t => {
      if (!cashierPerf[t.cashierId]) cashierPerf[t.cashierId] = { name: t.cashierName, transactions: 0, revenue: 0 };
      cashierPerf[t.cashierId].transactions++;
      cashierPerf[t.cashierId].revenue += t.total;
    });

    const paymentBreakdown: Record<string, { count: number; total: number }> = {};
    transactions.forEach(t => {
      if (!paymentBreakdown[t.paymentMethod]) paymentBreakdown[t.paymentMethod] = { count: 0, total: 0 };
      paymentBreakdown[t.paymentMethod].count++;
      paymentBreakdown[t.paymentMethod].total += t.total;
    });

    const reorderSuggestions = products.filter(p => p.stock <= p.minStock).map(p => ({
      id: p.id, name: p.name, stock: p.stock, minStock: p.minStock,
      suggestedOrder: p.minStock * 3, estimatedCost: p.costPrice * p.minStock * 3,
    }));

    res.json({
      totalRevenue: Math.round(totalRevenue * 100) / 100,
      netProfit: Math.round((totalRevenue - totalCost) * 100) / 100,
      totalTransactions: transactions.length,
      avgTransaction: transactions.length ? Math.round((totalRevenue / transactions.length) * 100) / 100 : 0,
      totalDiscount: Math.round(totalDiscount * 100) / 100,
      totalGst: Math.round(totalGst * 100) / 100,
      itemsSold: transactions.reduce((s, t) => s + t.items.reduce((c, i) => c + i.qty, 0), 0),
      topProducts,
      cashierPerformance: Object.values(cashierPerf),
      paymentBreakdown,
      reorderSuggestions,
    });
  });

  const httpServer = createServer(app);
  return httpServer;
}
