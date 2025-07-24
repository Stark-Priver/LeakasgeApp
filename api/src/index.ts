import dotenv from "dotenv";
import express, { Request, Response } from "express";
import cors from "cors";
import connectToDatabase from "./lib/mongodb";
import reportRoutes from "./routes/reportRoutes";
import userRoutes from "./routes/userRoutes";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json({ limit: '50mb' })); // Increased limit for base64 images
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Initialize MongoDB connection
connectToDatabase()
  .then(() => {
    console.log('Database connected successfully');
  })
  .catch((error) => {
    console.error('Database connection failed:', error);
    process.exit(1);
  });

// Request logging middleware
app.use((req, res, next) => {
  console.log(`API Request Log: ${req.method} ${req.originalUrl}`);
  next();
});

// Test route
app.get("/api", (req: Request, res: Response) => {
  res.json({ 
    message: "Water Report API is running with MongoDB!",
    timestamp: new Date().toISOString()
  });
});

// Mount routes
app.use("/api/users", userRoutes);
app.use("/api/reports", reportRoutes);

// 404 handler - using a more standard approach
app.use((req: Request, res: Response) => {
  res.status(404).json({ error: "Route not found" });
});

// Global error handler
app.use((err: Error, req: Request, res: Response, next: Function) => {
  console.error(err.stack);
  res.status(500).json({ error: "Something broke!" });
});

app.listen(PORT, () => {
  console.log(`API Server is running on http://localhost:${PORT}`);
});

export default app;
