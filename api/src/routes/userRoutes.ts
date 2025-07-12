import { Router, Response } from "express";
import prisma from "../lib/prisma";
import { authenticateToken, AuthenticatedRequest } from "../middleware/auth";

const router = Router();

// GET user count (protected)
router.get(
  "/count",
  authenticateToken,
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    // Optional: Add role check here if only admins should access user count
    // For example: if (req.user?.role !== 'ADMIN') {
    //   res.status(403).json({ error: "Forbidden: You do not have permission to access this resource." });
    //   return;
    // }

    try {
      const userCount = await prisma.user.count();
      res.json({ count: userCount });
      return;
    } catch (error) {
      console.error("Failed to fetch user count:", error);
      res.status(500).json({ error: "Failed to fetch user count" });
      return;
    }
  }
);

export default router;
