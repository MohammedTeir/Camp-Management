import { z } from 'zod';
import { insertChildSchema, insertPregnantWomanSchema, insertUserSchema, insertCampSchema, children, pregnantWomen, camps, users } from './schema';

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
      responses: {
        200: z.custom<typeof children.$inferSelect>(),
        404: errorSchemas.notFound,
      },
    },
    delete: {
      method: 'DELETE' as const,
      path: '/api/children/:id' as const,
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
      responses: {
        200: z.custom<typeof pregnantWomen.$inferSelect>(),
        404: errorSchemas.notFound,
      },
    },
    delete: {
      method: 'DELETE' as const,
      path: '/api/pregnant-women/:id' as const,
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
          totalMothers: z.number(), // Breastfeeding
          totalPregnant: z.number(),
          totalCamps: z.number(),
        }),
      },
    }
  }
};

export function buildUrl(path: string, params?: Record<string, string | number>): string {
  let url = path;
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (url.includes(`:${key}`)) {
        url = url.replace(`:${key}`, String(value));
      }
    });
  }
  return url;
}
