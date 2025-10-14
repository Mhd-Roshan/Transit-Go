import mongoose from 'mongoose';

const AssignmentSchema = new mongoose.Schema({
  operator: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'user',
    required: true,
    unique: true,
  },
  vehicle: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Vehicle',
    required: true,
  },
  fare: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Fare',
    // required: true, // <<< REMOVE OR COMMENT OUT THIS LINE
  },
  assignmentDate: {
    type: Date,
    default: Date.now,
  },
});

const Assignment = mongoose.model('Assignment', AssignmentSchema);
export default Assignment;