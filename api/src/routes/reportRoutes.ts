import { Router, Response } from "express";
import prisma from "../lib/prisma";
import { ReportStatus } from "../../prisma/generated/client"; // Import ReportStatus
import { authenticateToken, AuthenticatedRequest } from "../middleware/auth";
import { sendEmail } from "../lib/email";
import { getReportStatusUpdateTemplate } from "../templates/reportStatusUpdate";

const router = Router();

// GET all water reports (protected)
router.get(
  "/",
  authenticateToken,
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      // Example: Fetch reports, potentially filtering by user or role in a real app
      // For now, fetching all. Access control logic can be added based on req.user
      const reports = await prisma.waterReport.findMany({
        include: {
          user: {
            // Include user details (email, full_name)
            select: {
              email: true,
              full_name: true,
            },
          },
        },
        orderBy: {
          createdAt: "desc",
        },
      });
      res.json(reports);
      return;
    } catch (error) {
      console.error("Failed to fetch reports:", error);
      res.status(500).json({ error: "Failed to fetch water reports" });
      return;
    }
  }
);
// GET reports for the authenticated user (protected)
router.get(
  "/user-reports", // New dedicated endpoint
  authenticateToken,
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    const userId = req.user?.id;
    if (!userId) {
      res.status(403).json({ error: "User ID not found in token." });
      return;
    }

    try {
      const reports = await prisma.waterReport.findMany({
        where: { user_id: userId },
        include: {
          user: {
            // Still include user details, though it'll be the same user
            select: {
              email: true,
              full_name: true,
            },
          },
        },
        orderBy: {
          createdAt: "desc",
        },
      });
      // Transform the data to match frontend expectations
      const transformedReports = reports.map((report) => ({
        ...report,
        created_at: report.createdAt, // Map createdAt to created_at
        updated_at: report.updatedAt, // Map updatedAt to updated_at if needed
      }));

      res.json(transformedReports);
      return;
    } catch (error) {
      console.error("Failed to fetch user-specific reports:", error);
      res.status(500).json({ error: "Failed to fetch your water reports" });
      return;
    }
  }
);
// GET a single water report by ID (protected)
router.get(
  "/:id",
  authenticateToken,
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    const { id } = req.params;
    try {
      const report = await prisma.waterReport.findUnique({
        where: { id: String(id) },
        include: {
          user: {
            select: {
              email: true,
              full_name: true,
            },
          },
        },
      });
      if (!report) {
        res.status(404).json({ error: "Report not found" });
        return;
      }
      res.json(report);
      return;
    } catch (error) {
      console.error(`Failed to fetch report ${id}:`, error);
      res.status(500).json({ error: `Failed to fetch report ${id}` });
      return;
    }
  }
);

// POST a new water report (protected)
// This is a basic example. Needs validation and more robust error handling.
router.post(
  "/",
  authenticateToken,
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    const {
      issue_type,
      severity,
      description,
      location_address,
      latitude,
      longitude,
      image_base64_data = [], // Expecting Base64 data array
    } = req.body;

    // Basic validation
    if (!issue_type || !severity || !description) {
      res.status(400).json({
        error: "Missing required fields: issue_type, severity, description",
      });
      return;
    }

    const userId = req.user?.id; // Get user ID from authenticated user

    if (!userId) {
      res.status(403).json({ error: "User ID not found in token." });
      return;
    }

    // console.log("Attempting to create report for userId:", userId, "with image_base64_data length:", image_base64_data?.length);
    try {
      const newReport = await prisma.waterReport.create({
        data: {
          user_id: userId,
          issue_type,
          severity,
          description,
          location_address,
          latitude,
          longitude,
          image_base64_data, // Save the array of Base64 strings
          status: "PENDING", // Default status
        },
        include: {
          user: {
            select: {
              email: true,
              full_name: true,
            },
          },
        },
      });
      res.status(201).json(newReport);
      return;
    } catch (error: any) {
      console.error("Failed to create report:", error);
      // Check for specific Prisma errors if needed, e.g., P2002 for unique constraint
      if (error.code === "P2003") {
        // Foreign key constraint failed (e.g. user_id does not exist)
        res.status(400).json({ error: "Invalid user ID or related data." });
        return;
      }
      res.status(500).json({ error: "Failed to create water report" });
      return;
    }
  }
);

// PUT update report details (status, assigned_to) (protected)
router.put(
  "/:id",
  authenticateToken,
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    const { id } = req.params;
    const { status, assigned_to } = req.body;

    // Validation for status if provided
    if (
      status &&
      !["PENDING", "IN_PROGRESS", "RESOLVED"].includes(
        String(status).toUpperCase()
      )
    ) {
      res.status(400).json({
        error:
          "Invalid status provided. Must be PENDING, IN_PROGRESS, or RESOLVED.",
      });
      return;
    }

    const userId = req.user?.id; // User performing the update
    if (!userId) {
      res
        .status(403)
        .json({ error: "User ID not found in token. Update not permitted." });
      return;
    }

    // In a real app, further check if req.user.role is ADMIN or if the user is assigned.
    // For now, any authenticated user can update.

    const updateData: { status?: ReportStatus; assigned_to?: string | null } =
      {};

    if (status) {
      updateData.status = String(status).toUpperCase() as ReportStatus;
    }
    if (assigned_to !== undefined) {
      // Allow setting assigned_to to null or an empty string (which becomes null)
      updateData.assigned_to = assigned_to ? String(assigned_to) : null;
    }

    if (Object.keys(updateData).length === 0) {
      res.status(400).json({
        error: "No updateable fields provided (status, assigned_to).",
      });
      return;
    }

    try {
      const updatedReport = await prisma.waterReport.update({
        where: { id: String(id) },
        data: updateData,
        include: {
          user: {
            // Include user details (email, full_name)
            select: {
              email: true,
              full_name: true,
            },
          },
        },
      });

      if (updatedReport.status && updatedReport.user) {
        const { email, full_name } = updatedReport.user;
        const emailHtml = getReportStatusUpdateTemplate(
          full_name ?? "User",
          updatedReport.id,
          updatedReport.status
        );
        await sendEmail({
          to: email,
          subject: `Report ${updatedReport.id} Status Updated`,
          html: emailHtml,
        });
      }

      res.json(updatedReport);
      return;
    } catch (error: any) {
      console.error(`Failed to update report ${id}:`, error);
      if (error.code === "P2025") {
        // Record to update not found
        res.status(404).json({ error: "Report not found." });
        return;
      }
      res.status(500).json({ error: `Failed to update report ${id}` });
      return;
    }
  }
);

export default router;
