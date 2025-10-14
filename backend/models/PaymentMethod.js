import mongoose from 'mongoose';

const PaymentMethodSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'user',
    required: true,
  },
  // In a real app, this would be a secure ID from a payment gateway like Stripe (e.g., 'pm_123abc')
  gatewayId: {
    type: String,
    required: true,
  },
  cardType: {
    type: String, // e.g., 'Visa', 'Mastercard'
    required: true,
  },
  last4: {
    type: String, // e.g., '4242'
    required: true,
  },
}, { timestamps: true });

const PaymentMethod = mongoose.model('PaymentMethod', PaymentMethodSchema);
export default PaymentMethod;