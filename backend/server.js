import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import dotenv from "dotenv";
import userRoutes from "./routes/users.js";
import authRoutes from "./routes/auth.js"; 
import vehicleRoutes from "./routes/vehicles.js";
import fareRoutes from './routes/fares.js'; 
import collectionsRoutes from './routes/collections.js';
import assignmentRoutes from './routes/assignments.js';
import dashboardRoutes from './routes/dashboard.js';
import tripRoutes from './routes/trips.js';
import reportRoutes from './routes/reports.js';


dotenv.config();
const app = express();

app.use(cors());
app.use(express.json());

// Connect MongoDB
mongoose.connect(process.env.MONGO_URI)
.then(() => console.log("MongoDB Connected!"))
.catch((err) => console.error("MongoDB connection error:", err));

// Use all the correct routes
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/vehicles", vehicleRoutes); 
app.use("/api/fares", fareRoutes);
app.use("/api/collections", collectionsRoutes);
app.use("/api/assignments", assignmentRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/trips", tripRoutes);
app.use("/api/reports", reportRoutes);


app.listen(5000, () => console.log(`Server running on port 5000`));