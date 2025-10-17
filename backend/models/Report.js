import mongoose from 'mongoose';

const ReportSchema = new mongoose.Schema({
  passenger: { 
    type: mongoose.Schema.Types.ObjectId,
    ref: 'user',
    required: true,
  },
  vehicle: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Vehicle',
    required: true,
  },
  timeOfIncident: { type: Date, required: true },
  description: { type: String, required: true },
  status: {
    type: String,
    enum: ['Pending', 'Resolved'],
    default: 'Pending',
  },
  reply: {
    admin: { type: mongoose.Schema.Types.ObjectId, ref: 'user' },
    message: { type: String },
    date: { type: Date },
  }
}, { timestamps: true });

const Report = mongoose.model('Report', ReportSchema);
export default Report;