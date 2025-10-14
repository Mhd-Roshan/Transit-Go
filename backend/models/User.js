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
  // --- NEW FIELD ADDED ---
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
  // Adding a status field for Operator approval
  status: {
    type: String,
    enum: ['Pending', 'Approved'],
    default: 'Approved', // Passengers are approved by default
  },
  date: {
    type: Date,
    default: Date.now,
  },
}, { timestamps: true });

const User = mongoose.model('user', UserSchema);
export default User;