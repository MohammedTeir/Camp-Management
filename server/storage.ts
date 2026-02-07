import { db } from "./db";
import {
  camps, children, pregnantWomen,
  type InsertCamp, type InsertChild, type InsertPregnantWoman,
  type Camp, type Child, type PregnantWoman
} from "@shared/schema";
import { eq, or } from "drizzle-orm";

export interface IStorage {
  // Camps
  getCamps(): Promise<Camp[]>;
  createCamp(camp: InsertCamp): Promise<Camp>;

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

  // Children
  async getChildren(): Promise<Child[]> {
    return await db.select().from(children);
  }

  async getChild(id: number): Promise<Child | undefined> {
    const [child] = await db.select().from(children).where(eq(children.id, id));
    return child;
  }

  async createChild(child: InsertChild): Promise<Child> {
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
}

export const storage = new DatabaseStorage();
