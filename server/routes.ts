import { createServer, type Server } from "http";
import { storage } from "./storage";
import { api, errorSchemas } from "@shared/routes";
import { z } from "zod";
import { setupAuth, registerAuthRoutes, isAuthenticated, registerJwtRoutes, hasRole } from "./auth_system/auth";
import ExcelJS from 'exceljs'; // Import exceljs
import { insertChildSchema, insertPregnantWomanSchema } from '@shared/schema'; // Import schemas
import bcrypt from 'bcryptjs'; // Import bcrypt for password hashing

// Helper function to process Excel files for import
async function processExcelFile<T>(
  fileContent: string,
  schema: z.ZodSchema<T>,
  createFunction: (data: T) => Promise<any>
) {
  const workbook = new ExcelJS.Workbook();
  const base64Data = fileContent.split(';base64,').pop();
  if (!base64Data) {
    throw new Error("Invalid base64 file content.");
  }
  const buffer = Buffer.from(base64Data, 'base64');
  await workbook.xlsx.load(buffer);

  const worksheet = workbook.worksheets[0];
  if (!worksheet) {
    throw new Error("No worksheet found in the Excel file.");
  }

  // Get all camps to map names to IDs
  const camps = await storage.getCamps();

  const results = {
    success: 0,
    failed: 0,
    errors: [] as string[],
  };

  const headers: string[] = [];
  worksheet.getRow(1).eachCell({ includeEmpty: false }, (cell) => {
    headers.push(cell.value?.toString() || '');
  });

  for (let i = 2; i <= worksheet.rowCount; i++) { // Start from second row for data
    const row = worksheet.getRow(i);
    const rowData: Record<string, any> = {};
    row.eachCell({ includeEmpty: true }, (cell, colNumber) => {
      const header = headers[colNumber - 1];
      if (header) {
        rowData[header] = cell.value;
      }
    });

    try {
      // Map Excel headers to schema fields (this mapping might need to be more sophisticated)
      // For simplicity, assume Excel headers match schema field names or are close.
      const mappedData: Record<string, any> = {};
      Object.keys(rowData).forEach(key => {
        const schemaKey = key.replace(/ /g, ''); // Remove spaces from header for matching
        // Basic mapping for known discrepancies or data types
        if (schemaKey === 'dateOfBirth' && typeof rowData[key] === 'object' && rowData[key].result instanceof Date) {
          mappedData[schemaKey] = rowData[key].result.toISOString().split('T')[0]; // Format Date object to YYYY-MM-DD
        } else if (schemaKey === 'isBreastfeeding') {
          mappedData[schemaKey] = String(rowData[key]).toLowerCase() === 'yes' || String(rowData[key]) === '1' || String(rowData[key]) === 'true';
        } else if (schemaKey === 'pregnancyMonth') {
          mappedData[schemaKey] = parseInt(rowData[key]);
        } else if (schemaKey === 'campName' || schemaKey === 'campname' || schemaKey === 'Camp Name' || schemaKey === 'اسم المخيم') {
          // Map camp name to camp ID
          const campName = String(rowData[key]).trim();
          const camp = camps.find(c => c.name.trim() === campName);
          if (camp) {
            mappedData['campId'] = camp.id;
          } else {
            // If camp name is not found, set to null or undefined (assuming nullable in schema)
            mappedData['campId'] = null;
          }
        } else if (schemaKey === 'campId') {
          mappedData[schemaKey] = parseInt(rowData[key]);
        } else if (schemaKey === 'motherDateOfBirth' && typeof rowData[key] === 'object' && rowData[key].result instanceof Date) {
          mappedData[schemaKey] = rowData[key].result.toISOString().split('T')[0]; // Format Date object to YYYY-MM-DD
        } else if (schemaKey === 'motherHealthStatus' || schemaKey === 'contactNumber' || schemaKey === 'notes') {
          mappedData[schemaKey] = String(rowData[key]);
        } else if (schemaKey === 'FullName' || schemaKey === 'الاسم الكامل' || schemaKey === 'اسم الطفل رباعي' || schemaKey === 'اسم الزوجة الحامل رباعي') {
          // Handle Arabic variations of full name field
          mappedData['fullName'] = String(rowData[key]);
        } else if (schemaKey === 'IdNumber' || schemaKey === 'رقم الهوية' || schemaKey === 'رقم هوية الطفل' || schemaKey === 'رقم هوية الزوجة') {
          // Handle Arabic variations of ID number field
          mappedData['idNumber'] = String(rowData[key]);
        } else if (schemaKey === 'DateOfBirth' || schemaKey === 'تاريخ الميلاد' || schemaKey === 'تاريخ ميلاد الطفل' || schemaKey === 'تاريخ ميلاد الزوجة') {
          // Handle Arabic variations of date of birth field
          if (typeof rowData[key] === 'object' && rowData[key].result instanceof Date) {
            mappedData['dateOfBirth'] = rowData[key].result.toISOString().split('T')[0];
          } else {
            mappedData['dateOfBirth'] = String(rowData[key]);
          }
        } else if (schemaKey === 'HealthStatus' || schemaKey === 'الحالة الصحية' || schemaKey === 'حالة الطفل' || schemaKey === 'حالة الطفل (سليم / معاق / مريض "نوع المرض")' || schemaKey === 'حالة الزوجة' || schemaKey === 'حالة الزوجة (سليمة / مريضة / تعاني من مرض مزمن)') {
          // Handle Arabic variations of health status field
          mappedData['healthStatus'] = String(rowData[key]);
        } else if (schemaKey === 'FatherName' || schemaKey === 'اسم الأب الكامل' || schemaKey === 'اسم الاب رباعي') {
          // Handle Arabic variations of father name field
          mappedData['fatherName'] = String(rowData[key]);
        } else if (schemaKey === 'FatherId' || schemaKey === 'رقم هوية الأب' || schemaKey === 'رقم هوية الاب') {
          // Handle Arabic variations of father ID field
          mappedData['fatherId'] = String(rowData[key]);
        } else if (schemaKey === 'MotherName' || schemaKey === 'اسم الأم الكامل' || schemaKey === 'اسم الام رباعي') {
          // Handle Arabic variations of mother name field
          mappedData['motherName'] = String(rowData[key]);
        } else if (schemaKey === 'MotherId' || schemaKey === 'رقم هوية الأم' || schemaKey === 'رقم هوية الام') {
          // Handle Arabic variations of mother ID field
          mappedData['motherId'] = String(rowData[key]);
        } else if (schemaKey === 'MotherHealthStatus' || schemaKey === 'حالة الأم الصحية' || schemaKey === 'حالة الام' || schemaKey === 'حالة الام (سليمة / معاقة / مريضة "نوع المرض")') {
          // Handle Arabic variations of mother health status field
          mappedData['motherHealthStatus'] = String(rowData[key]);
        } else if (schemaKey === 'IsBreastfeeding' || schemaKey === 'هل الأم مُرضِعة؟' || schemaKey === 'هل الام مرضعة نعم ام لا') {
          // Handle Arabic variations of breastfeeding field
          mappedData['isBreastfeeding'] = String(rowData[key]).toLowerCase() === 'yes' || String(rowData[key]) === '1' || String(rowData[key]) === 'true' || String(rowData[key]) === 'نعم';
        } else if (schemaKey === 'SpouseName' || schemaKey === 'اسم الزوج' || schemaKey === 'اسم الزوج رباعي') {
          // Handle Arabic variations of spouse name field
          mappedData['spouseName'] = String(rowData[key]);
        } else if (schemaKey === 'SpouseId' || schemaKey === 'رقم هوية الزوج') {
          // Handle Arabic variations of spouse ID field
          mappedData['spouseId'] = String(rowData[key]);
        } else if (schemaKey === 'PregnancyMonth' || schemaKey === 'شهر الحمل') {
          // Handle Arabic variations of pregnancy month field
          mappedData['pregnancyMonth'] = parseInt(rowData[key]);
        } else {
          mappedData[schemaKey] = rowData[key];
        }
      });

      const parsedData = schema.parse(mappedData);
      await createFunction(parsedData);
      results.success++;
    } catch (err: any) {
      results.failed++;
      let errorMessage = `Row ${i}: `;
      if (err instanceof z.ZodError) {
        errorMessage += err.errors.map(e => `${e.path.join('.')}: ${e.message}`).join(', ');
      } else if (err.message.includes("يوجد طفل مسجل مسبقاً") || err.message.includes("يوجد امرأة حامل مسجلة مسبقاً")) {
        errorMessage += err.message;
      } else if (err.message.includes('duplicate key value violates unique constraint') || err.message.includes('UNIQUE constraint failed')) {
        if (schema === insertChildSchema) {
          errorMessage += "يوجد طفل مسجل مسبقاً برقم الهوية هذا";
        } else if (schema === insertPregnantWomanSchema) {
          errorMessage += "يوجد امرأة حامل مسجلة مسبقاً برقم الهوية هذا";
        } else {
          errorMessage += err.message;
        }
      } else {
        errorMessage += err.message;
      }
      results.errors.push(errorMessage);
    }
  }
  return results;
}

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
      const stats = await storage.getDashboardStats();
      res.json(stats);
    } catch (err) {
      console.error("Error fetching dashboard stats:", err); // Add logging for debugging
      res.status(500).json({ message: "فشل في جلب الإحصائيات" });
    }
  });

  // Camps - Allow access for authenticated users and for lookup updates
  app.get(api.camps.list.path, async (req, res) => {
    // For lookup page access, we allow access to camps list without full authentication
    // This enables users to update their records via the lookup page
    const camps = await storage.getCamps();
    res.json(camps);
  });

  app.post(api.camps.create.path, isAuthenticated, hasRole('admin'), async (req, res) => {
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
      res.status(500).json({ message: "خطأ داخلي في الخادم" });
    }
  });

  app.put(api.camps.update.path, isAuthenticated, hasRole('admin'), async (req, res) => {
    try {
      const input = api.camps.update.input.parse(req.body);
      const updatedCamp = await storage.updateCamp(Number(req.params.id), input);
      if (!updatedCamp) {
        return res.status(404).json({ message: "لم يتم العثور على المخيم" });
      }
      res.json(updatedCamp);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({
          message: err.errors[0].message,
          field: err.errors[0].path.join('.'),
        });
      }
      res.status(500).json({ message: "خطأ داخلي في الخادم" });
    }
  });

  app.delete(api.camps.delete.path, isAuthenticated, hasRole('admin'), async (req, res) => {
    try {
      const deleted = await storage.deleteCamp(Number(req.params.id));
      if (!deleted) {
        return res.status(404).json({ message: "لم يتم العثور على المخيم" });
      }
      res.status(204).send();
    } catch (err) {
      res.status(500).json({ message: "خطأ داخلي في الخادم" });
    }
  });

  // Children - Available to all authenticated users
  app.get(api.children.list.path, isAuthenticated, async (req, res) => {
    const children = await storage.getChildren();
    res.json(children);
  });

  // Public/Household Head Registration for Children
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
      // Handle duplicate entry error
      if (err instanceof Error && err.message.includes("يوجد طفل مسجل مسبقاً")) {
        return res.status(409).json({ message: err.message });
      }
      // Check for database unique constraint violation
      if (err instanceof Error && (err.message.includes('duplicate key value violates unique constraint') || err.message.includes('UNIQUE constraint failed'))) {
        return res.status(409).json({ message: "يوجد طفل مسجل مسبقاً برقم الهوية هذا" });
      }
      res.status(500).json({ message: "خطأ داخلي في الخادم" });
    }
  });

  app.get(api.children.get.path, async (req, res) => {
    const child = await storage.getChild(Number(req.params.id));
    if (!child) return res.status(404).json({ message: "لم يتم العثور على الطفل" });
    res.json(child);
  });

  // Update Child - Allow household members to update their own records, and admins to update any
  app.put(api.children.update.path, isAuthenticated, async (req, res) => {
    try {
      const user = req.user; // User object populated by isAuthenticated middleware
      if (!user) {
        return res.status(401).json({ message: "Access token required" });
      }

      // First, get the existing record to verify ownership
      const existingChild = await storage.getChild(Number(req.params.id));
      if (!existingChild) {
        return res.status(404).json({ message: "لم يتم العثور على الطفل" });
      }

      // Admins can update any record
      if (user.role === 'admin') {
        const input = api.children.update.input.parse(req.body);
        const updated = await storage.updateChild(Number(req.params.id), input);
        return res.json(updated);
      }

      // For non-admin users, verify ownership using the authenticated user's ID
      const requesterId = user.id;

      if (!requesterId || (requesterId !== existingChild.fatherId && requesterId !== existingChild.motherId)) {
        return res.status(403).json({ message: "غير مصرح لك بتحديث هذا السجل" });
      }

      const input = api.children.update.input.parse(req.body);
      const updated = await storage.updateChild(Number(req.params.id), input);
      res.json(updated);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({
          message: err.errors[0].message,
          field: err.errors[0].path.join('.'),
        });
      }
      res.status(500).json({ message: "خطأ داخلي في الخادم" });
    }
  });

  // Delete Child - Allow household members to delete their own records, and admins to delete any
  app.delete(api.children.delete.path, isAuthenticated, async (req, res) => {
    try {
      const user = req.user; // User object populated by isAuthenticated middleware
      if (!user) {
        return res.status(401).json({ message: "Access token required" });
      }

      // First, get the existing record to verify ownership
      const existingChild = await storage.getChild(Number(req.params.id));
      if (!existingChild) {
        return res.status(404).json({ message: "لم يتم العثور على الطفل" });
      }

      // Admins can delete any record
      if (user.role === 'admin') {
        await storage.deleteChild(Number(req.params.id));
        return res.status(204).send();
      }

      // For non-admin users, verify ownership using the authenticated user's ID
      const requesterId = user.id;

      if (!requesterId || (requesterId !== existingChild.fatherId && requesterId !== existingChild.motherId)) {
        return res.status(403).json({ message: "غير مصرح لك بحذف هذا السجل" });
      }

      await storage.deleteChild(Number(req.params.id));
      res.status(204).send();
    } catch (err) {
      res.status(500).json({ message: "خطأ داخلي في الخادم" });
    }
  });

  // Public Update Child - NO AUTHENTICATION OR ROLE CHECK (Security Risk: Publicly accessible)
  app.put(api.children.publicUpdate.path, async (req, res) => {
    try {
      const input = api.children.publicUpdate.input.parse(req.body);
      const updated = await storage.updateChild(Number(req.params.id), input);
      if (!updated) {
        return res.status(404).json({ message: "لم يتم العثور على الطفل" });
      }
      res.json(updated);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({
          message: err.errors[0].message,
          field: err.errors[0].path.join('.'),
        });
      }
      res.status(500).json({ message: "خطأ داخلي في الخادم" });
    }
  });

  // Public Delete Child - NO AUTHENTICATION OR ROLE CHECK (Security Risk: Publicly accessible)
  app.delete(api.children.publicDelete.path, async (req, res) => {
    try {
      const deleted = await storage.deleteChild(Number(req.params.id));
      if (!deleted) {
        return res.status(404).json({ message: "لم يتم العثور على الطفل" });
      }
      res.status(204).send();
    } catch (err) {
      res.status(500).json({ message: "خطأ داخلي في الخادم" });
    }
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

  // Pregnant Women - Require authentication but not admin role
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
      // Handle duplicate entry error
      if (err instanceof Error && err.message.includes("يوجد امرأة حامل مسجلة مسبقاً")) {
        return res.status(409).json({ message: err.message });
      }
      // Check for database unique constraint violation
      if (err instanceof Error && (err.message.includes('duplicate key value violates unique constraint') || err.message.includes('UNIQUE constraint failed'))) {
        return res.status(409).json({ message: "يوجد امرأة حامل مسجلة مسبقاً برقم الهوية هذا" });
      }
      res.status(500).json({ message: "خطأ داخلي في الخادم" });
    }
  });

  app.get(api.pregnantWomen.get.path, async (req, res) => {
    const woman = await storage.getPregnantWoman(Number(req.params.id));
    if (!woman) return res.status(404).json({ message: "لم يتم العثور على السجل" });
    res.json(woman);
  });

  // Update Pregnant Woman - Allow household members to update their own records, and admins to update any
  app.put(api.pregnantWomen.update.path, isAuthenticated, async (req, res) => {
    try {
      const user = req.user; // User object populated by isAuthenticated middleware
      if (!user) {
        return res.status(401).json({ message: "Access token required" });
      }

      // First, get the existing record to verify ownership
      const existingWoman = await storage.getPregnantWoman(Number(req.params.id));
      if (!existingWoman) {
        return res.status(404).json({ message: "لم يتم العثور على السجل" });
      }

      // Admins can update any record
      if (user.role === 'admin') {
        const input = api.pregnantWomen.update.input.parse(req.body);
        const updated = await storage.updatePregnantWoman(Number(req.params.id), input);
        return res.json(updated);
      }

      // For non-admin users, verify ownership using the authenticated user's ID
      const requesterId = user.id;

      if (!requesterId || (requesterId !== existingWoman.spouseId && requesterId !== existingWoman.idNumber)) {
        return res.status(403).json({ message: "غير مصرح لك بتحديث هذا السجل" });
      }

      const input = api.pregnantWomen.update.input.parse(req.body);
      const updated = await storage.updatePregnantWoman(Number(req.params.id), input);
      res.json(updated);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({
          message: err.errors[0].message,
          field: err.errors[0].path.join('.'),
        });
      }
      res.status(500).json({ message: "خطأ داخلي في الخادم" });
    }
  });

  // Delete Pregnant Woman - Allow household members to delete their own records, and admins to delete any
  app.delete(api.pregnantWomen.delete.path, isAuthenticated, async (req, res) => {
    try {
      const user = req.user; // User object populated by isAuthenticated middleware
      if (!user) {
        return res.status(401).json({ message: "Access token required" });
      }

      // First, get the existing record to verify ownership
      const existingWoman = await storage.getPregnantWoman(Number(req.params.id));
      if (!existingWoman) {
        return res.status(404).json({ message: "لم يتم العثور على السجل" });
      }

      // Admins can delete any record
      if (user.role === 'admin') {
        await storage.deletePregnantWoman(Number(req.params.id));
        return res.status(204).send();
      }

      // For non-admin users, verify ownership using the authenticated user's ID
      const requesterId = user.id;

      if (!requesterId || (requesterId !== existingWoman.spouseId && requesterId !== existingWoman.idNumber)) {
        return res.status(403).json({ message: "غير مصرح لك بحذف هذا السجل" });
      }

      await storage.deletePregnantWoman(Number(req.params.id));
      res.status(204).send();
    } catch (err) {
      res.status(500).json({ message: "خطأ داخلي في الخادم" });
    }
  });

  // Public Update Pregnant Woman - NO AUTHENTICATION OR ROLE CHECK (Security Risk: Publicly accessible)
  app.put(api.pregnantWomen.publicUpdate.path, async (req, res) => {
    try {
      const input = api.pregnantWomen.publicUpdate.input.parse(req.body);
      const updated = await storage.updatePregnantWoman(Number(req.params.id), input);
      if (!updated) {
        return res.status(404).json({ message: "لم يتم العثور على السجل" });
      }
      res.json(updated);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({
          message: err.errors[0].message,
          field: err.errors[0].path.join('.'),
        });
      }
      res.status(500).json({ message: "خطأ داخلي في الخادم" });
    }
  });

  // Public Delete Pregnant Woman - NO AUTHENTICATION OR ROLE CHECK (Security Risk: Publicly accessible)
  app.delete(api.pregnantWomen.publicDelete.path, async (req, res) => {
    try {
      const deleted = await storage.deletePregnantWoman(Number(req.params.id));
      if (!deleted) {
        return res.status(404).json({ message: "لم يتم العثور على السجل" });
      }
      res.status(204).send();
    } catch (err) {
      res.status(500).json({ message: "خطأ داخلي في الخادم" });
    }
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

  // Bulk Import for Children
  app.post(api.bulk.childrenImport.path, isAuthenticated, hasRole('admin'), async (req, res) => {
    try {
      const { fileContent } = api.bulk.childrenImport.input.parse(req.body);
      const results = await processExcelFile(fileContent, insertChildSchema, storage.createChild);
      res.json(results);
    } catch (err: any) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: "Validation error during import data parsing.", errors: err.errors });
      }
      res.status(500).json({ message: err.message || "فشل في استيراد سجلات الأطفال." });
    }
  });

  // Bulk Export for Children
  app.get(api.bulk.childrenExport.path, isAuthenticated, hasRole('admin'), async (req, res) => {
    try {
      const locale = req.query.locale || 'en'; // Get locale from query parameter, default to 'en'

      // Load appropriate translations
      let translations;
      // Always use Arabic regardless of locale for consistency with UI
      translations = {
        id: 'م',
        fullName: 'اسم الطفل رباعي',
        idNumber: 'رقم هوية الطفل',
        dateOfBirth: 'تاريخ ميلاد الطفل',
        gender: 'الجنس',
        healthStatus: 'حالة الطفل (سليم / معاق / مريض "نوع المرض")',
        fatherName: 'اسم الاب رباعي',
        fatherId: 'رقم هوية الاب',
        motherName: 'اسم الام رباعي',
        motherId: 'رقم هوية الام',
        motherDateOfBirth: 'تاريخ ميلاد الام',
        isBreastfeeding: 'هل الام مرضعة نعم ام لا',
        motherHealthStatus: 'حالة الام (سليمة / معاقة / مريضة "نوع المرض")',
        contactNumber: 'رقم التواصل',
        notes: 'ملاحظات',
        campName: 'اسم المخيم',
        yes: 'نعم',
        no: 'لا',
        childrenSheet: 'الأطفال'
      };

      const children = await storage.getChildren();
      const camps = await storage.getCamps(); // Get camps to map IDs to names
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet(translations.childrenSheet);

      // Define columns for the worksheet with Arabic headers if locale is Arabic
      worksheet.columns = [
        { header: translations.id, key: 'id', width: 8 },
        { header: translations.fullName, key: 'fullName', width: 40 },
        { header: translations.idNumber, key: 'idNumber', width: 25 },
        { header: translations.dateOfBirth, key: 'dateOfBirth', width: 18 },
        { header: translations.gender, key: 'gender', width: 12 },
        { header: translations.healthStatus, key: 'healthStatus', width: 40 },
        { header: translations.fatherName, key: 'fatherName', width: 40 },
        { header: translations.fatherId, key: 'fatherId', width: 25 },
        { header: translations.motherName, key: 'motherName', width: 40 },
        { header: translations.motherId, key: 'motherId', width: 25 },
        { header: translations.motherDateOfBirth, key: 'motherDateOfBirth', width: 18 }, // New column
        { header: translations.isBreastfeeding, key: 'isBreastfeeding', width: 20 },
        { header: translations.motherHealthStatus, key: 'motherHealthStatus', width: 40 }, // New column
        { header: translations.contactNumber, key: 'contactNumber', width: 25 }, // New column
        { header: translations.notes, key: 'notes', width: 50 }, // Renamed column
        { header: translations.campName, key: 'campName', width: 30 },
      ];

      // Add rows
      children.forEach((child, index) => {
        // Find camp name based on campId
        const camp = camps.find(c => c.id === child.campId);
        const campName = camp ? camp.name : 'غير محدد';
        
        // Convert gender to Arabic
        const genderArabic = child.gender === 'male' ? 'ذكر' : (child.gender === 'female' ? 'أنثى' : child.gender);
        
        worksheet.addRow({
          id: index + 1, // Sequential number starting from 1
          fullName: child.fullName,
          idNumber: child.idNumber,
          dateOfBirth: child.dateOfBirth,
          gender: genderArabic,
          healthStatus: child.healthStatus,
          fatherName: child.fatherName,
          fatherId: child.fatherId,
          motherName: child.motherName,
          motherId: child.motherId,
          motherDateOfBirth: child.motherDateOfBirth, // New field
          isBreastfeeding: child.isBreastfeeding ? translations.yes : translations.no, // Use translated Yes/No
          motherHealthStatus: child.motherHealthStatus, // New field
          contactNumber: child.contactNumber, // New field
          notes: child.notes, // Renamed field
          campName: campName,
        });
      });
      
      // Apply formatting to the worksheet
      worksheet.eachRow((row, rowNum) => {
        if (rowNum === 1) {
          // Header row formatting
          row.eachCell(cell => {
            cell.font = { bold: true, color: { argb: 'FFFFFF' } };
            cell.fill = {
              type: 'pattern',
              pattern: 'solid',
              fgColor: { argb: '4F46E5' } // Indigo color
            };
            cell.alignment = { vertical: 'middle', horizontal: 'center' };
            cell.border = {
              top: { style: 'thin', color: { argb: 'FF000000' } },
              left: { style: 'thin', color: { argb: 'FF000000' } },
              bottom: { style: 'thin', color: { argb: 'FF000000' } },
              right: { style: 'thin', color: { argb: 'FF000000' } }
            };
          });
        } else {
          // Data row formatting
          row.eachCell(cell => {
            cell.alignment = { vertical: 'middle', horizontal: 'center' };
            // Add borders to all cells for better visibility
            cell.border = {
              top: { style: 'thin', color: { argb: 'FFD1D5DB' } }, // Light gray border
              left: { style: 'thin', color: { argb: 'FFD1D5DB' } },
              bottom: { style: 'thin', color: { argb: 'FFD1D5DB' } },
              right: { style: 'thin', color: { argb: 'FFD1D5DB' } }
            };
            // Alternate row colors for better readability
            if (rowNum % 2 === 0) {
              cell.fill = {
                type: 'pattern',
                pattern: 'solid',
                fgColor: { argb: 'F3F4F6' } // Light gray
              };
            }
          });
        }
      });
      
      // Column widths are already set, no need for auto-adjustment

      res.setHeader(
        'Content-Type',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      );
      res.setHeader(
        'Content-Disposition',
        'attachment; filename=children-export.xlsx'
      );

      await workbook.xlsx.write(res);
      res.end();
    } catch (err: any) {
      res.status(500).json({ message: err.message || "فشل في تصدير سجلات الأطفال." });
    }
  });

  // Bulk Import for Pregnant Women
  app.post(api.bulk.pregnantWomenImport.path, isAuthenticated, hasRole('admin'), async (req, res) => {
    try {
      const { fileContent } = api.bulk.pregnantWomenImport.input.parse(req.body);
      const results = await processExcelFile(fileContent, insertPregnantWomanSchema, storage.createPregnantWoman);
      res.json(results);
    } catch (err: any) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: "Validation error during import data parsing.", errors: err.errors });
      }
      res.status(500).json({ message: err.message || "فشل في استيراد سجلات النساء الحوامل." });
    }
  });

  // Bulk Export for Pregnant Women
  app.get(api.bulk.pregnantWomenExport.path, isAuthenticated, hasRole('admin'), async (req, res) => {
    try {
      const locale = req.query.locale || 'en'; // Get locale from query parameter, default to 'en'

      // Load appropriate translations
      let translations;
      // Always use Arabic regardless of locale for consistency with UI
      translations = {
        id: 'م',
        fullName: 'اسم الزوجة الحامل رباعي',
        idNumber: 'رقم هوية الزوجة',
        dateOfBirth: 'تاريخ ميلاد الزوجة',
        healthStatus: 'حالة الزوجة (سليمة / معاقة / مريضة "نوع المرض")',
        pregnancyMonth: 'شهر الحمل',
        spouseName: 'اسم الزوج رباعي',
        spouseId: 'رقم هوية الزوج',
        contactNumber: 'رقم التواصل',
        notes: 'ملاحظات',
        campName: 'اسم المخيم',
        pregnantWomenSheet: 'النساء الحوامل'
      };

      const women = await storage.getPregnantWomen();
      const camps = await storage.getCamps(); // Get camps to map IDs to names
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet(translations.pregnantWomenSheet);

      // Define columns for the worksheet with Arabic headers if locale is Arabic
      worksheet.columns = [
        { header: translations.id, key: 'id', width: 8 },
        { header: translations.fullName, key: 'fullName', width: 40 },
        { header: translations.idNumber, key: 'idNumber', width: 25 },
        { header: translations.dateOfBirth, key: 'dateOfBirth', width: 18 }, // New column
        { header: translations.healthStatus, key: 'healthStatus', width: 40 },
        { header: translations.pregnancyMonth, key: 'pregnancyMonth', width: 15 },
        { header: translations.spouseName, key: 'spouseName', width: 40 },
        { header: translations.spouseId, key: 'spouseId', width: 25 },
        { header: translations.contactNumber, key: 'contactNumber', width: 25 }, // New column
        { header: translations.notes, key: 'notes', width: 50 }, // Renamed column
        { header: translations.campName, key: 'campName', width: 30 },
      ];

      // Add rows
      women.forEach((woman, index) => {
        // Find camp name based on campId
        const camp = camps.find(c => c.id === woman.campId);
        const campName = camp ? camp.name : 'غير محدد';
        
        worksheet.addRow({
          id: index + 1, // Sequential number starting from 1
          fullName: woman.fullName,
          idNumber: woman.idNumber,
          dateOfBirth: woman.dateOfBirth, // New field
          healthStatus: woman.healthStatus,
          pregnancyMonth: woman.pregnancyMonth,
          spouseName: woman.spouseName,
          spouseId: woman.spouseId,
          contactNumber: woman.contactNumber, // New field
          notes: woman.notes, // Renamed field
          campName: campName,
        });
      });
      
      // Apply formatting to the worksheet
      worksheet.eachRow((row, rowNum) => {
        if (rowNum === 1) {
          // Header row formatting
          row.eachCell(cell => {
            cell.font = { bold: true, color: { argb: 'FFFFFF' } };
            cell.fill = {
              type: 'pattern',
              pattern: 'solid',
              fgColor: { argb: '4F46E5' } // Indigo color
            };
            cell.alignment = { vertical: 'middle', horizontal: 'center' };
            cell.border = {
              top: { style: 'thin', color: { argb: 'FF000000' } },
              left: { style: 'thin', color: { argb: 'FF000000' } },
              bottom: { style: 'thin', color: { argb: 'FF000000' } },
              right: { style: 'thin', color: { argb: 'FF000000' } }
            };
          });
        } else {
          // Data row formatting
          row.eachCell(cell => {
            cell.alignment = { vertical: 'middle', horizontal: 'center' };
            // Add borders to all cells for better visibility
            cell.border = {
              top: { style: 'thin', color: { argb: 'FFD1D5DB' } }, // Light gray border
              left: { style: 'thin', color: { argb: 'FFD1D5DB' } },
              bottom: { style: 'thin', color: { argb: 'FFD1D5DB' } },
              right: { style: 'thin', color: { argb: 'FFD1D5DB' } }
            };
            // Alternate row colors for better readability
            if (rowNum % 2 === 0) {
              cell.fill = {
                type: 'pattern',
                pattern: 'solid',
                fgColor: { argb: 'F3F4F6' } // Light gray
              };
            }
          });
        }
      });
      
      // Column widths are already set, no need for auto-adjustment

      res.setHeader(
        'Content-Type',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      );
      res.setHeader(
        'Content-Disposition',
        'attachment; filename=pregnant-women-export.xlsx'
      );

      await workbook.xlsx.write(res);
      res.end();
    } catch (err: any) {
      res.status(500).json({ message: err.message || "فشل في تصدير سجلات النساء الحوامل." });
    }
  });

  // Template Download for Children
  app.get(api.bulk.childrenTemplate.path, isAuthenticated, hasRole('admin'), async (req, res) => {
    try {
      // Always use Arabic regardless of locale for consistency with UI
      const translations = {
        fullName: 'اسم الطفل رباعي',
        idNumber: 'رقم هوية الطفل',
        dateOfBirth: 'تاريخ ميلاد الطفل',
        gender: 'الجنس',
        healthStatus: 'حالة الطفل (سليم / معاق / مريض "نوع المرض")',
        fatherName: 'اسم الاب رباعي',
        fatherId: 'رقم هوية الاب',
        motherName: 'اسم الام رباعي',
        motherId: 'رقم هوية الام',
        motherDateOfBirth: 'تاريخ ميلاد الام',
        isBreastfeeding: 'هل الام مرضعة نعم ام لا',
        motherHealthStatus: 'حالة الام (سليمة / معاقة / مريضة "نوع المرض")',
        contactNumber: 'رقم التواصل',
        notes: 'ملاحظات',
        campName: 'اسم المخيم',
        childrenSheet: 'نموذج-الأطفال'
      };

      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet(translations.childrenSheet);

      // Define columns for the worksheet with Arabic headers if locale is Arabic
      worksheet.columns = [
        { header: translations.fullName, key: 'fullName', width: 40 },
        { header: translations.idNumber, key: 'idNumber', width: 25 },
        { header: translations.dateOfBirth, key: 'dateOfBirth', width: 18 },
        { header: translations.gender, key: 'gender', width: 12 },
        { header: translations.healthStatus, key: 'healthStatus', width: 40 },
        { header: translations.fatherName, key: 'fatherName', width: 40 },
        { header: translations.fatherId, key: 'fatherId', width: 25 },
        { header: translations.motherName, key: 'motherName', width: 40 },
        { header: translations.motherId, key: 'motherId', width: 25 },
        { header: translations.motherDateOfBirth, key: 'motherDateOfBirth', width: 18 },
        { header: translations.isBreastfeeding, key: 'isBreastfeeding', width: 20 },
        { header: translations.motherHealthStatus, key: 'motherHealthStatus', width: 40 },
        { header: translations.contactNumber, key: 'contactNumber', width: 25 },
        { header: translations.notes, key: 'notes', width: 50 },
        { header: translations.campName, key: 'campName', width: 30 },
      ];

      // Add an empty row as an example
      worksheet.addRow({});

      // Apply formatting to the worksheet
      worksheet.eachRow((row, rowNum) => {
        if (rowNum === 1) {
          // Header row formatting
          row.eachCell(cell => {
            cell.font = { bold: true, color: { argb: 'FFFFFF' } };
            cell.fill = {
              type: 'pattern',
              pattern: 'solid',
              fgColor: { argb: '4F46E5' } // Indigo color
            };
            cell.alignment = { vertical: 'middle', horizontal: 'center' };
            cell.border = {
              top: { style: 'thin', color: { argb: 'FF000000' } },
              left: { style: 'thin', color: { argb: 'FF000000' } },
              bottom: { style: 'thin', color: { argb: 'FF000000' } },
              right: { style: 'thin', color: { argb: 'FF000000' } }
            };
          });
        } else {
          // Data row formatting
          row.eachCell(cell => {
            cell.alignment = { vertical: 'middle', horizontal: 'center' };
            // Add borders to all cells for better visibility
            cell.border = {
              top: { style: 'thin', color: { argb: 'FFD1D5DB' } }, // Light gray border
              left: { style: 'thin', color: { argb: 'FFD1D5DB' } },
              bottom: { style: 'thin', color: { argb: 'FFD1D5DB' } },
              right: { style: 'thin', color: { argb: 'FFD1D5DB' } }
            };
            // Alternate row colors for better readability
            if (rowNum % 2 === 0) {
              cell.fill = {
                type: 'pattern',
                pattern: 'solid',
                fgColor: { argb: 'F3F4F6' } // Light gray
              };
            }
          });
        }
      });
      
      // Column widths are already set, no need for auto-adjustment

      res.setHeader(
        'Content-Type',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      );
      res.setHeader(
        'Content-Disposition',
        'attachment; filename=children-import-template.xlsx'
      );

      await workbook.xlsx.write(res);
      res.end();
    } catch (err: any) {
      res.status(500).json({ message: err.message || "فشل في إنشاء نموذج الأطفال." });
    }
  });

  // Template Download for Pregnant Women
  app.get(api.bulk.pregnantWomenTemplate.path, isAuthenticated, hasRole('admin'), async (req, res) => {
    try {
      // Always use Arabic regardless of locale for consistency with UI
      const translations = {
        fullName: 'اسم الزوجة الحامل رباعي',
        idNumber: 'رقم هوية الزوجة',
        dateOfBirth: 'تاريخ ميلاد الزوجة',
        healthStatus: 'حالة الزوجة (سليمة / معاقة / مريضة "نوع المرض")',
        pregnancyMonth: 'شهر الحمل',
        spouseName: 'اسم الزوج رباعي',
        spouseId: 'رقم هوية الزوج',
        contactNumber: 'رقم التواصل',
        notes: 'ملاحظات',
        campName: 'اسم المخيم',
        pregnantWomenSheet: 'نموذج-الحوامل'
      };

      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet(translations.pregnantWomenSheet);

      // Define columns for the worksheet with Arabic headers if locale is Arabic
      worksheet.columns = [
        { header: translations.fullName, key: 'fullName', width: 40 },
        { header: translations.idNumber, key: 'idNumber', width: 25 },
        { header: translations.dateOfBirth, key: 'dateOfBirth', width: 18 },
        { header: translations.healthStatus, key: 'healthStatus', width: 40 },
        { header: translations.pregnancyMonth, key: 'pregnancyMonth', width: 15 },
        { header: translations.spouseName, key: 'spouseName', width: 40 },
        { header: translations.spouseId, key: 'spouseId', width: 25 },
        { header: translations.contactNumber, key: 'contactNumber', width: 25 },
        { header: translations.notes, key: 'notes', width: 50 },
        { header: translations.campName, key: 'campName', width: 30 },
      ];

      // Add an empty row as an example
      worksheet.addRow({});

      // Apply formatting to the worksheet
      worksheet.eachRow((row, rowNum) => {
        if (rowNum === 1) {
          // Header row formatting
          row.eachCell(cell => {
            cell.font = { bold: true, color: { argb: 'FFFFFF' } };
            cell.fill = {
              type: 'pattern',
              pattern: 'solid',
              fgColor: { argb: '4F46E5' } // Indigo color
            };
            cell.alignment = { vertical: 'middle', horizontal: 'center' };
            cell.border = {
              top: { style: 'thin', color: { argb: 'FF000000' } },
              left: { style: 'thin', color: { argb: 'FF000000' } },
              bottom: { style: 'thin', color: { argb: 'FF000000' } },
              right: { style: 'thin', color: { argb: 'FF000000' } }
            };
          });
        } else {
          // Data row formatting
          row.eachCell(cell => {
            cell.alignment = { vertical: 'middle', horizontal: 'center' };
            // Add borders to all cells for better visibility
            cell.border = {
              top: { style: 'thin', color: { argb: 'FFD1D5DB' } }, // Light gray border
              left: { style: 'thin', color: { argb: 'FFD1D5DB' } },
              bottom: { style: 'thin', color: { argb: 'FFD1D5DB' } },
              right: { style: 'thin', color: { argb: 'FFD1D5DB' } }
            };
            // Alternate row colors for better readability
            if (rowNum % 2 === 0) {
              cell.fill = {
                type: 'pattern',
                pattern: 'solid',
                fgColor: { argb: 'F3F4F6' } // Light gray
              };
            }
          });
        }
      });
      
      // Column widths are already set, no need for auto-adjustment

      res.setHeader(
        'Content-Type',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      );
      res.setHeader(
        'Content-Disposition',
        'attachment; filename=pregnant-women-import-template.xlsx'
      );

      await workbook.xlsx.write(res);
      res.end();
    } catch (err: any) {
      res.status(500).json({ message: err.message || "فشل في إنشاء نموذج النساء الحوامل." });
    }
  });

  app.get(api.pregnantWomen.lookup.path, async (req, res) => {
    const { spouseId } = req.query;
    if (!spouseId || typeof spouseId !== 'string') {
      return res.status(400).json({ message: "Spouse ID is required" });
    }
    const women = await storage.lookupPregnantWomen(spouseId);
    res.json(women);
  });

  // Admin User Management Routes
  app.get(api.admin.users.list.path, isAuthenticated, hasRole('admin'), async (req, res) => {
    try {
      const users = await storage.getUsers();
      res.json(users.map(user => ({ ...user, password: '***' }))); // Censor password
    } catch (err) {
      res.status(500).json({ message: "فشل في جلب المستخدمين" });
    }
  });

  app.post(api.admin.users.create.path, isAuthenticated, hasRole('admin'), async (req, res) => {
    try {
      const input = api.admin.users.create.input.parse(req.body);
      const hashedPassword = await bcrypt.hash(input.password, 10); // Hash password
      const newUser = await storage.createUser({ ...input, password: hashedPassword });
      res.status(201).json({ ...newUser, password: '***' }); // Censor password
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

  app.get(api.admin.users.get.path, isAuthenticated, hasRole('admin'), async (req, res) => {
    try {
      const user = await storage.getUser(req.params.id);
      if (!user) return res.status(404).json({ message: "لم يتم العثور على المستخدم" });
      res.json({ ...user, password: '***' }); // Censor password
    } catch (err) {
      res.status(500).json({ message: "فشل في جلب المستخدم" });
    }
  });

  app.put(api.admin.users.update.path, isAuthenticated, hasRole('admin'), async (req, res) => {
    try {
      const input = api.admin.users.update.input.parse(req.body);
      let updates = { ...input };
      if (input.password) {
        updates.password = await bcrypt.hash(input.password, 10);
      }
      const updatedUser = await storage.updateUser(req.params.id, updates);
      if (!updatedUser) return res.status(404).json({ message: "لم يتم العثور على المستخدم" });
      res.json({ ...updatedUser, password: '***' }); // Censor password
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

  app.delete(api.admin.users.delete.path, isAuthenticated, hasRole('admin'), async (req, res) => {
    try {
      await storage.deleteUser(req.params.id);
      res.status(204).send();
    } catch (err) {
      res.status(500).json({ message: "فشل في حذف المستخدم" });
    }
  });

  // Admin System Settings Routes
  app.get(api.admin.settings.get.path, isAuthenticated, hasRole('admin'), async (req, res) => {
    try {
      const settings = await storage.getSystemSettings();
      // Transform array of { key, value } to an object for easier consumption on frontend
      const settingsObject: Record<string, string> = {};

      // Set defaults
      settingsObject.welcomeMessage = '';
      settingsObject.systemName = 'Family Management System';
      settingsObject.defaultLanguage = 'en';

      // Override with stored values
      settings.forEach(setting => {
        settingsObject[setting.key] = setting.value;
      });

      res.json(settingsObject);
    } catch (err) {
      res.status(500).json({ message: "فشل في جلب إعدادات النظام" });
    }
  });

  app.put(api.admin.settings.update.path, isAuthenticated, hasRole('admin'), async (req, res) => {
    try {
      // Input schema expects an object of key-value pairs
      const input = api.admin.settings.update.input.parse(req.body);
      const updatedSettings: Record<string, string> = {};

      for (const key in input) {
        if (Object.prototype.hasOwnProperty.call(input, key)) {
          const value = input[key];
          if (value !== undefined && value !== null) { // Allow empty strings but not undefined/null
            const updated = await storage.setSystemSetting(key, String(value));
            updatedSettings[updated.key] = updated.value;
          }
        }
      }
      
      // Return the complete settings object
      const allSettings = await storage.getSystemSettings();
      const settingsObject: Record<string, string> = {};
      
      // Set defaults
      settingsObject.welcomeMessage = '';
      settingsObject.systemName = 'Family Management System';
      settingsObject.defaultLanguage = 'en';
      
      // Override with stored values
      allSettings.forEach(setting => {
        settingsObject[setting.key] = setting.value;
      });
      
      res.json(settingsObject);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({
          message: err.errors[0].message,
          field: err.errors[0].path.join('.'),
        });
      }
      res.status(500).json({ message: "فشل في تحديث إعدادات النظام" });
    }
  });

  return httpServer;
}

