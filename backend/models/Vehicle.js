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
  // --- NEW FIELDS ADDED HERE ---
  source: {
    type: String,
    trim: true,
    default: 'Not Set', // Default value if not provided
  },
  destination: {
    type: String,
    trim: true,
    default: 'Not Set', // Default value if not provided
  },
  registrationDate: {
    type: Date,
    default: Date.now,
  },
});

const Vehicle = mongoose.model('Vehicle', VehicleSchema);
export default Vehicle;