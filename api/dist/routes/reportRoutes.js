"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const prisma_1 = __importDefault(require("../lib/prisma"));
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
// GET all water reports (protected)
router.get("/", auth_1.authenticateToken, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        // Example: Fetch reports, potentially filtering by user or role in a real app
        // For now, fetching all. Access control logic can be added based on req.user
        const reports = yield prisma_1.default.waterReport.findMany({
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
    }
    catch (error) {
        console.error("Failed to fetch reports:", error);
        res.status(500).json({ error: "Failed to fetch water reports" });
        return;
    }
}));
// GET reports for the authenticated user (protected)
router.get("/user-reports", // New dedicated endpoint
auth_1.authenticateToken, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
    if (!userId) {
        res.status(403).json({ error: "User ID not found in token." });
        return;
    }
    try {
        const reports = yield prisma_1.default.waterReport.findMany({
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
        const transformedReports = reports.map((report) => (Object.assign(Object.assign({}, report), { created_at: report.createdAt, updated_at: report.updatedAt })));
        res.json(transformedReports);
        return;
    }
    catch (error) {
        console.error("Failed to fetch user-specific reports:", error);
        res.status(500).json({ error: "Failed to fetch your water reports" });
        return;
    }
}));
// GET a single water report by ID (protected)
router.get("/:id", auth_1.authenticateToken, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { id } = req.params;
    try {
        const report = yield prisma_1.default.waterReport.findUnique({
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
    }
    catch (error) {
        console.error(`Failed to fetch report ${id}:`, error);
        res.status(500).json({ error: `Failed to fetch report ${id}` });
        return;
    }
}));
// POST a new water report (protected)
// This is a basic example. Needs validation and more robust error handling.
router.post("/", auth_1.authenticateToken, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const { issue_type, severity, description, location_address, latitude, longitude, image_base64_data = [], // Expecting Base64 data array
     } = req.body;
    // Basic validation
    if (!issue_type || !severity || !description) {
        res.status(400).json({
            error: "Missing required fields: issue_type, severity, description",
        });
        return;
    }
    const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id; // Get user ID from authenticated user
    if (!userId) {
        res.status(403).json({ error: "User ID not found in token." });
        return;
    }
    // console.log("Attempting to create report for userId:", userId, "with image_base64_data length:", image_base64_data?.length);
    try {
        const newReport = yield prisma_1.default.waterReport.create({
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
    }
    catch (error) {
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
}));
// PUT update report details (status, assigned_to) (protected)
router.put("/:id", auth_1.authenticateToken, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const { id } = req.params;
    const { status, assigned_to } = req.body;
    // Validation for status if provided
    if (status &&
        !["PENDING", "IN_PROGRESS", "RESOLVED"].includes(String(status).toUpperCase())) {
        res.status(400).json({
            error: "Invalid status provided. Must be PENDING, IN_PROGRESS, or RESOLVED.",
        });
        return;
    }
    const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id; // User performing the update
    if (!userId) {
        res
            .status(403)
            .json({ error: "User ID not found in token. Update not permitted." });
        return;
    }
    // In a real app, further check if req.user.role is ADMIN or if the user is assigned.
    // For now, any authenticated user can update.
    const updateData = {};
    if (status) {
        updateData.status = String(status).toUpperCase();
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
        const updatedReport = yield prisma_1.default.waterReport.update({
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
        res.json(updatedReport);
        return;
    }
    catch (error) {
        console.error(`Failed to update report ${id}:`, error);
        if (error.code === "P2025") {
            // Record to update not found
            res.status(404).json({ error: "Report not found." });
            return;
        }
        res.status(500).json({ error: `Failed to update report ${id}` });
        return;
    }
}));
exports.default = router;
//# sourceMappingURL=reportRoutes.js.map