import dotenv from "dotenv";
import path from "path";

// Load environment variables from .env file in the 'api' directory
// __dirname will be 'api/dist' after compilation, so go up one level for 'api/.env'
// If running with ts-node, __dirname might be 'api/src'.
// A more robust way is to specify the path directly if needed or ensure CWD is 'api/'.
// For now, assuming .env is in the same directory as package.json for the API (i.e., 'api/.env')
// when the script is run. `ts-node` usually respects this.
// `nodemon` from root also needs to be configured for CWD or .env path.
// The `dev` script in `api/package.json` is `nodemon src/index.ts`, so CWD should be `api/`.
dotenv.config(); // This will load from `api/.env` if CWD is `api/`

import express, { Request, Response } from "express";
import cors from "cors";
import reportRoutes from "./routes/reportRoutes"; // Import report routes
import userRoutes from "./routes/userRoutes"; // Import user routes
// import prisma from './lib/prisma'; // Prisma is used within routes

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// Test route
app.get("/api", (req: Request, res: Response) => {
  res.send("Water Report API is running!");
});

app.use((req, res, next) => { console.log(`API Request Log: ${req.method} ${req.originalUrl}`); next(); });
// Mount report routes
app.use("/api/reports", reportRoutes);
// Mount user routes
app.use("/api/users", userRoutes);

// Global error handler (very basic)
app.use((err: Error, req: Request, res: Response, next: Function) => {
  console.error(err.stack);
  res.status(500).send("Something broke!");
});

app.listen(PORT, () => {
  console.log(`API Server is running on http://localhost:${PORT}`);
});

export default app;
