"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const dotenv_1 = __importDefault(require("dotenv"));
// Load environment variables from .env file in the 'api' directory
// __dirname will be 'api/dist' after compilation, so go up one level for 'api/.env'
// If running with ts-node, __dirname might be 'api/src'.
// A more robust way is to specify the path directly if needed or ensure CWD is 'api/'.
// For now, assuming .env is in the same directory as package.json for the API (i.e., 'api/.env')
// when the script is run. `ts-node` usually respects this.
// `nodemon` from root also needs to be configured for CWD or .env path.
// The `dev` script in `api/package.json` is `nodemon src/index.ts`, so CWD should be `api/`.
dotenv_1.default.config(); // This will load from `api/.env` if CWD is `api/`
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const reportRoutes_1 = __importDefault(require("./routes/reportRoutes")); // Import report routes
const userRoutes_1 = __importDefault(require("./routes/userRoutes")); // Import user routes
// import prisma from './lib/prisma'; // Prisma is used within routes
const app = (0, express_1.default)();
const PORT = process.env.PORT || 3001;
app.use((0, cors_1.default)());
app.use(express_1.default.json());
// Test route
app.get("/api", (req, res) => {
    res.send("Water Report API is running!");
});
app.use((req, res, next) => { console.log(`API Request Log: ${req.method} ${req.originalUrl}`); next(); });
// Mount report routes
app.use("/api/reports", reportRoutes_1.default);
// Mount user routes
app.use("/api/users", userRoutes_1.default);
// Global error handler (very basic)
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).send("Something broke!");
});
app.listen(PORT, () => {
    console.log(`API Server is running on http://localhost:${PORT}`);
});
exports.default = app;
//# sourceMappingURL=index.js.map