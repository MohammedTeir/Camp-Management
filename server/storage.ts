import { db } from "./db";
import {
  camps, children, pregnantWomen, systemSettings, // Import systemSettings
  type InsertCamp, type InsertChild, type InsertPregnantWoman, type InsertSystemSetting, // Import InsertSystemSetting
  type Camp, type Child, type PregnantWoman, type SystemSetting // Import SystemSetting
} from "@shared/schema";
import { users, type User, type UpsertUser } from "@shared/models/auth"; // Import users and its types
import { eq, or, sql, count } from "drizzle-orm"; // Import sql and count for aggregations

export interface IStorage {
  // Camps
  getCamps(): Promise<Camp[]>;
  createCamp(camp: InsertCamp): Promise<Camp>;
  updateCamp(id: number, updates: Partial<InsertCamp>): Promise<Camp | undefined>;
  deleteCamp(id: number): Promise<boolean>;

  // Children
  getChildren(): Promise<Child[]>;
  getChild(id: number): Promise<Child | undefined>;
  createChild(child: InsertChild): Promise<Child>;
  updateChild(id: number, updates: Partial<InsertChild>): Promise<Child | undefined>;
  deleteChild(id: number): Promise<void>;
  lookupChildren(parentId: string): Promise<Child[]>;

  // Pregnant Women
  getPregnantWomen(): Promise<PregnantWoman[]>;
  getPregnantWoman(id: number): Promise<PregnantWoman | undefined>;
  createPregnantWoman(woman: InsertPregnantWoman): Promise<PregnantWoman>;
  updatePregnantWoman(id: number, updates: Partial<InsertPregnantWoman>): Promise<PregnantWoman | undefined>;
  deletePregnantWoman(id: number): Promise<void>;
  lookupPregnantWomen(spouseId: string): Promise<PregnantWoman[]>;

  // Users
  getUsers(): Promise<User[]>;
  getUser(id: string): Promise<User | undefined>;
  createUser(user: UpsertUser): Promise<User>;
  updateUser(id: string, updates: Partial<UpsertUser>): Promise<User | undefined>;
  deleteUser(id: string): Promise<void>;

  // System Settings
  getSystemSettings(): Promise<SystemSetting[]>;
  getSystemSetting(key: string): Promise<SystemSetting | undefined>;
  setSystemSetting(key: string, value: string): Promise<SystemSetting>;

  // Dashboard Stats
  getDashboardStats(): Promise<{
    totalChildren: number;
    totalPregnantWomen: number;
    totalCamps: number;
    totalMothers: number; // Added totalMothers
    childrenByGender: { gender: string; count: number }[];
    pregnantWomenByMonth: { month: number; count: number }[];
    childrenHealthStatusCounts: { status: string; count: number }[];
    pregnantWomenHealthStatusCounts: { status: string; count: number }[];
  }>;
}

export class DatabaseStorage implements IStorage {
  // Camps
  async getCamps(): Promise<Camp[]> {
    return await db.select().from(camps);
  }

  async createCamp(camp: InsertCamp): Promise<Camp> {
    const [newCamp] = await db.insert(camps).values(camp).returning();
    return newCamp;
  }

  async updateCamp(id: number, updates: Partial<InsertCamp>): Promise<Camp | undefined> {
    const [updated] = await db
      .update(camps)
      .set(updates)
      .where(eq(camps.id, id))
      .returning();
    return updated;
  }

  async deleteCamp(id: number): Promise<boolean> {
    const result = await db.delete(camps).where(eq(camps.id, id)).returning();
    return result.length > 0;
  }

  // Children
  async getChildren(): Promise<Child[]> {
    return await db.select().from(children);
  }

  async getChild(id: number): Promise<Child | undefined> {
    const [child] = await db.select().from(children).where(eq(children.id, id));
    return child;
  }

  async createChild(child: InsertChild): Promise<Child> {
    // Check if a child with the same ID number already exists
    const existingChild = await db
      .select()
      .from(children)
      .where(eq(children.idNumber, child.idNumber));
      
    if (existingChild.length > 0) {
      throw new Error("يوجد طفل مسجل مسبقاً برقم الهوية هذا");
    }
    
    const [newChild] = await db.insert(children).values(child).returning();
    return newChild;
  }

  async updateChild(id: number, updates: Partial<InsertChild>): Promise<Child | undefined> {
    const [updated] = await db
      .update(children)
      .set(updates)
      .where(eq(children.id, id))
      .returning();
    return updated;
  }

  async deleteChild(id: number): Promise<void> {
    await db.delete(children).where(eq(children.id, id));
  }

  async lookupChildren(parentId: string): Promise<Child[]> {
    return await db.select().from(children).where(
      or(
        eq(children.fatherId, parentId),
        eq(children.motherId, parentId)
      )
    );
  }

  // Pregnant Women
  async getPregnantWomen(): Promise<PregnantWoman[]> {
    return await db.select().from(pregnantWomen);
  }

  async getPregnantWoman(id: number): Promise<PregnantWoman | undefined> {
    const [woman] = await db.select().from(pregnantWomen).where(eq(pregnantWomen.id, id));
    return woman;
  }

  async createPregnantWoman(woman: InsertPregnantWoman): Promise<PregnantWoman> {
    // Check if a pregnant woman with the same ID number already exists
    const existingWoman = await db
      .select()
      .from(pregnantWomen)
      .where(eq(pregnantWomen.idNumber, woman.idNumber));
      
    if (existingWoman.length > 0) {
      throw new Error("يوجد امرأة حامل مسجلة مسبقاً برقم الهوية هذا");
    }
    
    const [newWoman] = await db.insert(pregnantWomen).values(woman).returning();
    return newWoman;
  }

  async updatePregnantWoman(id: number, updates: Partial<InsertPregnantWoman>): Promise<PregnantWoman | undefined> {
    const [updated] = await db
      .update(pregnantWomen)
      .set(updates)
      .where(eq(pregnantWomen.id, id))
      .returning();
    return updated;
  }

  async deletePregnantWoman(id: number): Promise<void> {
    await db.delete(pregnantWomen).where(eq(pregnantWomen.id, id));
  }

  async lookupPregnantWomen(spouseId: string): Promise<PregnantWoman[]> {
    return await db.select().from(pregnantWomen).where(
      or(
        eq(pregnantWomen.spouseId, spouseId),
        eq(pregnantWomen.idNumber, spouseId) // Also allow lookup by their own ID? Spec says "Wife ID Number OR Husband ID Number"
      )
    );
  }

  // Users
  async getUsers(): Promise<User[]> {
    return await db.select().from(users);
  }

  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async createUser(user: UpsertUser): Promise<User> {
    const [newUser] = await db.insert(users).values(user).returning();
    return newUser;
  }

  async updateUser(id: string, updates: Partial<UpsertUser>): Promise<User | undefined> {
    const [updated] = await db
      .update(users)
      .set(updates)
      .where(eq(users.id, id))
      .returning();
    return updated;
  }

  async deleteUser(id: string): Promise<void> {
    await db.delete(users).where(eq(users.id, id));
  }

  // System Settings
  async getSystemSettings(): Promise<SystemSetting[]> {
    return await db.select().from(systemSettings);
  }

  async getSystemSetting(key: string): Promise<SystemSetting | undefined> {
    const [setting] = await db.select().from(systemSettings).where(eq(systemSettings.key, key));
    return setting;
  }

  async setSystemSetting(key: string, value: string): Promise<SystemSetting> {
    const [newSetting] = await db
      .insert(systemSettings)
      .values({ key, value })
      .onConflictDoUpdate({
        target: systemSettings.key,
        set: { value, updatedAt: new Date() }, // Update updatedAt on conflict
      })
      .returning();
    return newSetting;
  }

  // New Dashboard Stats
  async getChildrenGenderDistribution(): Promise<{ gender: string; count: number }[]> {
    const result = await db
      .select({
        gender: children.gender,
        count: count(children.id).as('count'),
      })
      .from(children)
      .groupBy(children.gender);
    return result as { gender: string; count: number }[];
  }

  async getPregnantWomenByMonth(): Promise<{ month: number; count: number }[]> {
    const result = await db
      .select({
        month: pregnantWomen.pregnancyMonth,
        count: count(pregnantWomen.id).as('count'),
      })
      .from(pregnantWomen)
      .groupBy(pregnantWomen.pregnancyMonth)
      .orderBy(pregnantWomen.pregnancyMonth);
    return result as { month: number; count: number }[];
  }

  async getChildrenHealthStatusCounts(): Promise<{ status: string; count: number }[]> {
    const result = await db
      .select({
        status: children.healthStatus,
        count: count(children.id).as('count'),
      })
      .from(children)
      .groupBy(children.healthStatus);
    return result as { status: string; count: number }[];
  }

  async getPregnantWomenHealthStatusCounts(): Promise<{ status: string; count: number }[]> {
    const result = await db
      .select({
        status: pregnantWomen.healthStatus,
        count: count(pregnantWomen.id).as('count'),
      })
      .from(pregnantWomen)
      .groupBy(pregnantWomen.healthStatus);
    return result as { status: string; count: number }[];
  }

  async getDashboardStats(): Promise<{
    totalChildren: number;
    totalPregnantWomen: number;
    totalCamps: number;
    totalMothers: number; // Added totalMothers
    childrenByGender: { gender: string; count: number }[];
    pregnantWomenByMonth: { month: number; count: number }[];
    childrenHealthStatusCounts: { status: string; count: number }[];
    pregnantWomenHealthStatusCounts: { status: string; count: number }[];
  }> {
    const [totalChildrenResult] = await db.select({ count: count() }).from(children);
    const [totalPregnantWomenResult] = await db.select({ count: count() }).from(pregnantWomen);
    const [totalCampsResult] = await db.select({ count: count() }).from(camps);
    const [totalMothersResult] = await db.select({ count: count() }).from(children).where(eq(children.isBreastfeeding, true)); // Count breastfeeding mothers

    const childrenByGender = await this.getChildrenGenderDistribution();
    const pregnantWomenByMonth = await this.getPregnantWomenByMonth();
    const childrenHealthStatusCounts = await this.getChildrenHealthStatusCounts();
    const pregnantWomenHealthStatusCounts = await this.getPregnantWomenHealthStatusCounts();

    return {
      totalChildren: totalChildrenResult.count || 0,
      totalPregnantWomen: totalPregnantWomenResult.count || 0,
      totalCamps: totalCampsResult.count || 0,
      totalMothers: totalMothersResult.count || 0, // Include totalMothers
      childrenByGender,
      pregnantWomenByMonth,
      childrenHealthStatusCounts,
      pregnantWomenHealthStatusCounts,
    };
  }
}

export const storage = new DatabaseStorage();
