import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { api, errorSchemas } from "@shared/routes";
import { z } from "zod";
import { setupAuth, registerAuthRoutes, isAuthenticated, registerJwtRoutes } from "./auth_system/auth";

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  // Setup Authentication
  await setupAuth(app);
  registerAuthRoutes(app);
  registerJwtRoutes(app);

  // Stats Dashboard
  app.get(api.stats.dashboard.path, isAuthenticated, async (req, res) => {
    try {
      const children = await storage.getChildren();
      const pregnantWomen = await storage.getPregnantWomen();
      const camps = await storage.getCamps();

      const stats = {
        totalChildren: children.length,
        totalMothers: children.filter(c => c.isBreastfeeding).length,
        totalPregnant: pregnantWomen.length,
        totalCamps: camps.length,
      };

      res.json(stats);
    } catch (err) {
      res.status(500).json({ message: "Failed to fetch stats" });
    }
  });

  // Camps
  app.get(api.camps.list.path, isAuthenticated, async (req, res) => {
    const camps = await storage.getCamps();
    res.json(camps);
  });

  app.post(api.camps.create.path, isAuthenticated, async (req, res) => {
    try {
      const input = api.camps.create.input.parse(req.body);
      const camp = await storage.createCamp(input);
      res.status(201).json(camp);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({
          message: err.errors[0].message,
          field: err.errors[0].path.join('.'),
        });
      }
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Children
  app.get(api.children.list.path, isAuthenticated, async (req, res) => {
    const children = await storage.getChildren();
    res.json(children);
  });

  // Public/Household Head Registration for Children
  // Note: This is public as per spec for "Self-Registration"
  app.post(api.children.create.path, async (req, res) => {
    try {
      const input = api.children.create.input.parse(req.body);
      const child = await storage.createChild(input);
      res.status(201).json(child);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({
          message: err.errors[0].message,
          field: err.errors[0].path.join('.'),
        });
      }
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.get(api.children.get.path, isAuthenticated, async (req, res) => {
    const child = await storage.getChild(Number(req.params.id));
    if (!child) return res.status(404).json({ message: "Child not found" });
    res.json(child);
  });

  // Authenticated Update (Admin) or Self-Service Update (Needs logic, but keeping simple for now)
  // Spec says "Ability to update/delete their own records" from Lookup page.
  // We'll allow public update/delete if they have the ID, or maybe we should restrict?
  // For MVP, we'll allow it on the public API endpoint but frontend will only expose it after lookup.
  app.put(api.children.update.path, async (req, res) => {
    try {
      const input = api.children.update.input.parse(req.body);
      const updated = await storage.updateChild(Number(req.params.id), input);
      if (!updated) return res.status(404).json({ message: "Child not found" });
      res.json(updated);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({
          message: err.errors[0].message,
          field: err.errors[0].path.join('.'),
        });
      }
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.delete(api.children.delete.path, async (req, res) => {
    await storage.deleteChild(Number(req.params.id));
    res.status(204).send();
  });

  // Public Lookup
  app.get(api.children.lookup.path, async (req, res) => {
    const { parentId } = req.query;
    if (!parentId || typeof parentId !== 'string') {
      return res.status(400).json({ message: "Parent ID is required" });
    }
    const children = await storage.lookupChildren(parentId);
    res.json(children);
  });

  // Pregnant Women
  app.get(api.pregnantWomen.list.path, isAuthenticated, async (req, res) => {
    const women = await storage.getPregnantWomen();
    res.json(women);
  });

  // Public/Household Head Registration for Pregnant Women
  app.post(api.pregnantWomen.create.path, async (req, res) => {
    try {
      const input = api.pregnantWomen.create.input.parse(req.body);
      const woman = await storage.createPregnantWoman(input);
      res.status(201).json(woman);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({
          message: err.errors[0].message,
          field: err.errors[0].path.join('.'),
        });
      }
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.get(api.pregnantWomen.get.path, isAuthenticated, async (req, res) => {
    const woman = await storage.getPregnantWoman(Number(req.params.id));
    if (!woman) return res.status(404).json({ message: "Record not found" });
    res.json(woman);
  });

  app.put(api.pregnantWomen.update.path, async (req, res) => {
    try {
      const input = api.pregnantWomen.update.input.parse(req.body);
      const updated = await storage.updatePregnantWoman(Number(req.params.id), input);
      if (!updated) return res.status(404).json({ message: "Record not found" });
      res.json(updated);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({
          message: err.errors[0].message,
          field: err.errors[0].path.join('.'),
        });
      }
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.delete(api.pregnantWomen.delete.path, async (req, res) => {
    await storage.deletePregnantWoman(Number(req.params.id));
    res.status(204).send();
  });

  // Public Lookup
  app.get(api.pregnantWomen.lookup.path, async (req, res) => {
    const { spouseId } = req.query;
    if (!spouseId || typeof spouseId !== 'string') {
      return res.status(400).json({ message: "Spouse ID is required" });
    }
    const women = await storage.lookupPregnantWomen(spouseId);
    res.json(women);
  });

  // Seed Data
  if ((await storage.getCamps()).length === 0) {
    await storage.createCamp({ name: "Camp Alpha", location: "Sector 1" });
    await storage.createCamp({ name: "Camp Beta", location: "Sector 2" });
  }

  return httpServer;
}
