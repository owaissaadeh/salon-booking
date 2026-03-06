import { pgTable, text, integer, real, timestamp, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const services = pgTable("services", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  name: text("name").notNull(),
  nameAr: text("name_ar").notNull(),
  duration: integer("duration").notNull(),
  price: real("price").notNull(),
  active: boolean("active").notNull().default(true),
});

export const barbers = pgTable("barbers", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  name: text("name").notNull(),
  commission: real("commission").notNull().default(50),
  active: boolean("active").notNull().default(true),
  phone: text("phone"),
  notes: text("notes"),
});

export const bookings = pgTable("bookings", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  visitorName: text("visitor_name").notNull(),
  phone: text("phone").notNull(),
  serviceId: integer("service_id").notNull(),
  barberId: integer("barber_id"),
  date: text("date").notNull(),
  time: text("time").notNull(),
  status: text("status").notNull().default("pending"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const products = pgTable("products", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  name: text("name").notNull(),
  price: real("price").notNull(),
  stock: integer("stock").notNull().default(0),
  active: boolean("active").notNull().default(true),
});

export const transactions = pgTable("transactions", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  barberId: integer("barber_id").notNull(),
  customerName: text("customer_name"),
  totalAmount: real("total_amount").notNull().default(0),
  servicesTotal: real("services_total").notNull().default(0),
  productsTotal: real("products_total").notNull().default(0),
  paymentMethod: text("payment_method").notNull().default("cash"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const transactionItems = pgTable("transaction_items", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  transactionId: integer("transaction_id").notNull(),
  serviceId: integer("service_id").notNull(),
  price: real("price").notNull(),
});

export const transactionProducts = pgTable("transaction_products", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  transactionId: integer("transaction_id").notNull(),
  productId: integer("product_id").notNull(),
  quantity: integer("quantity").notNull().default(1),
  price: real("price").notNull(),
});

export const expenses = pgTable("expenses", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  category: text("category").notNull(),
  description: text("description"),
  amount: real("amount").notNull(),
  date: text("date").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const galleryImages = pgTable("gallery_images", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  url: text("url").notNull(),
  caption: text("caption"),
});

export const barberWithdrawals = pgTable("barber_withdrawals", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  barberId: integer("barber_id").notNull(),
  amount: real("amount").notNull(),
  date: text("date").notNull(),
  description: text("description"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const staffUsers = pgTable("staff_users", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  name: text("name").notNull(),
  username: text("username").notNull().unique(),
  pin: text("pin").notNull(),
  role: text("role").notNull().default("receptionist"),
  active: boolean("active").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const salonSettings = pgTable("salon_settings", {
  key: text("key").primaryKey(),
  value: text("value"),
});

export const insertServiceSchema = createInsertSchema(services);
export const insertBarberSchema = createInsertSchema(barbers);
export const insertBookingSchema = createInsertSchema(bookings);
export const insertProductSchema = createInsertSchema(products);
export const insertTransactionSchema = createInsertSchema(transactions);
export const insertTransactionItemSchema = createInsertSchema(transactionItems);
export const insertTransactionProductSchema = createInsertSchema(transactionProducts);
export const insertExpenseSchema = createInsertSchema(expenses);
export const insertGalleryImageSchema = createInsertSchema(galleryImages);
export const insertBarberWithdrawalSchema = createInsertSchema(barberWithdrawals);
export const insertStaffUserSchema = createInsertSchema(staffUsers);
export const insertSalonSettingSchema = createInsertSchema(salonSettings);

export type Service = typeof services.$inferSelect;
export type InsertService = z.infer<typeof insertServiceSchema>;
export type Barber = typeof barbers.$inferSelect;
export type InsertBarber = z.infer<typeof insertBarberSchema>;
export type Booking = typeof bookings.$inferSelect;
export type InsertBooking = z.infer<typeof insertBookingSchema>;
export type Product = typeof products.$inferSelect;
export type InsertProduct = z.infer<typeof insertProductSchema>;
export type Transaction = typeof transactions.$inferSelect;
export type InsertTransaction = z.infer<typeof insertTransactionSchema>;
export type TransactionItem = typeof transactionItems.$inferSelect;
export type InsertTransactionItem = z.infer<typeof insertTransactionItemSchema>;
export type TransactionProduct = typeof transactionProducts.$inferSelect;
export type InsertTransactionProduct = z.infer<typeof insertTransactionProductSchema>;
export type Expense = typeof expenses.$inferSelect;
export type InsertExpense = z.infer<typeof insertExpenseSchema>;
export type GalleryImage = typeof galleryImages.$inferSelect;
export type InsertGalleryImage = z.infer<typeof insertGalleryImageSchema>;
export type BarberWithdrawal = typeof barberWithdrawals.$inferSelect;
export type InsertBarberWithdrawal = z.infer<typeof insertBarberWithdrawalSchema>;
export type StaffUser = typeof staffUsers.$inferSelect;
export type InsertStaffUser = z.infer<typeof insertStaffUserSchema>;
export type SalonSetting = typeof salonSettings.$inferSelect;
export type InsertSalonSetting = z.infer<typeof insertSalonSettingSchema>;
