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
// GET user count (protected)
router.get("/count", auth_1.authenticateToken, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    // Optional: Add role check here if only admins should access user count
    // For example: if (req.user?.role !== 'ADMIN') {
    //   res.status(403).json({ error: "Forbidden: You do not have permission to access this resource." });
    //   return;
    // }
    try {
        const userCount = yield prisma_1.default.user.count();
        res.json({ count: userCount });
        return;
    }
    catch (error) {
        console.error("Failed to fetch user count:", error);
        res.status(500).json({ error: "Failed to fetch user count" });
        return;
    }
}));
exports.default = router;
//# sourceMappingURL=userRoutes.js.map