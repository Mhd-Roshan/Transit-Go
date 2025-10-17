import express from 'express';
import authMiddleware from '../middleware/authMiddleware.js';
import Trip from '../models/Trip.js';
import Fare from '../models/Fares.js';

const router = express.Router();

// @route   POST api/trips
// @desc    Create a new trip record to save in history
router.post('/', authMiddleware, async (req, res) => {
  const { origin, destination, fare } = req.body;
  if (!destination || !fare) {
    return res.status(400).json({ msg: 'Destination and fare are required.' });
  }
  try {
    const newTrip = new Trip({
      passenger: req.user.id,
      origin: origin || 'Scanned Location',
      destination,
      fare,
    });
    const trip = await newTrip.save();
    res.status(201).json(trip);
  } catch (err) {
    console.error('Error creating trip record:', err.message);
    res.status(500).send('Server Error');
  }
});

// @route   POST api/trips/calculate-fare
// @desc    Calculate fare based on destination
router.post('/calculate-fare', authMiddleware, async (req, res) => {
  const { destination } = req.body;
  try {
    const potentialFare = await Fare.findOne({ endPoint: { $regex: new RegExp(destination, "i") } });
    if (potentialFare) {
      res.json({ amount: potentialFare.price });
    } else {
      res.json({ amount: 150 }); 
    }
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   GET api/trips/my-trips
// @desc    Get all recent trips for the logged-in passenger
// @access  Private
router.get('/my-trips', authMiddleware, async (req, res) => {
  try {
    // A simple, reliable query to get the user's trips, newest first.
    const trips = await Trip.find({ passenger: req.user.id })
      .sort({ tripDate: -1 });

    // --- FIX: All debugging code has been removed ---
    // The response is sent immediately and cleanly.
    res.json(trips);

  } catch (err) {
    console.error('Error fetching my-trips:', err.message);
    res.status(500).send('Server Error');
  }
});

export default router;