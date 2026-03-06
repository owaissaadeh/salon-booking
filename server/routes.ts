import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {

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

    res.json({
      barber,
      fromDate,
      toDate,
      servicesRevenue,
      commissionEarned,
      totalWithdrawn,
      balance,
      transactionCount: txns.length,
      withdrawals,
    });
  });

  // Bookings
  app.get("/api/bookings", async (_req, res) => {
    res.json(await storage.getBookings());
  });
  app.post("/api/bookings", async (req, res) => {
    res.json(await storage.createBooking(req.body));
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
    const allBarbers = await storage.getBarbers();
    const activeBarbers = allBarbers.filter(b => b.active);
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

        if (selectedBarberId) {
          const conflict = activeBookings.some(b => {
            if (b.barberId && b.barberId !== selectedBarberId) return false;
            const bService = allServices.find(s => s.id === b.serviceId);
            const bDuration = bService?.duration || 30;
            const [bh, bm] = b.time.split(":").map(Number);
            const bStart = bh * 60 + bm;
            const bEnd = bStart + bDuration;
            return slotStart < bEnd && slotEnd > bStart;
          });
          available = !conflict;
        } else {
          available = activeBarbers.some(barber => {
            const conflict = activeBookings.some(b => {
              if (b.barberId && b.barberId !== barber.id) return false;
              const bService = allServices.find(s => s.id === b.serviceId);
              const bDuration = bService?.duration || 30;
              const [bh, bm] = b.time.split(":").map(Number);
              const bStart = bh * 60 + bm;
              const bEnd = bStart + bDuration;
              return slotStart < bEnd && slotEnd > bStart;
            });
            return !conflict;
          });
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
      totalSales,
      servicesRevenue,
      productsRevenue,
      totalExpenses,
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
  app.post("/api/staff/verify-pin", async (req, res) => {
    const { username, pin } = req.body;
    const user = await storage.getStaffUserByUsername(username);
    if (!user || user.pin !== pin || !user.active) {
      return res.status(401).json({ error: "بيانات خاطئة" });
    }
    res.json({ id: user.id, name: user.name, role: user.role });
  });

  // Settings
  app.get("/api/settings", async (_req, res) => {
    res.json(await storage.getAllSettings());
  });
  app.post("/api/settings", async (req, res) => {
    const { key, value } = req.body;
    await storage.setSetting(key, value);
    res.json({ ok: true });
  });

  return httpServer;
}
