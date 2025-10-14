import express from 'express';
import authMiddleware from '../middleware/authMiddleware.js';
import Trip from '../models/Trip.js';
import Fare from '../models/Fares.js';

const router = express.Router();

// @route   POST api/trips/calculate-fare
// @desc    Calculate fare based on destination
// @access  Private
router.post('/calculate-fare', authMiddleware, async (req, res) => {
  const { destination } = req.body;
  try {
    // This is a simplified fare calculation.
    const potentialFare = await Fare.findOne({ endPoint: { $regex: new RegExp(destination, "i") } });

    if (potentialFare) {
      res.json({ amount: potentialFare.price });
    } else {
      // Return a default fare if no exact match is found
      res.json({ amount: 150 }); 
    }
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   GET api/trips/my-trips
// @desc    Get recent trips for the logged-in passenger
// @access  Private
router.get('/my-trips', authMiddleware, async (req, res) => {
  try {
    const trips = await Trip.find({ passenger: req.user.id })
      .sort({ tripDate: -1 })
      .limit(5); // Get the 5 most recent trips
    res.json(trips);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

export default router;