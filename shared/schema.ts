import { pgTable, text, serial, integer, boolean, date, timestamp, varchar } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export * from "./models/auth";

export const camps = pgTable("camps", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  location: text("location").notNull(),
});

export const children = pgTable("children", {
  id: serial("id").primaryKey(),
  fullName: text("full_name").notNull(),
  idNumber: text("id_number").notNull(), // Unique identifier
  dateOfBirth: text("date_of_birth").notNull(), // Storing as ISO string for simplicity
  gender: text("gender").notNull(),
  healthStatus: text("health_status").notNull(),
  fatherName: text("father_name").notNull(),
  fatherId: text("father_id").notNull(),
  motherName: text("mother_name").notNull(),
  motherId: text("mother_id").notNull(),
  isBreastfeeding: boolean("is_breastfeeding").default(false),
  healthNotes: text("health_notes"),
  campId: integer("camp_id"), // Optional relation to camp
  createdAt: timestamp("created_at").defaultNow(),
});

export const pregnantWomen = pgTable("pregnant_women", {
  id: serial("id").primaryKey(),
  fullName: text("full_name").notNull(),
  idNumber: text("id_number").notNull(), // Unique identifier
  healthStatus: text("health_status").notNull(),
  pregnancyMonth: integer("pregnancy_month").notNull(),
  spouseName: text("spouse_name").notNull(),
  spouseId: text("spouse_id").notNull(),
  healthNotes: text("health_notes"),
  campId: integer("camp_id"), // Optional relation to camp
  createdAt: timestamp("created_at").defaultNow(),
});

// Schemas
export const insertCampSchema = createInsertSchema(camps).omit({ id: true });
export const insertChildSchema = createInsertSchema(children).omit({ id: true, createdAt: true });
export const insertPregnantWomanSchema = createInsertSchema(pregnantWomen).omit({ id: true, createdAt: true });

// Types
export type Camp = typeof camps.$inferSelect;
export type InsertCamp = z.infer<typeof insertCampSchema>;
export type Child = typeof children.$inferSelect;
export type InsertChild = z.infer<typeof insertChildSchema>;
export type PregnantWoman = typeof pregnantWomen.$inferSelect;
export type InsertPregnantWoman = z.infer<typeof insertPregnantWomanSchema>;

// API Types
export type BulkImportResponse = { success: number; failed: number; errors: string[] };

export type ChildResponse = Child;
export type PregnantWomanResponse = PregnantWoman;
