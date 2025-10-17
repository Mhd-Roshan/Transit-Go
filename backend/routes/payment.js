import express from 'express';
import authMiddleware from '../middleware/authMiddleware.js';
import User from '../models/User.js'; // Import the REAL User model
import Transaction from '../models/Transaction.js'; // Import the REAL Transaction model

const router = express.Router();

// The entire in-memory simulation has been REMOVED.

// @route   GET api/payments/balance
// @desc    Get the current user's wallet balance from the database
router.get('/balance', authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('walletBalance'); // More efficient
    if (!user) {
      return res.status(404).json({ msg: 'User not found' });
    }
    res.json({ balance: user.walletBalance });
  } catch (err) {
    console.error('Error fetching balance:', err.message);
    res.status(500).send('Server Error');
  }
});

// @route   POST api/payments/charge
// @desc    Charge the user for a trip by deducting from their database wallet balance
router.post('/charge', authMiddleware, async (req, res) => {
  const { amount, description } = req.body;
  const numericAmount = parseFloat(amount);

  if (isNaN(numericAmount) || numericAmount <= 0) {
    return res.status(400).json({ msg: 'A valid, positive amount is required.' });
  }
  
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ msg: 'User not found' });
    }
    
    if (user.walletBalance < numericAmount) {
      return res.status(400).json({ msg: 'Insufficient balance. Please top-up your wallet.' });
    }

    // Update user's balance in the database
    user.walletBalance -= numericAmount;
    await user.save();

    // Create a new permanent transaction record
    const newTransaction = new Transaction({
      user: req.user.id,
      amount: -numericAmount, // Debits are negative
      description: description || 'Trip Payment',
      status: 'succeeded',
    });
    await newTransaction.save();

    res.json({ 
      success: true, 
      newBalance: user.walletBalance, 
      newTransaction,
      message: 'Payment successful!' 
    });
  } catch (err) {
    console.error('Error processing charge:', err.message);
    res.status(500).send('Server Error');
  }
});

// @route   POST api/payments/add-money
// @desc    Add money to the user's wallet balance in the database
router.post('/add-money', authMiddleware, async (req, res) => {
    const { amount } = req.body;
    const numericAmount = parseFloat(amount);

    if (isNaN(numericAmount) || numericAmount <= 0) {
        return res.status(400).json({ msg: 'A valid, positive amount is required to top-up.' });
    }

    try {
      const user = await User.findById(req.user.id);
      if (!user) {
        return res.status(404).json({ msg: 'User not found' });
      }

      // Update user's balance in the database
      user.walletBalance += numericAmount;
      await user.save();

      // Create a new permanent transaction record
      const newTransaction = new Transaction({
        user: req.user.id,
        amount: numericAmount, // Credits are positive
        description: 'Wallet Top-up',
        status: 'succeeded',
      });
      await newTransaction.save();

      res.json({
          success: true,
          newBalance: user.walletBalance,
          newTransaction,
          message: 'Money added to wallet successfully!'
      });
    } catch (err) {
      console.error('Error adding money:', err.message);
      res.status(500).send('Server Error');
    }
});


// @route   GET api/payments/transactions
// @desc    Get the user's transaction history from the database
router.get('/transactions', authMiddleware, async (req, res) => {
  try {
    const transactions = await Transaction.find({ user: req.user.id }).sort({ createdAt: -1 }).limit(20);
    res.json(transactions);
  } catch (err) {
    console.error('Error fetching transactions:', err.message);
    res.status(500).send('Server Error');
  }
});

// This route was part of the simulation and is no longer needed for basic wallet functionality.
// A real payment method implementation would require a service like Stripe or Razorpay.
// router.get('/methods', authMiddleware, (req, res) => { ... });

export default router;