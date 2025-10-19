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
    // --- THIS IS THE FIX ---
    // Changed 'Working' to 'Active' to match the frontend and your request.
    enum: ['Active', 'Under Maintenance', 'Inactive'], 
    default: 'Active', // A new vehicle defaults to 'Active'
  },
}, { 
  timestamps: true 
});

const Vehicle = mongoose.model('Vehicle', VehicleSchema);
export default Vehicle;