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


// PUT update report status (protected)
router.put('/:id/status', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const { status } = req.body;

  // Basic validation
  if (!status || !['PENDING', 'IN_PROGRESS', 'RESOLVED'].includes(status.toUpperCase())) {
    return res.status(400).json({ error: 'Invalid status provided. Must be PENDING, IN_PROGRESS, or RESOLVED.' });
  }

  const userId = req.user?.id; // User performing the update (for logging or authorization if needed)
  if (!userId) {
    return res.status(403).json({ error: 'User ID not found in token.' });
  }

  // In a real app, you might want to check if the user has permission to update this report,
  // e.g., if they are an admin or assigned technician.

  try {
    const updatedReport = await prisma.waterReport.update({
      where: { id: String(id) }, // Ensure id is treated as string if necessary
      data: {
        status: status.toUpperCase(), // Ensure status is in uppercase as per enum
        // updated_at is handled automatically by @updatedAt directive in Prisma schema
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
    res.json(updatedReport);
  } catch (error: any) {
    console.error(`Failed to update status for report ${id}:`, error);
    if (error.code === 'P2025') { // Record to update not found
      return res.status(404).json({ error: 'Report not found.' });
    }
    res.status(500).json({ error: `Failed to update status for report ${id}` });
  }
});

export default router;
