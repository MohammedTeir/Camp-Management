import { z } from 'zod';
import { insertChildSchema, insertPregnantWomanSchema, insertCampSchema, children, pregnantWomen, camps, users, type UpsertUser } from './schema';
import { users as usersTable } from './models/auth';
import { createInsertSchema } from 'drizzle-zod';

export const insertUserSchema = createInsertSchema(usersTable).extend({
  password: z.string().min(6, 'Password must be at least 6 characters long'),
});

export const errorSchemas = {
  validation: z.object({
    message: z.string(),
    field: z.string().optional(),
  }),
  notFound: z.object({
    message: z.string(),
  }),
  internal: z.object({
    message: z.string(),
  }),
  unauthorized: z.object({
    message: z.string(),
  }),
};

// Define response schema for bulk import
export const bulkImportResponseSchema = z.object({
  success: z.number(),
  failed: z.number(),
  errors: z.array(z.string()),
});

export const api = {
  auth: {
    login: {
      method: 'POST' as const,
      path: '/api/auth/login' as const,
      input: z.object({ username: z.string(), password: z.string() }),
      responses: {
        200: z.custom<typeof users.$inferSelect>(),
        401: errorSchemas.unauthorized,
      },
    },
    logout: {
      method: 'POST' as const,
      path: '/api/auth/logout' as const,
      responses: {
        200: z.object({ message: z.string() }),
      },
    },
    me: {
      method: 'GET' as const,
      path: '/api/user' as const,
      responses: {
        200: z.custom<typeof users.$inferSelect>(),
        401: errorSchemas.unauthorized,
      },
    },
  },
  camps: {
    list: {
      method: 'GET' as const,
      path: '/api/camps' as const,
      responses: {
        200: z.array(z.custom<typeof camps.$inferSelect>()),
      },
    },
    create: {
      method: 'POST' as const,
      path: '/api/camps' as const,
      input: insertCampSchema,
      responses: {
        201: z.custom<typeof camps.$inferSelect>(),
        400: errorSchemas.validation,
      },
    },
    update: {
      method: 'PUT' as const,
      path: '/api/camps/:id' as const,
      input: insertCampSchema.partial(),
      responses: {
        200: z.custom<typeof camps.$inferSelect>(),
        400: errorSchemas.validation,
        404: errorSchemas.notFound,
      },
    },
    delete: {
      method: 'DELETE' as const,
      path: '/api/camps/:id' as const,
      responses: {
        204: z.void(),
        404: errorSchemas.notFound,
      },
    },
  },
  children: {
    list: {
      method: 'GET' as const,
      path: '/api/children' as const,
      responses: {
        200: z.array(z.custom<typeof children.$inferSelect>()),
      },
    },
    create: {
      method: 'POST' as const,
      path: '/api/children' as const,
      input: insertChildSchema,
      responses: {
        201: z.custom<typeof children.$inferSelect>(),
        400: errorSchemas.validation,
      },
    },
    get: {
      method: 'GET' as const,
      path: '/api/children/:id' as const,
      responses: {
        200: z.custom<typeof children.$inferSelect>(),
        404: errorSchemas.notFound,
      },
    },
    update: {
      method: 'PUT' as const,
      path: '/api/children/:id' as const,
      input: insertChildSchema.partial(),
      query: z.object({ requesterId: z.string().optional() }).optional(), // Add requester ID for auth
      responses: {
        200: z.custom<typeof children.$inferSelect>(),
        403: errorSchemas.unauthorized,
        404: errorSchemas.notFound,
      },
    },
    publicUpdate: { // New public route for updates
      method: 'PUT' as const,
      path: '/api/public/children/:id' as const,
      input: insertChildSchema.partial(),
      responses: {
        200: z.custom<typeof children.$inferSelect>(),
        404: errorSchemas.notFound,
      },
    },
    delete: {
      method: 'DELETE' as const,
      path: '/api/children/:id' as const,
      query: z.object({ requesterId: z.string().optional() }).optional(), // Add requester ID for auth
      responses: {
        204: z.void(),
        403: errorSchemas.unauthorized,
        404: errorSchemas.notFound,
      },
    },
    publicDelete: { // New public route for deletes
      method: 'DELETE' as const,
      path: '/api/public/children/:id' as const,
      responses: {
        204: z.void(),
        404: errorSchemas.notFound,
      },
    },
    lookup: {
      method: 'GET' as const,
      path: '/api/lookup/children' as const,
      input: z.object({ parentId: z.string() }), // Search by Father ID or Mother ID
      responses: {
        200: z.array(z.custom<typeof children.$inferSelect>()),
      },
    }
  },
  pregnantWomen: {
    list: {
      method: 'GET' as const,
      path: '/api/pregnant-women' as const,
      responses: {
        200: z.array(z.custom<typeof pregnantWomen.$inferSelect>()),
      },
    },
    create: {
      method: 'POST' as const,
      path: '/api/pregnant-women' as const,
      input: insertPregnantWomanSchema,
      responses: {
        201: z.custom<typeof pregnantWomen.$inferSelect>(),
        400: errorSchemas.validation,
      },
    },
    get: {
      method: 'GET' as const,
      path: '/api/pregnant-women/:id' as const,
      responses: {
        200: z.custom<typeof pregnantWomen.$inferSelect>(),
        404: errorSchemas.notFound,
      },
    },
    update: {
      method: 'PUT' as const,
      path: '/api/pregnant-women/:id' as const,
      input: insertPregnantWomanSchema.partial(),
      query: z.object({ requesterId: z.string().optional() }).optional(), // Add requester ID for auth
      responses: {
        200: z.custom<typeof pregnantWomen.$inferSelect>(),
        403: errorSchemas.unauthorized,
        404: errorSchemas.notFound,
      },
    },
    publicUpdate: { // New public route for updates
      method: 'PUT' as const,
      path: '/api/public/pregnant-women/:id' as const,
      input: insertPregnantWomanSchema.partial(),
      responses: {
        200: z.custom<typeof pregnantWomen.$inferSelect>(),
        404: errorSchemas.notFound,
      },
    },
    delete: {
      method: 'DELETE' as const,
      path: '/api/pregnant-women/:id' as const,
      query: z.object({ requesterId: z.string().optional() }).optional(), // Add requester ID for auth
      responses: {
        204: z.void(),
        403: errorSchemas.unauthorized,
        404: errorSchemas.notFound,
      },
    },
    publicDelete: { // New public route for deletes
      method: 'DELETE' as const,
      path: '/api/public/pregnant-women/:id' as const,
      responses: {
        204: z.void(),
        404: errorSchemas.notFound,
      },
    },
    lookup: {
      method: 'GET' as const,
      path: '/api/lookup/pregnant-women' as const,
      input: z.object({ spouseId: z.string() }), // Search by Wife ID or Husband ID (using generic spouseId param for query)
      responses: {
        200: z.array(z.custom<typeof pregnantWomen.$inferSelect>()),
      },
    }
  },
  stats: {
    dashboard: {
      method: 'GET' as const,
      path: '/api/stats/dashboard' as const,
      responses: {
        200: z.object({
          totalChildren: z.number(),
          totalPregnantWomen: z.number(),
          totalCamps: z.number(),
          totalMothers: z.number(), // Breastfeeding mothers
          childrenByGender: z.array(z.object({
            gender: z.string(),
            count: z.number(),
          })),
          pregnantWomenByMonth: z.array(z.object({
            month: z.number(),
            count: z.number(),
          })),
          childrenHealthStatusCounts: z.array(z.object({
            status: z.string(),
            count: z.number(),
          })),
          pregnantWomenHealthStatusCounts: z.array(z.object({
            status: z.string(),
            count: z.number(),
          })),
        }),
      },
    }
  },
  bulk: {
    childrenImport: {
      method: 'POST' as const,
      path: '/api/bulk/children/import' as const,
      input: z.object({
        fileContent: z.string(), // Base64 encoded Excel file
        fileName: z.string(),
      }),
      responses: {
        200: bulkImportResponseSchema,
        400: errorSchemas.validation,
        401: errorSchemas.unauthorized,
        500: errorSchemas.internal,
      },
    },
    pregnantWomenImport: {
      method: 'POST' as const,
      path: '/api/bulk/pregnant-women/import' as const,
      input: z.object({
        fileContent: z.string(), // Base64 encoded Excel file
        fileName: z.string(),
      }),
      responses: {
        200: bulkImportResponseSchema,
        400: errorSchemas.validation,
        401: errorSchemas.unauthorized,
        500: errorSchemas.internal,
      },
    },
    childrenExport: {
      method: 'GET' as const,
      path: '/api/bulk/children/export' as const,
      responses: {
        200: z.any(), // Represents file download
        401: errorSchemas.unauthorized,
        500: errorSchemas.internal,
      },
    },
    pregnantWomenExport: {
      method: 'GET' as const,
      path: '/api/bulk/pregnant-women/export' as const,
      responses: {
        200: z.any(), // Represents file download
        401: errorSchemas.unauthorized,
        500: errorSchemas.internal,
      },
    },
    childrenTemplate: {
      method: 'GET' as const,
      path: '/api/bulk/children/template' as const,
      responses: {
        200: z.any(), // Represents file download
        401: errorSchemas.unauthorized,
        500: errorSchemas.internal,
      },
    },
    pregnantWomenTemplate: {
      method: 'GET' as const,
      path: '/api/bulk/pregnant-women/template' as const,
      responses: {
        200: z.any(), // Represents file download
        401: errorSchemas.unauthorized,
        500: errorSchemas.internal,
      },
    },
  },
  admin: {
    users: {
      list: {
        method: 'GET' as const,
        path: '/api/admin/users' as const,
        responses: {
          200: z.array(z.custom<typeof users.$inferSelect>()),
          401: errorSchemas.unauthorized,
          403: errorSchemas.unauthorized, // Assuming a specific admin role is required
          500: errorSchemas.internal,
        },
      },
      create: {
        method: 'POST' as const,
        path: '/api/admin/users' as const,
        input: insertUserSchema.omit({id: true, createdAt: true, updatedAt: true}).extend({ // Omit auto-generated fields
          password: z.string().min(6, "Password must be at least 6 characters long"),
          role: z.literal("admin").default("admin"), // Only admin role
        }),
        responses: {
          201: z.custom<typeof users.$inferSelect>(),
          400: errorSchemas.validation,
          401: errorSchemas.unauthorized,
          403: errorSchemas.unauthorized,
          500: errorSchemas.internal,
        },
      },
      get: {
        method: 'GET' as const,
        path: '/api/admin/users/:id' as const,
        responses: {
          200: z.custom<typeof users.$inferSelect>(),
          401: errorSchemas.unauthorized,
          403: errorSchemas.unauthorized,
          404: errorSchemas.notFound,
          500: errorSchemas.internal,
        },
      },
      update: {
        method: 'PUT' as const,
        path: '/api/admin/users/:id' as const,
        input: insertUserSchema.omit({id: true, createdAt: true, updatedAt: true}).partial().extend({
          password: z.string().min(6, "Password must be at least 6 characters long").optional(),
          role: z.literal("admin").optional(), // Only admin role
        }),
        responses: {
          200: z.custom<typeof users.$inferSelect>(),
          400: errorSchemas.validation,
          401: errorSchemas.unauthorized,
          403: errorSchemas.unauthorized,
          404: errorSchemas.notFound,
          500: errorSchemas.internal,
        },
      },
      delete: {
        method: 'DELETE' as const,
        path: '/api/admin/users/:id' as const,
        responses: {
          204: z.void(),
          401: errorSchemas.unauthorized,
          403: errorSchemas.unauthorized,
          404: errorSchemas.notFound,
          500: errorSchemas.internal,
        },
      },
    },
    settings: { // System settings for admin configuration
      get: {
        method: 'GET' as const,
        path: '/api/admin/settings' as const,
        responses: {
          200: z.object({
            welcomeMessage: z.string().optional(),
            systemName: z.string().optional(),
            defaultLanguage: z.string().optional(),
          }),
          401: errorSchemas.unauthorized,
          403: errorSchemas.unauthorized,
          500: errorSchemas.internal,
        },
      },
      update: {
        method: 'PUT' as const,
        path: '/api/admin/settings' as const,
        input: z.object({
          welcomeMessage: z.string().optional(),
          systemName: z.string().optional(),
          defaultLanguage: z.string().optional(),
        }),
        responses: {
          200: z.object({
            welcomeMessage: z.string().optional(),
            systemName: z.string().optional(),
            defaultLanguage: z.string().optional(),
          }),
          401: errorSchemas.unauthorized,
          403: errorSchemas.unauthorized,
          500: errorSchemas.internal,
        },
      },
    },
  },
};

export function buildUrl(path: string, params?: Record<string, string | number>, queryParams?: Record<string, string | number>): string {
  let url = path;
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (url.includes(`:${key}`)) {
        url = url.replace(`:${key}`, String(value));
      }
    });
  }
  
  // Add query parameters if provided
  if (queryParams) {
    const queryString = new URLSearchParams();
    Object.entries(queryParams).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        queryString.append(key, String(value));
      }
    });
    
    const separator = url.includes('?') ? '&' : '?';
    url = `${url}${separator}${queryString.toString()}`;
  }
  
  return url;
}
