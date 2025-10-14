import mongoose from 'mongoose';

const FareSchema = new mongoose.Schema({
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
  price: {
    type: Number,
    required: true,
  },
  creationDate: {
    type: Date,
    default: Date.now,
  },
});

const Fare = mongoose.model('Fare', FareSchema);
export default Fare;