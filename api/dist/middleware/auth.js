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
Object.defineProperty(exports, "__esModule", { value: true });
exports.authenticateToken = void 0;
const supabase_js_1 = require("@supabase/supabase-js");
// These should be in your .env file for the API
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;
let supabase;
if (supabaseUrl && supabaseAnonKey) {
    supabase = (0, supabase_js_1.createClient)(supabaseUrl, supabaseAnonKey);
}
else {
    console.error("Supabase URL or Anon Key is missing. Ensure SUPABASE_URL and SUPABASE_ANON_KEY are in the .env file for the API.");
    // Optionally, throw an error or handle this case as critical
    // For now, operations requiring supabase will fail if not configured
}
const authenticateToken = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    if (!supabase) {
        // Ensure the function adheres to Promise<void> by not returning the res object directly,
        // although sending a response and not calling next() is a valid way to end middleware.
        // TypeScript requires the explicit type here for async middleware.
        res.status(500).json({ error: "Authentication service not configured." });
        return;
    }
    const authHeader = req.headers["authorization"];
    const token = authHeader && authHeader.split(" ")[1]; // Bearer TOKEN
    if (token == null) {
        res.status(401).json({ error: "No token provided." }); // Unauthorized
        return;
    }
    try {
        const { data: { user }, error, } = yield supabase.auth.getUser(token);
        if (error || !user) {
            console.error("Token validation error:", error === null || error === void 0 ? void 0 : error.message);
            res.status(403).json({ error: "Token is not valid or expired." }); // Forbidden
            return;
        }
        req.user = user; // Add user to request object
        next(); // Proceed to the next middleware or route handler
    }
    catch (err) {
        console.error("Catch block error during token validation:", err);
        res.status(403).json({ error: "Token validation failed." });
        return;
    }
});
exports.authenticateToken = authenticateToken;
//# sourceMappingURL=auth.js.map