import type { Express } from "express";
import { authStorage } from "./storage";
import { isAuthenticated } from "./jwtAuth";
import { generateAccessToken, generateRefreshToken } from "../../utils/jwt";

// Register auth-specific routes
export function registerAuthRoutes(app: Express): void {
  // Get current authenticated user (matches the client expectation)
  app.get("/api/user", isAuthenticated, async (req: any, res) => {
    try {
      // With JWT, the user is already attached to req.user by the middleware
      res.json(req.user);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });
  
  // Login route - authenticates with username/password and returns JWT tokens
  app.post("/api/auth/login", async (req, res) => {
    try {
      const { username, password } = req.body;

      if (!username || !password) {
        return res.status(400).json({ message: "Username and password required" });
      }

      // Authenticate user with username and password
      const user = await authStorage.authenticateUser(username, password);
      
      if (!user) {
        return res.status(401).json({ message: "Invalid username or password" });
      }

      // Generate JWT tokens
      const accessToken = generateAccessToken({
        sub: user.id,
        username: user.username,
        role: user.role
      });

      const refreshToken = generateRefreshToken({
        sub: user.id,
        username: user.username,
        role: user.role
      });

      // Return user data along with tokens
      res.json({
        ...user,
        accessToken,
        refreshToken
      });
    } catch (error) {
      console.error("Login error:", error);
      res.status(500).json({ message: "Login failed" });
    }
  });

  // Logout route
  app.post("/api/auth/logout", (req, res) => {
    // For JWT, logout is typically client-side (clearing tokens)
    res.json({ message: "Logged out successfully" });
  });
}
