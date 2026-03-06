import { eq, and, gte, lte, desc, sql } from "drizzle-orm";
import pg from "pg";
import { drizzle } from "drizzle-orm/node-postgres";
import { db } from "./db";
import {
  services, barbers, bookings, products, transactions,
  transactionItems, transactionProducts, expenses, galleryImages,
  type Service, type InsertService,
  type Barber, type InsertBarber,
  type Booking, type InsertBooking,
  type Product, type InsertProduct,
  type Transaction, type InsertTransaction,
  type TransactionItem, type InsertTransactionItem,
  type TransactionProduct, type InsertTransactionProduct,
  type Expense, type InsertExpense,
  type GalleryImage, type InsertGalleryImage,
} from "@shared/schema";

export interface IStorage {
  getServices(): Promise<Service[]>;
  createService(s: InsertService): Promise<Service>;
  updateService(id: number, s: Partial<InsertService>): Promise<Service | undefined>;
  deleteService(id: number): Promise<void>;

  getBarbers(): Promise<Barber[]>;
  createBarber(b: InsertBarber): Promise<Barber>;
  updateBarber(id: number, b: Partial<InsertBarber>): Promise<Barber | undefined>;
  deleteBarber(id: number): Promise<void>;

  getBookings(): Promise<(Booking & { serviceName: string })[]>;
  getBookingsByDate(date: string): Promise<Booking[]>;
  createBooking(b: InsertBooking): Promise<Booking>;
  updateBookingStatus(id: number, status: string): Promise<void>;

  getProducts(): Promise<Product[]>;
  createProduct(p: InsertProduct): Promise<Product>;
  updateProduct(id: number, p: Partial<InsertProduct>): Promise<Product | undefined>;
  deleteProduct(id: number): Promise<void>;
  decrementStock(productId: number, quantity: number): Promise<void>;

  createTransaction(t: InsertTransaction): Promise<Transaction>;
  getTransactionsByDateRange(from: string, to: string): Promise<Transaction[]>;
  getTodayTransactions(): Promise<(Transaction & { barberName: string })[]>;

  createFullTransaction(
    transData: InsertTransaction,
    items: { serviceId: number; price: number }[],
    prodItems: { productId: number; quantity: number; price: number }[]
  ): Promise<Transaction>;
  createTransactionItem(item: InsertTransactionItem): Promise<TransactionItem>;
  createTransactionProduct(item: InsertTransactionProduct): Promise<TransactionProduct>;
  getTransactionItemsByDateRange(from: string, to: string): Promise<(TransactionItem & { barberName: string; barberCommission: number })[]>;
  getTransactionProductsByDateRange(from: string, to: string): Promise<(TransactionProduct & { productName: string })[]>;

  getExpenses(): Promise<Expense[]>;
  getExpensesByDateRange(from: string, to: string): Promise<Expense[]>;
  createExpense(e: InsertExpense): Promise<Expense>;
  deleteExpense(id: number): Promise<void>;

  getGalleryImages(): Promise<GalleryImage[]>;
  createGalleryImage(g: InsertGalleryImage): Promise<GalleryImage>;
  deleteGalleryImage(id: number): Promise<void>;
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

  async getBookings(): Promise<(Booking & { serviceName: string })[]> {
    const rows = await db
      .select({ booking: bookings, serviceName: services.name })
      .from(bookings)
      .leftJoin(services, eq(bookings.serviceId, services.id))
      .orderBy(desc(bookings.createdAt));
    return rows.map(r => ({ ...r.booking, serviceName: r.serviceName || "Unknown" }));
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
  async decrementStock(productId: number, quantity: number): Promise<void> {
    await db.update(products).set({ stock: sql`${products.stock} - ${quantity}` }).where(eq(products.id, productId));
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
    return db.select().from(transactions)
      .where(and(
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
    return rows.map(r => ({ ...r.transaction, barberName: r.barberName || "Unknown" }));
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
      .select({
        item: transactionItems,
        barberName: barbers.name,
        barberCommission: barbers.commission,
      })
      .from(transactionItems)
      .innerJoin(transactions, eq(transactionItems.transactionId, transactions.id))
      .innerJoin(barbers, eq(transactions.barberId, barbers.id))
      .where(and(
        gte(transactions.createdAt, new Date(from + "T00:00:00")),
        lte(transactions.createdAt, new Date(to + "T23:59:59"))
      ));
    return rows.map(r => ({
      ...r.item,
      barberName: r.barberName || "Unknown",
      barberCommission: r.barberCommission || 0,
    }));
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
    return rows.map(r => ({ ...r.tp, productName: r.productName || "Unknown" }));
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
}

export const storage = new DatabaseStorage();
