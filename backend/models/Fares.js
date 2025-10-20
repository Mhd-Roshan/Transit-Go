import mongoose from 'mongoose';

// A sub-schema for individual stops within a route
const StopSchema = new mongoose.Schema({
  stopName: {
    type: String,
    required: true,
    trim: true,
  },
  fareFromStart: {
    type: Number,
    required: true,
  },
}, { _id: false }); // _id is not needed for sub-documents in this case

const RouteSchema = new mongoose.Schema({
  routeName: {
    type: String,
    required: true,
    trim: true,
  },
  startPoint: {
    type: String,
    required: true,
    trim: true,
  },
  endPoint: {
    type: String,
    required: true,
    trim: true,
  },
  // --- THIS IS THE FIX ---
  // A route now contains a list of stops with individual fares
  stops: [StopSchema],
  creationDate: {
    type: Date,
    default: Date.now,
  },
});

// Renaming the model to 'Route' for clarity
const Route = mongoose.model('Route', RouteSchema);

export default Route;