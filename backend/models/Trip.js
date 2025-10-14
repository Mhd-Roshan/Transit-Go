import mongoose from 'mongoose';

const TripSchema = new mongoose.Schema({
  passenger: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'user',
    required: true,
  },
  origin: {
    type: String,
    required: true,
  },
  destination: {
    type: String,
    required: true,
  },
  fare: {
    type: Number,
    required: true,
  },
  tripDate: {
    type: Date,
    default: Date.now,
  },
});

const Trip = mongoose.model('Trip', TripSchema);
export default Trip;