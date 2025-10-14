
import express from 'express';
import authMiddleware from '../middleware/authMiddleware.js';
import Report from '../models/Report.js';

const router = express.Router();

// @route   POST api/reports
// @desc    Submit a new report
router.post('/', authMiddleware, async (req, res) => {
  // CHANGE THIS LINE
  const { vehicleId, timeOfIncident, description } = req.body;

  // CHANGE THIS CHECK
  if (!vehicleId || !timeOfIncident || !description) {
    return res.status(400).json({ msg: 'Please fill out all required fields.' });
  }

  try {
    const newReport = new Report({
      passenger: req.user.id,
      // CHANGE THIS LINE
      vehicle: vehicleId,
      timeOfIncident,
      description,
    });
    await newReport.save();
    res.status(201).json({ msg: 'Report submitted successfully.' });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// ... your other GET/PUT routes in this file might also need updating
// to populate 'vehicle' instead of 'route' ...

export default router;