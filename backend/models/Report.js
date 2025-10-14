import mongoose from 'mongoose';

const ReportSchema = new mongoose.Schema({
  passenger: { /* ... */ },
  // CHANGE THIS FIELD
  vehicle: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Vehicle', // Links to the Vehicle model
    required: true,
  },
  timeOfIncident: { type: String, required: true },
  description: { type: String, required: true },
  // ... other fields
}, { timestamps: true });

const Report = mongoose.model('Report', ReportSchema);
export default Report;
