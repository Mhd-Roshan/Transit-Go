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
import paymentRoutes from './routes/payment.js';
import transactionRoutes from './routes/transactions.js'; 

dotenv.config();
const app = express();

app.use(cors());
app.use(express.json());

// Connect MongoDB with retry and sensible options
mongoose.set('strictQuery', false);
const mongooseOpts = {
	useNewUrlParser: true,
	useUnifiedTopology: true,
	// Short server selection so failures show up quickly in logs; will retry below
	serverSelectionTimeoutMS: 5000,
};

const connectWithRetry = (retries = 0) => {
	const maxRetries = 10;
	mongoose.connect(process.env.MONGO_URI, mongooseOpts)
		.then(() => {
			console.log('MongoDB Connected!');
		})
		.catch((err) => {
			console.error(`MongoDB connection error (attempt ${retries + 1}):`, err && err.message ? err.message : err);
			if (retries < maxRetries) {
				const backoff = Math.min(30000, 1000 * Math.pow(2, retries));
				console.log(`Retrying MongoDB connection in ${backoff / 1000}s...`);
				setTimeout(() => connectWithRetry(retries + 1), backoff);
			} else {
				console.error('Exceeded max MongoDB connection retries. Exiting process.');
				process.exit(1);
			}
		});
};

connectWithRetry();

mongoose.connection.on('disconnected', () => {
	console.warn('MongoDB disconnected. Attempting reconnect...');
});
mongoose.connection.on('reconnected', () => {
	console.log('MongoDB reconnected.');
});

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
app.use("/api/payments", paymentRoutes);
app.use("/api/transactions", transactionRoutes);



app.listen(5000, () => console.log(`Server running on port 5000`));