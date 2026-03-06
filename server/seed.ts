import { db } from "./db";
import { services, barbers, products } from "@shared/schema";
import { storage } from "./storage";

export async function seed() {
  const existingServices = await db.select().from(services);
  if (existingServices.length === 0) {
    await db.insert(services).values([
      { name: "Haircut", nameAr: "حلاقة", duration: 30, price: 50 },
      { name: "Private Room", nameAr: "غرفة برايفت", duration: 60, price: 150 },
      { name: "Cupping", nameAr: "حجامة", duration: 30, price: 80 },
      { name: "Facial", nameAr: "تنظيف بشرة", duration: 30, price: 70 },
    ]);

    await db.insert(barbers).values([
      { name: "Ahmed", commission: 50 },
      { name: "Mohammed", commission: 45 },
      { name: "Khalid", commission: 50 },
    ]);

    await db.insert(products).values([
      { name: "Hair Gel", price: 25, stock: 20 },
      { name: "Shampoo", price: 35, stock: 15 },
      { name: "Beard Oil", price: 45, stock: 10 },
      { name: "Hair Wax", price: 30, stock: 12 },
    ]);

    console.log("Seed data inserted successfully");
  }

  const adminExists = await storage.getStaffUserByUsername("admin");
  if (!adminExists) {
    await storage.createStaffUser({
      name: "المدير",
      username: "admin",
      pin: "1234",
      role: "admin",
      active: true,
    });
    console.log("Admin user created: username=admin, pin=1234");
  }
}
