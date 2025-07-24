import { Router, Request, Response } from 'express';
import { WaterReport, User, IssueType, Severity, ReportStatus } from '../models';
import { authenticateToken, requireAdmin } from '../middleware/auth';

const router = Router();

interface AuthRequest extends Request {
  user?: any;
}

// GET /reports - Get all reports (Admin only) or user's own reports
router.get('/', authenticateToken, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    let reports;
    
    if (req.user.role === 'ADMIN') {
      // Admin can see all reports
      reports = await WaterReport.find()
        .populate('user_id', 'email full_name is_banned')
        .sort({ createdAt: -1 });
    } else {
      // Regular users can only see their own reports
      reports = await WaterReport.find({ user_id: req.user._id })
        .populate('user_id', 'email full_name is_banned')
        .sort({ createdAt: -1 });
    }

    res.json(reports);
  } catch (error) {
    console.error('Failed to fetch reports:', error);
    res.status(500).json({ error: 'Failed to fetch water reports' });
  }
});

// GET /reports/user-reports - Get reports for authenticated user
router.get('/user-reports', authenticateToken, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const reports = await WaterReport.find({ user_id: req.user._id })
      .populate('user_id', 'email full_name')
      .sort({ createdAt: -1 });

    res.json(reports);
  } catch (error) {
    console.error('Failed to fetch user reports:', error);
    res.status(500).json({ error: 'Failed to fetch user reports' });
  }
});

// GET /reports/stats/overview - Get report statistics (Admin only)
router.get('/stats/overview', authenticateToken, requireAdmin, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const totalReports = await WaterReport.countDocuments();
    
    const statusCounts = await WaterReport.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);

    const severityCounts = await WaterReport.aggregate([
      {
        $group: {
          _id: '$severity',
          count: { $sum: 1 }
        }
      }
    ]);

    const issueTypeCounts = await WaterReport.aggregate([
      {
        $group: {
          _id: '$issue_type',
          count: { $sum: 1 }
        }
      }
    ]);

    const recentReports = await WaterReport.find()
      .populate('user_id', 'email full_name')
      .sort({ createdAt: -1 })
      .limit(10);

    res.json({
      totalReports,
      statusCounts,
      severityCounts,
      issueTypeCounts,
      recentReports
    });
  } catch (error) {
    console.error('Failed to fetch report statistics:', error);
    res.status(500).json({ error: 'Failed to fetch report statistics' });
  }
});

// GET /reports/:id - Get specific report
router.get('/:id', authenticateToken, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    
    // Validate ObjectId format
    if (!id || id === 'undefined' || !/^[0-9a-fA-F]{24}$/.test(id)) {
      res.status(400).json({ error: 'Invalid report ID format' });
      return;
    }
    
    const report = await WaterReport.findById(id)
      .populate('user_id', 'email full_name is_banned');

    if (!report) {
      res.status(404).json({ error: 'Report not found' });
      return;
    }

    // Check if user can access this report
    if (req.user.role !== 'ADMIN' && report.user_id._id.toString() !== req.user._id.toString()) {
      res.status(403).json({ error: 'Access denied' });
      return;
    }

    res.json(report);
  } catch (error) {
    console.error('Failed to fetch report:', error);
    res.status(500).json({ error: 'Failed to fetch report' });
  }
});

// POST /reports - Create new report
router.post('/', authenticateToken, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const {
      issue_type,
      severity,
      description,
      location_address,
      latitude,
      longitude,
      image_base64_data
    } = req.body;

    // Validation
    if (!issue_type || !severity || !description) {
      res.status(400).json({ 
        error: 'Issue type, severity, and description are required' 
      });
      return;
    }

    if (!Object.values(IssueType).includes(issue_type)) {
      res.status(400).json({ error: 'Invalid issue type' });
      return;
    }

    if (!Object.values(Severity).includes(severity)) {
      res.status(400).json({ error: 'Invalid severity level' });
      return;
    }

    const report = new WaterReport({
      user_id: req.user._id,
      issue_type,
      severity,
      description,
      location_address,
      latitude,
      longitude,
      image_base64_data: image_base64_data || [],
      status: ReportStatus.PENDING
    });

    await report.save();
    
    // Populate user data for response
    await report.populate('user_id', 'email full_name');

    res.status(201).json({
      message: 'Report created successfully',
      report
    });
  } catch (error) {
    console.error('Failed to create report:', error);
    res.status(500).json({ error: 'Failed to create report' });
  }
});

// PUT /reports/:id - Update report (Admin only)
router.put('/:id', authenticateToken, requireAdmin, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    
    // Validate ObjectId format
    if (!id || id === 'undefined' || !/^[0-9a-fA-F]{24}$/.test(id)) {
      res.status(400).json({ error: 'Invalid report ID format' });
      return;
    }
    
    const { status, assigned_to } = req.body;

    const updateData: any = {};
    
    if (status && Object.values(ReportStatus).includes(status)) {
      updateData.status = status;
    }
    
    if (assigned_to !== undefined) {
      updateData.assigned_to = assigned_to;
    }

    const report = await WaterReport.findByIdAndUpdate(
      id,
      updateData,
      { new: true }
    ).populate('user_id', 'email full_name is_banned');

    if (!report) {
      res.status(404).json({ error: 'Report not found' });
      return;
    }

    res.json({
      message: 'Report updated successfully',
      report
    });
  } catch (error) {
    console.error('Failed to update report:', error);
    res.status(500).json({ error: 'Failed to update report' });
  }
});

// DELETE /reports/:id - Delete report (Admin only)
router.delete('/:id', authenticateToken, requireAdmin, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    // Validate ObjectId format
    if (!id || id === 'undefined' || !/^[0-9a-fA-F]{24}$/.test(id)) {
      res.status(400).json({ error: 'Invalid report ID format' });
      return;
    }

    const report = await WaterReport.findByIdAndDelete(id);

    if (!report) {
      res.status(404).json({ error: 'Report not found' });
      return;
    }

    res.json({ message: 'Report deleted successfully' });
  } catch (error) {
    console.error('Failed to delete report:', error);
    res.status(500).json({ error: 'Failed to delete report' });
  }
});

export default router;
