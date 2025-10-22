import mongoose from 'mongoose';

const TripSchema = new mongoose.Schema({
  passenger: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'user',
    required: true,
  },
  // --- NEW: Link to the vehicle used for the trip ---
  vehicle: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Vehicle',
    required: true,
  },
  origin: {
    type: String,
    required: true, 
  },
  destination: {
    type: String,
    // Destination is not required until the trip ends
  },
  amountPaid: {
    type: Number,
    default: 0,
  },
  calculatedFare: {
    type: Number,
    default: 0,
  },
  // --- NEW: Status to track the trip's state ---
  status: {
    type: String,
    enum: ['Ongoing', 'Completed', 'Incomplete'],
    default: 'Ongoing',
  },
  tripDate: {
    type: Date,
    default: Date.now,
  },
});

const Trip = mongoose.model('Trip', TripSchema);
export default Trip;