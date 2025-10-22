import mongoose from 'mongoose';

const VehicleSchema = new mongoose.Schema({
  vehicleId: {
    type: String,
    required: true,
    unique: true,
    trim: true,
  },
  model: {
    type: String,
    required: true,
    trim: true,
  },
  capacity: {
    type: Number,
    required: true,
  },
  source: {
    type: String,
    trim: true,
    default: 'Not Set',
  },
  destination: {
    type: String,
    trim: true,
    default: 'Not Set',
  },
  registrationDate: {
    type: Date,
    required: true,
  },
  status: {
    type: String,
    required: true,
    // --- THIS IS THE FIX: Added 'On Route' status ---
    enum: ['Active', 'On Route', 'Under Maintenance', 'Inactive'], 
    default: 'Active',
  },
  // --- THIS IS THE FIX: Added field to track live location ---
  currentLocation: {
    type: String,
    default: null,
  },
}, { 
  timestamps: true 
});

const Vehicle = mongoose.model('Vehicle', VehicleSchema);
export default Vehicle;