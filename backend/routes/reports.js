import express from 'express';
import authMiddleware from '../middleware/authMiddleware.js';
import Report from '../models/Report.js';

const router = express.Router();

// @route   POST api/reports
// @desc    Submit a new report
router.post('/', authMiddleware, async (req, res) => {
  const { vehicleId, timeOfIncident, description } = req.body;

  if (!vehicleId || !timeOfIncident || !description) {
    return res.status(400).json({ msg: 'Please fill out all required fields.' });
  }

  try {
    const newReport = new Report({
      passenger: req.user.id,
      vehicle: vehicleId,
      timeOfIncident,
      description,
      status: 'Pending', // Default status
    });
    await newReport.save();
    res.status(201).json({ msg: 'Report submitted successfully.' });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   GET api/reports
// @desc    Get all reports (for Admin)
router.get('/', authMiddleware, async (req, res) => {
    try {
        const reports = await Report.find()
            .populate('passenger', 'fullName')
            .populate('vehicle', 'vehicleId model')
            .sort({ createdAt: -1 });
        res.json(reports);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// --- NEW ROUTE for Passengers ---
// @route   GET api/reports/my-reports
// @desc    Get all reports for the logged-in passenger
router.get('/my-reports', authMiddleware, async (req, res) => {
    try {
        const reports = await Report.find({ passenger: req.user.id })
            .populate('vehicle', 'vehicleId model')
            .sort({ createdAt: -1 });
        res.json(reports);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// --- NEW ROUTE for Admin replies ---
// @route   PUT api/reports/:id/reply
// @desc    Add a reply to a report and resolve it
router.put('/:id/reply', authMiddleware, async (req, res) => {
    // Ideally, you would add an admin role check here
    const { message } = req.body;
    if (!message) {
        return res.status(400).json({ msg: 'Reply message is required.' });
    }
    try {
        const report = await Report.findById(req.params.id);
        if (!report) {
            return res.status(404).json({ msg: 'Report not found.' });
        }

        report.reply = {
            admin: req.user.id, // or name, etc.
            message,
            date: new Date(),
        };
        report.status = 'Resolved';
        
        await report.save();
        
        // Populate for the response
        const populatedReport = await Report.findById(report._id)
            .populate('passenger', 'fullName')
            .populate('vehicle', 'vehicleId model');

        res.json(populatedReport);

    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

export default router;