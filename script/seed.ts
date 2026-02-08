import { drizzle } from "drizzle-orm/node-postgres";
import { users } from "../shared/models/auth";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";
import "dotenv/config";

async function seedAdmin() {
  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL is not defined in environment variables");
  }

  const db = drizzle(process.env.DATABASE_URL);

  try {
    // Check if admin user already exists
    const existingAdmin = await db.select().from(users).where(eq(users.username, "admin"));
    
    if (existingAdmin.length > 0) {
      console.log("Admin user already exists, skipping creation.");
      return;
    }

    // Hash the password
    const saltRounds = 10;
    const password = "admin123"; // Default admin password
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Create the admin user
    const adminUser = await db.insert(users).values({
      username: "admin",
      password: hashedPassword,
      role: "admin"
    }).returning();

    console.log("Admin user created successfully:");
    console.log("- Username: admin");
    console.log("- Password: admin123");
    console.log("- Role: admin");
  } catch (error) {
    console.error("Error seeding admin user:", error);
  }
}

seedAdmin();