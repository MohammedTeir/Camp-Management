// server/auth_system/auth/roleAuth.ts

import { Request, Response, NextFunction } from 'express';
import { User } from '@shared/models/auth'; // Assuming User type is defined here
import { api } from '@shared/routes';

export const hasRole = (requiredRole: User['role'] | User['role'][]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    // req.user is populated by isAuthenticated middleware
    const user = (req as any).user as User | undefined; // Cast req to any to access user

    if (!user) {
      // User is not authenticated, should ideally be caught by isAuthenticated first
      return res.status(401).json({ message: api.auth.login.responses[401].shape.message.catch('Unauthorized')._def.value });
    }

    const userRole = user.role;
    const requiredRoles = Array.isArray(requiredRole) ? requiredRole : [requiredRole];

    if (!requiredRoles.includes(userRole)) {
      return res.status(403).json({ message: api.errorSchemas.unauthorized.shape.message.catch('Forbidden')._def.value });
    }

    next();
  };
};
