import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import dotenv from "dotenv";

// Import all route handlers
import userRoutes from "./routes/users.js";
import authRoutes from "./routes/auth.js"; 
import vehicleRoutes from "./routes/vehicles.js";
import fareRoutes from './routes/fares.js'; 
import collectionsRoutes from './routes/collections.js';
import assignmentRoutes from './routes/assignments.js';
import dashboardRoutes from './routes/dashboard.js';
import tripRoutes from './routes/trips.js';
import reportRoutes from './routes/reports.js';
import paymentRoutes from './routes/payment.js';
import transactionRoutes from './routes/transactions.js'; 
import utilityRoutes from './routes/utility.js'; // Route for seeding data

// Load environment variables from .env file
dotenv.config();

// Initialize the Express app
const app = express();

// --- Middleware Setup ---
// Enable Cross-Origin Resource Sharing for all routes
app.use(cors());
// Enable the Express app to parse JSON formatted request bodies
app.use(express.json());

// --- MongoDB Connection Logic ---
// Set Mongoose to use a non-strict query schema
mongoose.set('strictQuery', false);

// Define connection options for Mongoose
const mongooseOpts = {
	useNewUrlParser: true,
	useUnifiedTopology: true,
	// Set a short timeout for server selection to quickly detect connection issues
	serverSelectionTimeoutMS: 5000,
};

// Function to connect to MongoDB with an exponential backoff retry mechanism
const connectWithRetry = (retries = 0) => {
	const maxRetries = 10;
	// Use the MONGO_URI from your .env file
	mongoose.connect(process.env.MONGO_URI, mongooseOpts)
		.then(() => {
			console.log('MongoDB Connected!');
		})
		.catch((err) => {
			console.error(`MongoDB connection error (attempt ${retries + 1}):`, err && err.message ? err.message : err);
			if (retries < maxRetries) {
				// Calculate backoff time, increasing with each retry
				const backoff = Math.min(30000, 1000 * Math.pow(2, retries));
				console.log(`Retrying MongoDB connection in ${backoff / 1000}s...`);
				setTimeout(() => connectWithRetry(retries + 1), backoff);
			} else {
				console.error('Exceeded max MongoDB connection retries. Exiting process.');
				process.exit(1); // Exit if connection fails after all retries
			}
		});
};

// Initial call to connect to the database
connectWithRetry();

// Mongoose connection event listeners for logging
mongoose.connection.on('disconnected', () => {
	console.warn('MongoDB disconnected. Attempting reconnect...');
});
mongoose.connection.on('reconnected', () => {
	console.log('MongoDB reconnected.');
});


// --- API Route Registration ---
// All API endpoints are prefixed with '/api'
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/vehicles", vehicleRoutes); 
app.use("/api/fares", fareRoutes);
app.use("/api/collections", collectionsRoutes);
app.use("/api/assignments", assignmentRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/trips", tripRoutes);
app.use("/api/reports", reportRoutes);
app.use("/api/payments", paymentRoutes);
app.use("/api/transactions", transactionRoutes);
app.use("/api/utility", utilityRoutes); // Register the utility route for seeding


// --- Server Initialization ---
// Define the port from environment variables
const PORT = 5000;
// Start the Express server
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));