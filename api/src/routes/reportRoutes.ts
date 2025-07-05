import { Router, Response } from 'express';
import prisma from '../lib/prisma';
import { authenticateToken, AuthenticatedRequest } from '../middleware/auth';

const router = Router();

// GET all water reports (protected)
router.get('/', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    // Example: Fetch reports, potentially filtering by user or role in a real app
    // For now, fetching all. Access control logic can be added based on req.user
    const reports = await prisma.waterReport.findMany({
      include: {
        user: { // Include user details (email, full_name)
          select: {
            email: true,
            full_name: true,
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });
    res.json(reports);
  } catch (error) {
    console.error('Failed to fetch reports:', error);
    res.status(500).json({ error: 'Failed to fetch water reports' });
  }
});

// GET a single water report by ID (protected)
router.get('/:id', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  try {
    const report = await prisma.waterReport.findUnique({
      where: { id: String(id) },
      include: {
        user: {
          select: {
            email: true,
            full_name: true,
          }
        }
      }
    });
    if (!report) {
      return res.status(404).json({ error: 'Report not found' });
    }
    res.json(report);
  } catch (error) {
    console.error(`Failed to fetch report ${id}:`, error);
    res.status(500).json({ error: `Failed to fetch report ${id}` });
  }
});

// POST a new water report (protected)
// This is a basic example. Needs validation and more robust error handling.
router.post('/', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  const {
    issue_type,
    severity,
    description,
    location_address,
    latitude,
    longitude,
    image_urls = [], // Default to empty array if not provided
  } = req.body;

  // Basic validation
  if (!issue_type || !severity || !description) {
    return res.status(400).json({ error: 'Missing required fields: issue_type, severity, description' });
  }

  const userId = req.user?.id; // Get user ID from authenticated user

  if (!userId) {
    return res.status(403).json({ error: 'User ID not found in token.' });
  }

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
        image_urls,
        status: 'PENDING', // Default status
      },
      include: {
        user: {
          select: {
            email: true,
            full_name: true,
          }
        }
      }
    });
    res.status(201).json(newReport);
  } catch (error: any) {
    console.error('Failed to create report:', error);
    // Check for specific Prisma errors if needed, e.g., P2002 for unique constraint
    if (error.code === 'P2003') { // Foreign key constraint failed (e.g. user_id does not exist)
        return res.status(400).json({ error: 'Invalid user ID or related data.'})
    }
    res.status(500).json({ error: 'Failed to create water report' });
  }
});


// PUT update report details (status, assigned_to) (protected)
router.put('/:id', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const { status, assigned_to } = req.body;

  // Validation for status if provided
  if (status && !['PENDING', 'IN_PROGRESS', 'RESOLVED'].includes(String(status).toUpperCase())) {
    return res.status(400).json({ error: 'Invalid status provided. Must be PENDING, IN_PROGRESS, or RESOLVED.' });
  }

  const userId = req.user?.id; // User performing the update
  if (!userId) {
    return res.status(403).json({ error: 'User ID not found in token. Update not permitted.' });
  }

  // In a real app, further check if req.user.role is ADMIN or if the user is assigned.
  // For now, any authenticated user can update.

  const updateData: { status?: string; assigned_to?: string | null } = {};

  if (status) {
    updateData.status = String(status).toUpperCase();
  }
  if (assigned_to !== undefined) { // Allow setting assigned_to to null or an empty string (which becomes null)
    updateData.assigned_to = assigned_to ? String(assigned_to) : null;
  }

  if (Object.keys(updateData).length === 0) {
    return res.status(400).json({ error: 'No updateable fields provided (status, assigned_to).' });
  }

  try {
    const updatedReport = await prisma.waterReport.update({
      where: { id: String(id) },
      data: updateData,
      include: {
        user: { // Include user details (email, full_name)
          select: {
            email: true,
            full_name: true,
          }
        }
      }
    });
    res.json(updatedReport);
  } catch (error: any) {
    console.error(`Failed to update report ${id}:`, error);
    if (error.code === 'P2025') { // Record to update not found
      return res.status(404).json({ error: 'Report not found.' });
    }
    res.status(500).json({ error: `Failed to update report ${id}` });
  }
});

export default router;
