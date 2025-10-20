import express from 'express';
import authMiddleware from '../middleware/authMiddleware.js';
import Trip from '../models/Trip.js';
import Route from '../models/Fares.js'; // Use the upgraded Route model

const router = express.Router();

// @route   POST api/trips
// @desc    Create a new trip record to save in history
router.post('/', authMiddleware, async (req, res) => {
  const { origin, destination, amountPaid, calculatedFare } = req.body;
  if (!destination || amountPaid === undefined || calculatedFare === undefined) {
    return res.status(400).json({ msg: 'Destination, amountPaid, and calculatedFare are required.' });
  }
  try {
    const newTrip = new Trip({
      passenger: req.user.id,
      origin: origin || 'Scanned Location',
      destination,
      amountPaid,
      calculatedFare,
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
    // --- THIS IS THE FIX: A much more reliable query ---
    // 1. Find a route where the 'stops' array contains the requested destination.
    const route = await Route.findOne({
      'stops.stopName': { $regex: new RegExp(`^${destination}$`, "i") }
    });

    if (route) {
      // 2. If a route is found, find the specific stop within that route to get the fare.
      const targetStop = route.stops.find(
        stop => stop.stopName.toLowerCase() === destination.toLowerCase()
      );

      if (targetStop) {
        // 3. Return the correct fare for that stop.
        return res.json({ amount: targetStop.fareFromStart });
      }
    }
    
    // 4. If no route or specific stop is found, then fall back to the default.
    res.json({ amount: 150 }); 

  } catch (err) {
    console.error("Error in fare calculation:", err.message);
    res.status(500).send('Server Error');
  }
});

// @route   GET api/trips/my-trips
// @desc    Get all recent trips for the logged-in passenger
// @access  Private
router.get('/my-trips', authMiddleware, async (req, res) => {
  try {
    const trips = await Trip.find({ passenger: req.user.id })
      .sort({ tripDate: -1 });

    res.json(trips);

  } catch (err) {
    console.error('Error fetching my-trips:', err.message);
    res.status(500).send('Server Error');
  }
});

export default router;