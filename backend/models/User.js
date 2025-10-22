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
  walletBalance: {
    type: Number,
    required: true,
    default: 0,
  },
  // --- NEW: Reference to an ongoing trip ---
  activeTrip: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Trip',
    default: null,
  },
  date: {
    type: Date,
    default: Date.now,
  },
}, { timestamps: true });

const User = mongoose.model('user', UserSchema);
export default User;