import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {

  // Services
  app.get("/api/services", async (_req, res) => {
    const data = await storage.getServices();
    res.json(data);
  });
  app.post("/api/services", async (req, res) => {
    const service = await storage.createService(req.body);
    res.json(service);
  });
  app.patch("/api/services/:id", async (req, res) => {
    const service = await storage.updateService(parseInt(req.params.id), req.body);
    res.json(service);
  });
  app.delete("/api/services/:id", async (req, res) => {
    await storage.deleteService(parseInt(req.params.id));
    res.json({ ok: true });
  });

  // Barbers
  app.get("/api/barbers", async (_req, res) => {
    const data = await storage.getBarbers();
    res.json(data);
  });
  app.post("/api/barbers", async (req, res) => {
    const barber = await storage.createBarber(req.body);
    res.json(barber);
  });
  app.patch("/api/barbers/:id", async (req, res) => {
    const barber = await storage.updateBarber(parseInt(req.params.id), req.body);
    res.json(barber);
  });
  app.delete("/api/barbers/:id", async (req, res) => {
    await storage.deleteBarber(parseInt(req.params.id));
    res.json({ ok: true });
  });

  // Bookings
  app.get("/api/bookings", async (_req, res) => {
    const data = await storage.getBookings();
    res.json(data);
  });
  app.post("/api/bookings", async (req, res) => {
    const booking = await storage.createBooking(req.body);
    res.json(booking);
  });
  app.patch("/api/bookings/:id", async (req, res) => {
    await storage.updateBookingStatus(parseInt(req.params.id), req.body.status);
    res.json({ ok: true });
  });

  app.get("/api/bookings/available-slots", async (req, res) => {
    const { serviceId, date, barberId } = req.query;
    if (!serviceId || !date) return res.status(400).json({ error: "Missing params" });

    const allServices = await storage.getServices();
    const service = allServices.find(s => s.id === parseInt(serviceId as string));
    if (!service) return res.status(404).json({ error: "Service not found" });

    const existingBookings = await storage.getBookingsByDate(date as string);
    const activeBookings = existingBookings.filter(b => b.status !== "cancelled");

    const allBarbers = await storage.getBarbers();
    const activeBarbers = allBarbers.filter(b => b.active);
    const selectedBarberId = barberId ? parseInt(barberId as string) : null;

    const slots: string[] = [];
    const startHour = 9;
    const endHour = 23;

    for (let h = startHour; h < endHour; h++) {
      for (let m = 0; m < 60; m += 30) {
        const timeStr = `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}`;
        const slotStart = h * 60 + m;
        const slotEnd = slotStart + service.duration;

        if (slotEnd > endHour * 60) continue;

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
          if (!conflict) slots.push(timeStr);
        } else {
          const hasAvailableBarber = activeBarbers.some(barber => {
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
          if (hasAvailableBarber) slots.push(timeStr);
        }
      }
    }

    res.json(slots);
  });

  // Products
  app.get("/api/products", async (_req, res) => {
    const data = await storage.getProducts();
    res.json(data);
  });
  app.post("/api/products", async (req, res) => {
    const product = await storage.createProduct(req.body);
    res.json(product);
  });
  app.patch("/api/products/:id", async (req, res) => {
    const product = await storage.updateProduct(parseInt(req.params.id), req.body);
    res.json(product);
  });
  app.delete("/api/products/:id", async (req, res) => {
    await storage.deleteProduct(parseInt(req.params.id));
    res.json({ ok: true });
  });

  // Transactions (POS)
  app.post("/api/transactions", async (req, res) => {
    try {
      const { items, products: prodItems, ...transData } = req.body;
      const result = await storage.createFullTransaction(transData, items || [], prodItems || []);
      res.json(result);
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  });

  // Dashboard stats
  app.get("/api/stats/today", async (_req, res) => {
    const todayTransactions = await storage.getTodayTransactions();
    const todaySales = todayTransactions.reduce((s, t) => s + t.totalAmount, 0);
    const todayServices = todayTransactions.reduce((s, t) => s + t.servicesTotal, 0);
    const todayProducts = todayTransactions.reduce((s, t) => s + t.productsTotal, 0);

    const allBookings = await storage.getBookings();
    const pendingBookings = allBookings.filter(b => b.status === "pending");

    res.json({
      todaySales,
      todayServices,
      todayProducts,
      totalBookings: pendingBookings.length,
      recentTransactions: todayTransactions.slice(0, 10),
    });
  });

  // Reports
  app.get("/api/reports", async (req, res) => {
    const { from, to } = req.query;
    if (!from || !to) return res.status(400).json({ error: "Missing date range" });

    const txns = await storage.getTransactionsByDateRange(from as string, to as string);
    const totalSales = txns.reduce((s, t) => s + t.totalAmount, 0);
    const servicesRevenue = txns.reduce((s, t) => s + t.servicesTotal, 0);
    const productsRevenue = txns.reduce((s, t) => s + t.productsTotal, 0);

    const expensesList = await storage.getExpensesByDateRange(from as string, to as string);
    const totalExpenses = expensesList.reduce((s, e) => s + e.amount, 0);

    const tItems = await storage.getTransactionItemsByDateRange(from as string, to as string);
    const barberMap = new Map<string, { total: number; commission: number }>();
    for (const item of tItems) {
      const existing = barberMap.get(item.barberName) || { total: 0, commission: item.barberCommission };
      existing.total += item.price;
      barberMap.set(item.barberName, existing);
    }
    const barberBreakdown = Array.from(barberMap.entries()).map(([name, data]) => ({
      name,
      total: data.total,
      commission: data.commission,
      commissionAmount: (data.total * data.commission) / 100,
    }));

    const tProducts = await storage.getTransactionProductsByDateRange(from as string, to as string);
    const productMap = new Map<string, { quantity: number; total: number }>();
    for (const p of tProducts) {
      const existing = productMap.get(p.productName) || { quantity: 0, total: 0 };
      existing.quantity += p.quantity;
      existing.total += p.price;
      productMap.set(p.productName, existing);
    }
    const productsSold = Array.from(productMap.entries()).map(([name, data]) => ({
      name,
      quantity: data.quantity,
      total: data.total,
    }));

    res.json({
      totalSales,
      servicesRevenue,
      productsRevenue,
      totalExpenses,
      netProfit: totalSales - totalExpenses,
      barberBreakdown,
      productsSold,
      transactionCount: txns.length,
    });
  });

  // Expenses
  app.get("/api/expenses", async (_req, res) => {
    const data = await storage.getExpenses();
    res.json(data);
  });
  app.post("/api/expenses", async (req, res) => {
    const expense = await storage.createExpense(req.body);
    res.json(expense);
  });
  app.delete("/api/expenses/:id", async (req, res) => {
    await storage.deleteExpense(parseInt(req.params.id));
    res.json({ ok: true });
  });

  // Gallery
  app.get("/api/gallery", async (_req, res) => {
    const data = await storage.getGalleryImages();
    res.json(data);
  });
  app.post("/api/gallery", async (req, res) => {
    const image = await storage.createGalleryImage(req.body);
    res.json(image);
  });
  app.delete("/api/gallery/:id", async (req, res) => {
    await storage.deleteGalleryImage(parseInt(req.params.id));
    res.json({ ok: true });
  });

  return httpServer;
}
