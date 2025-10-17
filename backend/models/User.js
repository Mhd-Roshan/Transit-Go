import mongoose from 'mongoose';

const UserSchema = new mongoose.Schema({
  fullName: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
  },
  phoneNumber: {
    type: String,
    required: true,
    unique: true,
  },
  password: {
    type: String,
    required: true,
  },
  role: {
    type: String,
    enum: ['Passenger', 'Operator','Admin'],
    default: 'Passenger',
  },
  status: {
    type: String,
    enum: ['Pending', 'Approved'],
    default: 'Approved', // Passengers are approved by default
  },
  // --- THIS IS THE REQUIRED UPDATE ---
  walletBalance: {
    type: Number,
    required: true,
    default: 0, // All new users will start with a wallet balance of 0
  },
  date: {
    type: Date,
    default: Date.now,
  },
}, { timestamps: true });

const User = mongoose.model('user', UserSchema);
export default User;