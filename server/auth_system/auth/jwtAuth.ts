import type { Express, Request, Response, RequestHandler } from "express";
import { authStorage } from "./storage";
import { generateAccessToken, generateRefreshToken, verifyAccessToken, verifyRefreshToken } from "../../utils/jwt";
import { User } from "@shared/models/auth";

// Extend the Express Request type to include user property
declare global {
  namespace Express {
    interface Request {
      user?: User;
    }
  }
}

// JWT-based authentication middleware
export const isAuthenticated: RequestHandler = async (req, res, next) => {
  // Check for authorization header
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: "Access token required" });
  }

  const token = authHeader.substring(7); // Remove 'Bearer ' prefix
  const decoded = verifyAccessToken(token);

  if (!decoded) {
    return res.status(401).json({ message: "Invalid access token" });
  }

  // Attach user to request
  const user = await authStorage.getUser(decoded.sub);
  if (!user) {
    return res.status(401).json({ message: "User not found" });
  }

  req.user = user;
  next();
};

// Setup authentication - no session setup needed for JWT
export async function setupAuth(app: Express) {
  // JWT doesn't require session setup, so this is a no-op
  console.log("JWT authentication initialized");
}

// Register JWT-specific routes (like refresh)
export function registerJwtRoutes(app: Express): void {
  // Token refresh route
  app.post("/api/refresh", async (req, res) => {
    try {
      const { refreshToken } = req.body;

      if (!refreshToken) {
        return res.status(401).json({ message: "Refresh token required" });
      }

      const decoded = verifyRefreshToken(refreshToken);
      if (!decoded) {
        return res.status(401).json({ message: "Invalid refresh token" });
      }

      // Check if user still exists
      const user = await authStorage.getUser(decoded.sub);
      if (!user) {
        return res.status(401).json({ message: "User not found" });
      }

      // Generate new tokens
      const newAccessToken = generateAccessToken({
        sub: user.id,
        username: user.username,
        role: user.role
      });

      const newRefreshToken = generateRefreshToken({
        sub: user.id,
        username: user.username,
        role: user.role
      });

      res.json({
        user,
        accessToken: newAccessToken,
        refreshToken: newRefreshToken
      });
    } catch (error) {
      console.error("Token refresh error:", error);
      res.status(500).json({ message: "Token refresh failed" });
    }
  });
}