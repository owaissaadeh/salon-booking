import { eq, and, gte, lte, desc, sql } from "drizzle-orm";
import { db } from "./db";
import {
  services, barbers, bookings, products, transactions,
  transactionItems, transactionProducts, expenses, galleryImages,
  barberWithdrawals, staffUsers, salonSettings,
  type Service, type InsertService,
  type Barber, type InsertBarber,
  type Booking, type InsertBooking,
  type Product, type InsertProduct,
  type Transaction, type InsertTransaction,
  type TransactionItem, type InsertTransactionItem,
  type TransactionProduct, type InsertTransactionProduct,
  type Expense, type InsertExpense,
  type GalleryImage, type InsertGalleryImage,
  type BarberWithdrawal, type InsertBarberWithdrawal,
  type StaffUser, type InsertStaffUser,
  type SalonSetting,
} from "@shared/schema";

export interface IStorage {
  getServices(): Promise<Service[]>;
  createService(s: InsertService): Promise<Service>;
  updateService(id: number, s: Partial<InsertService>): Promise<Service | undefined>;
  deleteService(id: number): Promise<void>;

  getBarbers(): Promise<Barber[]>;
  getBarberById(id: number): Promise<Barber | undefined>;
  createBarber(b: InsertBarber): Promise<Barber>;
  updateBarber(id: number, b: Partial<InsertBarber>): Promise<Barber | undefined>;
  deleteBarber(id: number): Promise<void>;

  getBookings(): Promise<(Booking & { serviceName: string; serviceNameAr: string; barberName: string | null })[]>;
  getBookingsByDate(date: string): Promise<Booking[]>;
  createBooking(b: InsertBooking): Promise<Booking>;
  updateBookingStatus(id: number, status: string): Promise<void>;

  getProducts(): Promise<Product[]>;
  createProduct(p: InsertProduct): Promise<Product>;
  updateProduct(id: number, p: Partial<InsertProduct>): Promise<Product | undefined>;
  deleteProduct(id: number): Promise<void>;

  createFullTransaction(
    transData: InsertTransaction,
    items: { serviceId: number; price: number }[],
    prodItems: { productId: number; quantity: number; price: number }[]
  ): Promise<Transaction>;
  createTransaction(t: InsertTransaction): Promise<Transaction>;
  getTransactionsByDateRange(from: string, to: string): Promise<Transaction[]>;
  getTodayTransactions(): Promise<(Transaction & { barberName: string })[]>;
  getBarberTransactionsByDateRange(barberId: number, from: string, to: string): Promise<Transaction[]>;

  createTransactionItem(item: InsertTransactionItem): Promise<TransactionItem>;
  createTransactionProduct(item: InsertTransactionProduct): Promise<TransactionProduct>;
  getTransactionItemsByDateRange(from: string, to: string): Promise<(TransactionItem & { barberName: string; barberCommission: number })[]>;
  getTransactionProductsByDateRange(from: string, to: string): Promise<(TransactionProduct & { productName: string })[]>;
  getBarberTransactionItemsByDateRange(barberId: number, from: string, to: string): Promise<TransactionItem[]>;
  getBarberDetailedTransactions(barberId: number, from: string, to: string): Promise<{
    id: number; customerName: string | null; totalAmount: number; servicesTotal: number; productsTotal: number;
    paymentMethod: string; createdAt: Date; commission: number; commissionEarned: number;
    services: { serviceId: number; serviceName: string; serviceNameAr: string; price: number }[];
  }[]>;

  getExpenses(): Promise<Expense[]>;
  getExpensesByDateRange(from: string, to: string): Promise<Expense[]>;
  createExpense(e: InsertExpense): Promise<Expense>;
  deleteExpense(id: number): Promise<void>;

  getGalleryImages(): Promise<GalleryImage[]>;
  createGalleryImage(g: InsertGalleryImage): Promise<GalleryImage>;
  deleteGalleryImage(id: number): Promise<void>;

  getBarberWithdrawals(barberId?: number): Promise<BarberWithdrawal[]>;
  createBarberWithdrawal(w: InsertBarberWithdrawal): Promise<BarberWithdrawal>;
  deleteBarberWithdrawal(id: number): Promise<void>;

  getStaffUsers(): Promise<StaffUser[]>;
  getStaffUserByUsername(username: string): Promise<StaffUser | undefined>;
  createStaffUser(u: InsertStaffUser): Promise<StaffUser>;
  updateStaffUser(id: number, u: Partial<InsertStaffUser>): Promise<StaffUser | undefined>;
  deleteStaffUser(id: number): Promise<void>;

  getSetting(key: string): Promise<string | null>;
  setSetting(key: string, value: string): Promise<void>;
  getAllSettings(): Promise<Record<string, string>>;
}

export class DatabaseStorage implements IStorage {
  async getServices(): Promise<Service[]> {
    return db.select().from(services);
  }
  async createService(s: InsertService): Promise<Service> {
    const [result] = await db.insert(services).values(s).returning();
    return result;
  }
  async updateService(id: number, s: Partial<InsertService>): Promise<Service | undefined> {
    const [result] = await db.update(services).set(s).where(eq(services.id, id)).returning();
    return result;
  }
  async deleteService(id: number): Promise<void> {
    await db.delete(services).where(eq(services.id, id));
  }

  async getBarbers(): Promise<Barber[]> {
    return db.select().from(barbers);
  }
  async getBarberById(id: number): Promise<Barber | undefined> {
    const [b] = await db.select().from(barbers).where(eq(barbers.id, id));
    return b;
  }
  async createBarber(b: InsertBarber): Promise<Barber> {
    const [result] = await db.insert(barbers).values(b).returning();
    return result;
  }
  async updateBarber(id: number, b: Partial<InsertBarber>): Promise<Barber | undefined> {
    const [result] = await db.update(barbers).set(b).where(eq(barbers.id, id)).returning();
    return result;
  }
  async deleteBarber(id: number): Promise<void> {
    await db.delete(barbers).where(eq(barbers.id, id));
  }

  async getBookings(): Promise<(Booking & { serviceName: string; serviceNameAr: string; barberName: string | null })[]> {
    const rows = await db
      .select({ booking: bookings, serviceName: services.name, serviceNameAr: services.nameAr, barberName: barbers.name })
      .from(bookings)
      .leftJoin(services, eq(bookings.serviceId, services.id))
      .leftJoin(barbers, eq(bookings.barberId, barbers.id))
      .orderBy(desc(bookings.createdAt));
    return rows.map(r => ({ ...r.booking, serviceName: r.serviceName || "غير محدد", serviceNameAr: r.serviceNameAr || "غير محدد", barberName: r.barberName || null }));
  }
  async getBookingsByDate(date: string): Promise<Booking[]> {
    return db.select().from(bookings).where(eq(bookings.date, date));
  }
  async createBooking(b: InsertBooking): Promise<Booking> {
    const [result] = await db.insert(bookings).values(b).returning();
    return result;
  }
  async updateBookingStatus(id: number, status: string): Promise<void> {
    await db.update(bookings).set({ status }).where(eq(bookings.id, id));
  }

  async getProducts(): Promise<Product[]> {
    return db.select().from(products);
  }
  async createProduct(p: InsertProduct): Promise<Product> {
    const [result] = await db.insert(products).values(p).returning();
    return result;
  }
  async updateProduct(id: number, p: Partial<InsertProduct>): Promise<Product | undefined> {
    const [result] = await db.update(products).set(p).where(eq(products.id, id)).returning();
    return result;
  }
  async deleteProduct(id: number): Promise<void> {
    await db.delete(products).where(eq(products.id, id));
  }

  async createFullTransaction(
    transData: InsertTransaction,
    items: { serviceId: number; price: number }[],
    prodItems: { productId: number; quantity: number; price: number }[]
  ): Promise<Transaction> {
    return await db.transaction(async (tx) => {
      const [transaction] = await tx.insert(transactions).values(transData).returning();
      for (const item of items) {
        await tx.insert(transactionItems).values({ ...item, transactionId: transaction.id });
      }
      for (const pItem of prodItems) {
        await tx.insert(transactionProducts).values({ ...pItem, transactionId: transaction.id });
        await tx.update(products).set({ stock: sql`${products.stock} - ${pItem.quantity}` }).where(eq(products.id, pItem.productId));
      }
      return transaction;
    });
  }
  async createTransaction(t: InsertTransaction): Promise<Transaction> {
    const [result] = await db.insert(transactions).values(t).returning();
    return result;
  }
  async getTransactionsByDateRange(from: string, to: string): Promise<Transaction[]> {
    return db.select().from(transactions).where(and(
      gte(transactions.createdAt, new Date(from + "T00:00:00")),
      lte(transactions.createdAt, new Date(to + "T23:59:59"))
    ));
  }
  async getTodayTransactions(): Promise<(Transaction & { barberName: string })[]> {
    const today = new Date().toISOString().split("T")[0];
    const rows = await db
      .select({ transaction: transactions, barberName: barbers.name })
      .from(transactions)
      .leftJoin(barbers, eq(transactions.barberId, barbers.id))
      .where(and(
        gte(transactions.createdAt, new Date(today + "T00:00:00")),
        lte(transactions.createdAt, new Date(today + "T23:59:59"))
      ))
      .orderBy(desc(transactions.createdAt));
    return rows.map(r => ({ ...r.transaction, barberName: r.barberName || "غير محدد" }));
  }
  async getBarberTransactionsByDateRange(barberId: number, from: string, to: string): Promise<Transaction[]> {
    return db.select().from(transactions).where(and(
      eq(transactions.barberId, barberId),
      gte(transactions.createdAt, new Date(from + "T00:00:00")),
      lte(transactions.createdAt, new Date(to + "T23:59:59"))
    ));
  }

  async createTransactionItem(item: InsertTransactionItem): Promise<TransactionItem> {
    const [result] = await db.insert(transactionItems).values(item).returning();
    return result;
  }
  async createTransactionProduct(item: InsertTransactionProduct): Promise<TransactionProduct> {
    const [result] = await db.insert(transactionProducts).values(item).returning();
    return result;
  }
  async getTransactionItemsByDateRange(from: string, to: string): Promise<(TransactionItem & { barberName: string; barberCommission: number })[]> {
    const rows = await db
      .select({ item: transactionItems, barberName: barbers.name, barberCommission: barbers.commission })
      .from(transactionItems)
      .innerJoin(transactions, eq(transactionItems.transactionId, transactions.id))
      .innerJoin(barbers, eq(transactions.barberId, barbers.id))
      .where(and(
        gte(transactions.createdAt, new Date(from + "T00:00:00")),
        lte(transactions.createdAt, new Date(to + "T23:59:59"))
      ));
    return rows.map(r => ({ ...r.item, barberName: r.barberName || "غير محدد", barberCommission: r.barberCommission || 0 }));
  }
  async getTransactionProductsByDateRange(from: string, to: string): Promise<(TransactionProduct & { productName: string })[]> {
    const rows = await db
      .select({ tp: transactionProducts, productName: products.name })
      .from(transactionProducts)
      .innerJoin(transactions, eq(transactionProducts.transactionId, transactions.id))
      .innerJoin(products, eq(transactionProducts.productId, products.id))
      .where(and(
        gte(transactions.createdAt, new Date(from + "T00:00:00")),
        lte(transactions.createdAt, new Date(to + "T23:59:59"))
      ));
    return rows.map(r => ({ ...r.tp, productName: r.productName || "غير محدد" }));
  }
  async getBarberTransactionItemsByDateRange(barberId: number, from: string, to: string): Promise<TransactionItem[]> {
    const rows = await db
      .select({ item: transactionItems })
      .from(transactionItems)
      .innerJoin(transactions, eq(transactionItems.transactionId, transactions.id))
      .where(and(
        eq(transactions.barberId, barberId),
        gte(transactions.createdAt, new Date(from + "T00:00:00")),
        lte(transactions.createdAt, new Date(to + "T23:59:59"))
      ));
    return rows.map(r => r.item);
  }

  async getBarberDetailedTransactions(barberId: number, from: string, to: string) {
    const barber = await db.select().from(barbers).where(eq(barbers.id, barberId)).limit(1);
    const commission = barber[0]?.commission ?? 0;

    const txns = await db
      .select()
      .from(transactions)
      .where(and(
        eq(transactions.barberId, barberId),
        gte(transactions.createdAt, new Date(from + "T00:00:00")),
        lte(transactions.createdAt, new Date(to + "T23:59:59"))
      ))
      .orderBy(desc(transactions.createdAt));

    const results = [];
    for (const txn of txns) {
      const itemRows = await db
        .select({ item: transactionItems, serviceName: services.name, serviceNameAr: services.nameAr })
        .from(transactionItems)
        .leftJoin(services, eq(transactionItems.serviceId, services.id))
        .where(eq(transactionItems.transactionId, txn.id));

      const svcList = itemRows.map(r => ({
        serviceId: r.item.serviceId,
        serviceName: r.serviceName || "غير محدد",
        serviceNameAr: r.serviceNameAr || "غير محدد",
        price: r.item.price,
      }));

      const commissionEarned = (txn.servicesTotal * commission) / 100;
      results.push({ ...txn, commission, commissionEarned, services: svcList });
    }
    return results;
  }

  async getExpenses(): Promise<Expense[]> {
    return db.select().from(expenses).orderBy(desc(expenses.createdAt));
  }
  async getExpensesByDateRange(from: string, to: string): Promise<Expense[]> {
    return db.select().from(expenses).where(and(gte(expenses.date, from), lte(expenses.date, to)));
  }
  async createExpense(e: InsertExpense): Promise<Expense> {
    const [result] = await db.insert(expenses).values(e).returning();
    return result;
  }
  async deleteExpense(id: number): Promise<void> {
    await db.delete(expenses).where(eq(expenses.id, id));
  }

  async getGalleryImages(): Promise<GalleryImage[]> {
    return db.select().from(galleryImages);
  }
  async createGalleryImage(g: InsertGalleryImage): Promise<GalleryImage> {
    const [result] = await db.insert(galleryImages).values(g).returning();
    return result;
  }
  async deleteGalleryImage(id: number): Promise<void> {
    await db.delete(galleryImages).where(eq(galleryImages.id, id));
  }

  async getBarberWithdrawals(barberId?: number): Promise<BarberWithdrawal[]> {
    if (barberId) {
      return db.select().from(barberWithdrawals).where(eq(barberWithdrawals.barberId, barberId)).orderBy(desc(barberWithdrawals.createdAt));
    }
    return db.select().from(barberWithdrawals).orderBy(desc(barberWithdrawals.createdAt));
  }
  async createBarberWithdrawal(w: InsertBarberWithdrawal): Promise<BarberWithdrawal> {
    const [result] = await db.insert(barberWithdrawals).values(w).returning();
    return result;
  }
  async deleteBarberWithdrawal(id: number): Promise<void> {
    await db.delete(barberWithdrawals).where(eq(barberWithdrawals.id, id));
  }

  async getStaffUsers(): Promise<StaffUser[]> {
    return db.select().from(staffUsers).orderBy(staffUsers.name);
  }
  async getStaffUserByUsername(username: string): Promise<StaffUser | undefined> {
    const [u] = await db.select().from(staffUsers).where(eq(staffUsers.username, username));
    return u;
  }
  async createStaffUser(u: InsertStaffUser): Promise<StaffUser> {
    const [result] = await db.insert(staffUsers).values(u).returning();
    return result;
  }
  async updateStaffUser(id: number, u: Partial<InsertStaffUser>): Promise<StaffUser | undefined> {
    const [result] = await db.update(staffUsers).set(u).where(eq(staffUsers.id, id)).returning();
    return result;
  }
  async deleteStaffUser(id: number): Promise<void> {
    await db.delete(staffUsers).where(eq(staffUsers.id, id));
  }

  async getSetting(key: string): Promise<string | null> {
    const [row] = await db.select().from(salonSettings).where(eq(salonSettings.key, key));
    return row?.value ?? null;
  }
  async setSetting(key: string, value: string): Promise<void> {
    await db
      .insert(salonSettings)
      .values({ key, value })
      .onConflictDoUpdate({ target: salonSettings.key, set: { value } });
  }
  async getAllSettings(): Promise<Record<string, string>> {
    const rows = await db.select().from(salonSettings);
    return Object.fromEntries(rows.map(r => [r.key, r.value ?? ""]));
  }
}

export const storage = new DatabaseStorage();
