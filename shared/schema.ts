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
  idNumber: text("id_number").notNull().unique(), // Unique identifier
  fullName: text("full_name").notNull(),
  dateOfBirth: text("date_of_birth").notNull(), // Storing as ISO string for simplicity
  gender: text("gender").notNull(),
  healthStatus: text("health_status").notNull(),
  fatherName: text("father_name").notNull(),
  fatherId: text("father_id").notNull(),
  motherName: text("mother_name").notNull(),
  motherId: text("mother_id").notNull(),
  motherDateOfBirth: text("mother_date_of_birth"), // New field
  isBreastfeeding: boolean("is_breastfeeding").default(false),
  motherHealthStatus: text("mother_health_status"), // New field
  contactNumber: text("contact_number"), // New field
  notes: text("notes"), // Renamed from healthNotes
  campId: integer("camp_id"), // Optional relation to camp
  createdAt: timestamp("created_at").defaultNow(),
});

export const pregnantWomen = pgTable("pregnant_women", {
  id: serial("id").primaryKey(),
  idNumber: text("id_number").notNull().unique(), // Unique identifier
  fullName: text("full_name").notNull(),
  dateOfBirth: text("date_of_birth"), // New field
  healthStatus: text("health_status").notNull(),
  pregnancyMonth: integer("pregnancy_month").notNull(),
  spouseName: text("spouse_name").notNull(),
  spouseId: text("spouse_id").notNull(),
  contactNumber: text("contact_number"), // New field
  notes: text("notes"), // Renamed from healthNotes
  campId: integer("camp_id"), // Optional relation to camp
  createdAt: timestamp("created_at").defaultNow(),
});

export const systemSettings = pgTable("system_settings", {
  key: text("key").primaryKey(),
  value: text("value"), // Store settings as text, can be JSON stringified for complex objects
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Schemas
export const insertCampSchema = createInsertSchema(camps).omit({ id: true });
export const insertChildSchema = createInsertSchema(children).omit({ id: true, createdAt: true });
export const insertPregnantWomanSchema = createInsertSchema(pregnantWomen).omit({ id: true, createdAt: true });
export const insertSystemSettingSchema = createInsertSchema(systemSettings).omit({ createdAt: true, updatedAt: true });
export const updateSystemSettingSchema = insertSystemSettingSchema.partial(); // For updating just value

// Types
export type Camp = typeof camps.$inferSelect;
export type InsertCamp = z.infer<typeof insertCampSchema>;
export type Child = typeof children.$inferSelect;
export type InsertChild = z.infer<typeof insertChildSchema>;
export type PregnantWoman = typeof pregnantWomen.$inferSelect;
export type InsertPregnantWoman = z.infer<typeof insertPregnantWomanSchema>;
export type SystemSetting = typeof systemSettings.$inferSelect;
export type InsertSystemSetting = z.infer<typeof insertSystemSettingSchema>;
export type UpdateSystemSetting = z.infer<typeof updateSystemSettingSchema>;

// API Types
export type BulkImportResponse = { success: number; failed: number; errors: string[] };

export type ChildResponse = Child;
export type PregnantWomanResponse = PregnantWoman;
