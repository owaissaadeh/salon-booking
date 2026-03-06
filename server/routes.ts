import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";

const PUBLIC_GET_PATHS = [
  "/services",
  "/barbers",
  "/gallery",
  "/settings",
  "/bookings/available-slots",
];

function requireAuth(req: Request, res: Response, next: NextFunction) {
  if (req.path.startsWith("/auth/")) return next();
  if (req.method === "GET" && PUBLIC_GET_PATHS.some(p => req.path.startsWith(p))) return next();
  if (req.method === "POST" && req.path === "/bookings") return next();
  if (!req.session.userId) {
    return res.status(401).json({ error: "يجب تسجيل الدخول أولاً" });
  }
  next();
}

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {

  app.use("/api", requireAuth);

  // Auth
  app.get("/api/auth/me", (req, res) => {
    if (!req.session.userId) return res.status(401).json({ error: "غير مسجل" });
    res.json({ id: req.session.userId, username: req.session.username, role: req.session.role, name: req.session.name });
  });

  app.post("/api/auth/login", async (req, res) => {
    try {
      const { username, pin } = req.body;
      if (!username || !pin) return res.status(400).json({ error: "يجب إدخال اسم المستخدم والرمز السري" });
      const user = await storage.getStaffUserByUsername(username);
      if (!user || user.pin !== pin || !user.active) {
        return res.status(401).json({ error: "اسم المستخدم أو الرمز السري غير صحيح" });
      }
      req.session.userId = user.id;
      req.session.username = user.username;
      req.session.role = user.role;
      req.session.name = user.name;
      res.json({ id: user.id, name: user.name, role: user.role, username: user.username });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.post("/api/auth/logout", (req, res) => {
    req.session.destroy(() => res.json({ ok: true }));
  });

  // Services
  app.get("/api/services", async (_req, res) => {
    res.json(await storage.getServices());
  });
  app.post("/api/services", async (req, res) => {
    res.json(await storage.createService(req.body));
  });
  app.patch("/api/services/:id", async (req, res) => {
    res.json(await storage.updateService(parseInt(req.params.id), req.body));
  });
  app.delete("/api/services/:id", async (req, res) => {
    await storage.deleteService(parseInt(req.params.id));
    res.json({ ok: true });
  });

  // Barbers
  app.get("/api/barbers", async (_req, res) => {
    res.json(await storage.getBarbers());
  });
  app.post("/api/barbers", async (req, res) => {
    res.json(await storage.createBarber(req.body));
  });
  app.patch("/api/barbers/:id", async (req, res) => {
    res.json(await storage.updateBarber(parseInt(req.params.id), req.body));
  });
  app.delete("/api/barbers/:id", async (req, res) => {
    await storage.deleteBarber(parseInt(req.params.id));
    res.json({ ok: true });
  });

  // Barber profile
  app.get("/api/barbers/:id/profile", async (req, res) => {
    const barberId = parseInt(req.params.id);
    const { from, to } = req.query;
    const fromDate = (from as string) || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];
    const toDate = (to as string) || new Date().toISOString().split("T")[0];

    const barber = await storage.getBarberById(barberId);
    if (!barber) return res.status(404).json({ error: "غير موجود" });

    const txns = await storage.getBarberTransactionsByDateRange(barberId, fromDate, toDate);
    const items = await storage.getBarberTransactionItemsByDateRange(barberId, fromDate, toDate);
    const withdrawals = await storage.getBarberWithdrawals(barberId);

    const servicesRevenue = items.reduce((s, i) => s + i.price, 0);
    const commissionEarned = (servicesRevenue * barber.commission) / 100;
    const totalWithdrawn = withdrawals.reduce((s, w) => s + w.amount, 0);
    const balance = commissionEarned - totalWithdrawn;

    res.json({ barber, fromDate, toDate, servicesRevenue, commissionEarned, totalWithdrawn, balance, transactionCount: txns.length, withdrawals });
  });

  // WhatsApp notification via Callmebot
  async function sendWhatsAppNotification(message: string) {
    try {
      const settings = await storage.getAllSettings();
      const phone = settings["notify_whatsapp_phone"];
      const apikey = settings["notify_whatsapp_apikey"];
      if (!phone || !apikey) return;
      const encoded = encodeURIComponent(message);
      const url = `https://api.callmebot.com/whatsapp.php?phone=${phone}&text=${encoded}&apikey=${apikey}`;
      await fetch(url);
    } catch (err) {
      console.error("[notify] WhatsApp error:", err);
    }
  }

  // Bookings
  app.get("/api/bookings", async (_req, res) => {
    res.json(await storage.getBookings());
  });
  app.post("/api/bookings", async (req, res) => {
    const booking = await storage.createBooking(req.body);
    const allServices = await storage.getServices();
    const svc = allServices.find(s => s.id === booking.serviceId);
    const msg = `حجز جديد في صالون عدنان باشا!\nالاسم: ${booking.visitorName}\nالهاتف: ${booking.phone}\nالخدمة: ${svc?.nameAr || ""}\nالتاريخ: ${booking.date}\nالوقت: ${booking.time}`;
    sendWhatsAppNotification(msg).catch(() => {});
    res.json(booking);
  });
  app.patch("/api/bookings/:id", async (req, res) => {
    await storage.updateBookingStatus(parseInt(req.params.id), req.body.status);
    res.json({ ok: true });
  });

  app.get("/api/bookings/available-slots", async (req, res) => {
    const { serviceId, date, barberId } = req.query;
    if (!serviceId || !date) return res.status(400).json({ error: "بيانات ناقصة" });

    const allServices = await storage.getServices();
    const service = allServices.find(s => s.id === parseInt(serviceId as string));
    if (!service) return res.status(404).json({ error: "الخدمة غير موجودة" });

    const existingBookings = await storage.getBookingsByDate(date as string);
    const activeBookings = existingBookings.filter(b => b.status !== "cancelled");
    const selectedBarberId = barberId ? parseInt(barberId as string) : null;

    const startHour = 9;
    const endHour = 23;
    const allSlots: { time: string; available: boolean }[] = [];

    for (let h = startHour; h < endHour; h++) {
      for (let m = 0; m < 60; m += 30) {
        const timeStr = `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}`;
        const slotStart = h * 60 + m;
        const slotEnd = slotStart + service.duration;
        if (slotEnd > endHour * 60) continue;

        let available = false;

        const overlaps = (b: typeof activeBookings[0]) => {
          const bService = allServices.find(s => s.id === b.serviceId);
          const bDuration = bService?.duration || 30;
          const [bh, bm] = b.time.split(":").map(Number);
          const bStart = bh * 60 + bm;
          const bEnd = bStart + bDuration;
          return slotStart < bEnd && slotEnd > bStart;
        };

        if (service.requiresBarber) {
          if (selectedBarberId) {
            const conflict = activeBookings.some(b => b.barberId === selectedBarberId && overlaps(b));
            available = !conflict;
          } else {
            available = false;
          }
        } else {
          const concurrentCount = activeBookings.filter(b => b.serviceId === service.id && overlaps(b)).length;
          available = concurrentCount < service.maxConcurrent;
        }

        allSlots.push({ time: timeStr, available });
      }
    }
    res.json(allSlots);
  });

  // Products
  app.get("/api/products", async (_req, res) => {
    res.json(await storage.getProducts());
  });
  app.post("/api/products", async (req, res) => {
    res.json(await storage.createProduct(req.body));
  });
  app.patch("/api/products/:id", async (req, res) => {
    res.json(await storage.updateProduct(parseInt(req.params.id), req.body));
  });
  app.delete("/api/products/:id", async (req, res) => {
    await storage.deleteProduct(parseInt(req.params.id));
    res.json({ ok: true });
  });

  // Transactions
  app.post("/api/transactions", async (req, res) => {
    try {
      const { items, products: prodItems, ...transData } = req.body;
      const result = await storage.createFullTransaction(transData, items || [], prodItems || []);
      res.json(result);
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  });

  // Stats
  app.get("/api/stats/today", async (_req, res) => {
    const todayTransactions = await storage.getTodayTransactions();
    const pendingBookings = (await storage.getBookings()).filter(b => b.status === "pending");
    res.json({
      todaySales: todayTransactions.reduce((s, t) => s + t.totalAmount, 0),
      todayServices: todayTransactions.reduce((s, t) => s + t.servicesTotal, 0),
      todayProducts: todayTransactions.reduce((s, t) => s + t.productsTotal, 0),
      totalBookings: pendingBookings.length,
      recentTransactions: todayTransactions.slice(0, 10),
    });
  });

  // Reports
  app.get("/api/reports", async (req, res) => {
    const { from, to } = req.query;
    if (!from || !to) return res.status(400).json({ error: "تواريخ ناقصة" });

    const txns = await storage.getTransactionsByDateRange(from as string, to as string);
    const totalSales = txns.reduce((s, t) => s + t.totalAmount, 0);
    const servicesRevenue = txns.reduce((s, t) => s + t.servicesTotal, 0);
    const productsRevenue = txns.reduce((s, t) => s + t.productsTotal, 0);
    const totalExpenses = (await storage.getExpensesByDateRange(from as string, to as string)).reduce((s, e) => s + e.amount, 0);

    const tItems = await storage.getTransactionItemsByDateRange(from as string, to as string);
    const barberMap = new Map<string, { total: number; commission: number }>();
    for (const item of tItems) {
      const existing = barberMap.get(item.barberName) || { total: 0, commission: item.barberCommission };
      existing.total += item.price;
      barberMap.set(item.barberName, existing);
    }

    const tProducts = await storage.getTransactionProductsByDateRange(from as string, to as string);
    const productMap = new Map<string, { quantity: number; total: number }>();
    for (const p of tProducts) {
      const existing = productMap.get(p.productName) || { quantity: 0, total: 0 };
      existing.quantity += p.quantity;
      existing.total += p.price;
      productMap.set(p.productName, existing);
    }

    res.json({
      totalSales, servicesRevenue, productsRevenue, totalExpenses,
      netProfit: totalSales - totalExpenses,
      barberBreakdown: Array.from(barberMap.entries()).map(([name, data]) => ({
        name, total: data.total, commission: data.commission,
        commissionAmount: (data.total * data.commission) / 100,
      })),
      productsSold: Array.from(productMap.entries()).map(([name, data]) => ({ name, ...data })),
      transactionCount: txns.length,
    });
  });

  // Expenses
  app.get("/api/expenses", async (_req, res) => {
    res.json(await storage.getExpenses());
  });
  app.post("/api/expenses", async (req, res) => {
    res.json(await storage.createExpense(req.body));
  });
  app.delete("/api/expenses/:id", async (req, res) => {
    await storage.deleteExpense(parseInt(req.params.id));
    res.json({ ok: true });
  });

  // Gallery
  app.get("/api/gallery", async (_req, res) => {
    res.json(await storage.getGalleryImages());
  });
  app.post("/api/gallery", async (req, res) => {
    res.json(await storage.createGalleryImage(req.body));
  });
  app.delete("/api/gallery/:id", async (req, res) => {
    await storage.deleteGalleryImage(parseInt(req.params.id));
    res.json({ ok: true });
  });

  // Barber withdrawals
  app.get("/api/barber-withdrawals", async (req, res) => {
    const barberId = req.query.barberId ? parseInt(req.query.barberId as string) : undefined;
    res.json(await storage.getBarberWithdrawals(barberId));
  });
  app.post("/api/barber-withdrawals", async (req, res) => {
    res.json(await storage.createBarberWithdrawal(req.body));
  });
  app.delete("/api/barber-withdrawals/:id", async (req, res) => {
    await storage.deleteBarberWithdrawal(parseInt(req.params.id));
    res.json({ ok: true });
  });

  // Staff users
  app.get("/api/staff", async (_req, res) => {
    const users = await storage.getStaffUsers();
    res.json(users.map(u => ({ ...u, pin: undefined })));
  });
  app.post("/api/staff", async (req, res) => {
    res.json(await storage.createStaffUser(req.body));
  });
  app.patch("/api/staff/:id", async (req, res) => {
    res.json(await storage.updateStaffUser(parseInt(req.params.id), req.body));
  });
  app.delete("/api/staff/:id", async (req, res) => {
    await storage.deleteStaffUser(parseInt(req.params.id));
    res.json({ ok: true });
  });

  // Notification test
  app.post("/api/notify/test", async (req, res) => {
    try {
      const { phone, apikey } = req.body;
      if (!phone || !apikey) return res.status(400).json({ error: "رقم الهاتف والمفتاح مطلوبان" });
      const msg = encodeURIComponent("مرحباً من صالون عدنان باشا! الإشعارات تعمل بنجاح ✅");
      const url = `https://api.callmebot.com/whatsapp.php?phone=${phone}&text=${msg}&apikey=${apikey}`;
      const r = await fetch(url);
      const body = await r.text();
      if (body.toLowerCase().includes("error") || !r.ok) {
        return res.status(400).json({ error: "فشل الإرسال. تأكد من الرقم والمفتاح." });
      }
      res.json({ ok: true });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Settings
  app.get("/api/settings", async (_req, res) => {
    res.json(await storage.getAllSettings());
  });
  app.post("/api/settings", async (req, res) => {
    const { key, value } = req.body;
    if (!key) return res.status(400).json({ error: "المفتاح مطلوب" });
    await storage.setSetting(key, value ?? "");
    res.json({ ok: true });
  });

  return httpServer;
}
