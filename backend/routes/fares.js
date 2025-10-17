import express from 'express';
import Fare from '../models/Fares.js'; // Assumes Fare model exists and is correct
import authMiddleware from '../middleware/authMiddleware.js'; // Recommended to protect routes

const router = express.Router();

// @route   POST api/fares
// @desc    Create a new fare or route
// @access  Private (Admin)
router.post('/', authMiddleware, async (req, res) => {
  const { routeName, startPoint, endPoint, price } = req.body;

  // Basic validation
  if (!routeName || !startPoint || !endPoint || !price) {
    return res.status(400).json({ msg: 'Please enter all fields.' });
  }

  try {
    const newFare = new Fare({
      routeName,
      startPoint,
      endPoint,
      price,
    });

    const fare = await newFare.save();
    res.status(201).json(fare); // Respond with the newly created fare

  } catch (err) {
    console.error("Error creating fare:", err.message);
    res.status(500).send('Server Error');
  }
});

// @route   GET api/fares
// @desc    Get all fares
// @access  Private (Authenticated Users)
router.get('/', authMiddleware, async (req, res) => {
  try {
    // Find all fares and sort them by the creation date in descending order (newest first)
    const fares = await Fare.find().sort({ creationDate: -1 });
    res.json(fares);
  } catch (err) {
    console.error("Error fetching fares:", err.message);
    res.status(500).send('Server Error');
  }
});

// @route   DELETE api/fares/:id
// @desc    Delete a fare by its ID
// @access  Private (Admin)
router.delete('/:id', authMiddleware, async (req, res) => {
    try {
        const fare = await Fare.findById(req.params.id);

        // Check if the fare exists
        if (!fare) {
            return res.status(404).json({ msg: 'Fare not found' });
        }

        // Remove the fare from the database
        await Fare.findByIdAndDelete(req.params.id);

        res.json({ msg: 'Fare removed successfully' });

    } catch (err) {
        console.error("Error deleting fare:", err.message);
        // Check for invalid ID format (e.g., /api/fares/invalid-id)
        if (err.kind === 'ObjectId') {
            return res.status(404).json({ msg: 'Fare not found' });
        }
        res.status(500).send('Server Error');
    }
});

export default router;