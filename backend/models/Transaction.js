import mongoose from 'mongoose';

const TransactionSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'user',
    required: true,
  },
  amount: {
    type: Number,
    required: true,
  },
  currency: {
    type: String,
    default: 'INR',
  },
  status: {
    type: String,
    enum: ['succeeded', 'pending', 'failed'],
    required: true,
  },
  description: {
    type: String, // e.g., "Payment for pending fine #FN20240721"
  },
  // --- THIS IS THE REQUIRED UPDATE ---
  trip: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Trip', // Creates a link to a specific Trip document
  },
  paymentMethod: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'PaymentMethod',
    required: false, // Make paymentMethod optional for cases like balance top-ups or internal transfers
  },
}, { timestamps: true });

const Transaction = mongoose.model('Transaction', TransactionSchema);
export default Transaction;