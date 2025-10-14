import express from 'express';
import authMiddleware from '../middleware/authMiddleware.js';
// We no longer need the Mongoose models because this is a simulation

const router = express.Router();

// --- SIMULATED IN-MEMORY "DATABASE" ---
// In a real-world application, this data would be stored in and retrieved from MongoDB.
// For this simulation, the data will reset every time the server restarts.

let userBalance = 1250.75; // Starting balance for the user

let paymentMethods = [
  { id: 'sim_1', type: 'Credit Card', details: 'Visa **** 4567', icon: 'credit_card', color: '#ff9800' },
  { id: 'sim_2', type: 'Debit Card', details: 'Mastercard **** 8901', icon: 'credit_card', color: '#1e88e5' },
];

let transactions = [
  // Some initial dummy data for transaction history
  { id: 'txn_123', amount: 50.00, description: 'Wallet Top-up', date: new Date(Date.now() - 86400000), status: 'Completed' },
  { id: 'txn_124', amount: 25.00, description: 'Trip to Downtown', date: new Date(Date.now() - 172800000), status: 'Completed' },
];
// ----------------------------------------------------

// @route   GET api/payments/balance
// @desc    Get the current user's wallet balance
router.get('/balance', authMiddleware, (req, res) => {
  // Simply return the current value of our simulated balance
  res.json({ balance: userBalance });
});

// @route   GET api/payments/methods
// @desc    Get all saved payment methods for the user
router.get('/methods', authMiddleware, (req, res) => {
  // Return the array of simulated payment methods
  res.json(paymentMethods);
});

// @route   POST api/payments/charge
// @desc    "Charge" the user for a trip by deducting from their wallet balance
router.post('/charge', authMiddleware, (req, res) => {
  const { amount, description } = req.body;

  // Basic validation
  if (!amount || amount <= 0) {
    return res.status(400).json({ msg: 'A valid amount is required.' });
  }
  
  // Check if the user has enough money in their wallet
  if (userBalance < amount) {
    return res.status(400).json({ msg: 'Insufficient balance. Please top-up your wallet.' });
  }

  // If sufficient, deduct the amount from the balance
  userBalance -= amount;

  // Create a new transaction record for the history
  const newTransaction = {
    id: `txn_${Date.now()}`,
    amount,
    description: description || 'Trip Payment',
    date: new Date(),
    status: 'Completed'
  };
  // Add the new transaction to the beginning of the history array
  transactions.unshift(newTransaction);

  // Send a success response with the updated balance and the new transaction
  res.json({ 
    success: true, 
    newBalance: userBalance, 
    newTransaction,
    message: 'Payment successful!' 
  });
});

// @route   GET api/payments/transactions
// @desc    Get the user's transaction history
router.get('/transactions', authMiddleware, (req, res) => {
  // Return the array of simulated transactions
  res.json(transactions);
});

export default router;