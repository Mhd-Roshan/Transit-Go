import express from 'express';
import Collection from '../models/Collection.js';
import Assignment from '../models/Assignment.js'; // Keep for the POST route
import authMiddleware from '../middleware/authMiddleware.js';

const router = express.Router();

// @route   GET api/collections
// @desc    Get all collections with optional filters for the admin page
// @access  Private (Admin)
router.get('/', authMiddleware, async (req, res) => {
  try {
    const { vehicleId, operatorId, startDate, endDate } = req.query;

    // Build a dynamic query object based on the filters provided in the request
    const query = {};

    if (vehicleId) {
      query.vehicle = vehicleId;
    }
    if (operatorId) {
      query.operator = operatorId;
    }

    // Handle the date range filtering
    if (startDate || endDate) {
      query.collectionDate = {};
      if (startDate) {
        // Set the query to find dates greater than or equal to the start of the startDate
        query.collectionDate.$gte = new Date(new Date(startDate).setUTCHours(0, 0, 0, 0));
      }
      if (endDate) {
        // Set the query to find dates less than or equal to the end of the endDate
        query.collectionDate.$lte = new Date(new Date(endDate).setUTCHours(23, 59, 59, 999));
      }
    }

    const collections = await Collection.find(query)
      .populate('vehicle', ['vehicleId', 'model']) // Populate vehicle details
      .populate('operator', 'fullName')           // Populate operator details
      .sort({ collectionDate: -1 });              // Sort by most recent date first
      
    res.json(collections);
  } catch (err) {
    console.error("Error fetching collections:", err.message);
    res.status(500).send('Server Error');
  }
});

// @route   POST api/collections
// @desc    Route for an operator to submit their daily collection
// @access  Private (Operator)
router.post('/', authMiddleware, async (req, res) => {
  const { amount, collectionDate } = req.body;
  const operatorId = req.user.id;

  if (!amount || !collectionDate) {
    return res.status(400).json({ msg: 'Amount and date are required.' });
  }

  try {
    const assignment = await Assignment.findOne({ operator: operatorId }).populate('vehicle');
    
    if (!assignment) {
      return res.status(404).json({ msg: 'You do not have an active assignment. Cannot submit collection.' });
    }

    const startOfDay = new Date(collectionDate);
    startOfDay.setUTCHours(0, 0, 0, 0);
    const endOfDay = new Date(collectionDate);
    endOfDay.setUTCHours(23, 59, 59, 999);

    const existingCollection = await Collection.findOne({
      operator: operatorId,
      collectionDate: { $gte: startOfDay, $lte: endOfDay },
    });

    if (existingCollection) {
      return res.status(400).json({ msg: 'A collection for this date has already been submitted.' });
    }

    const newCollection = new Collection({
      vehicle: assignment.vehicle._id,
      operator: operatorId,
      amount,
      collectionDate: startOfDay,
    });

    await newCollection.save();
    res.status(201).json({ msg: 'Collection submitted successfully.' });

  } catch (err) {
    console.error("Error submitting collection:", err.message);
    res.status(500).send('Server Error');
  }
});

export default router;