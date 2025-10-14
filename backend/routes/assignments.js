import express from 'express';
import authMiddleware from '../middleware/authMiddleware.js';
import Assignment from '../models/Assignment.js';
import User from '../models/User.js';

const router = express.Router();

// @route   POST api/assignments
// @desc    Create a new assignment (Admin)
router.post('/', authMiddleware, async (req, res) => {
  const { operatorId, vehicleId, fareId } = req.body;
  try {
    const newAssignment = new Assignment({
      operator: operatorId,
      vehicle: vehicleId,
      fare: fareId,
    });
    const assignment = await newAssignment.save();
    // Populate the response with details
    const populatedAssignment = await Assignment.findById(assignment._id)
        .populate('operator', 'fullName')
        .populate('vehicle')
        .populate('fare');
    res.status(201).json(populatedAssignment);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   GET api/assignments
// @desc    Get all assignments (Admin)
router.get('/', authMiddleware, async (req, res) => {
  try {
    const assignments = await Assignment.find()
      .populate('operator', 'fullName')
      .populate('vehicle')
      .populate('fare')
      .sort({ assignmentDate: -1 });
    res.json(assignments);
  } catch (err) {
    res.status(500).send('Server Error');
  }
});

// @route   GET api/assignments/my-assignment
// @desc    Get the assignment for the logged-in operator
router.get('/my-assignment', authMiddleware, async (req, res) => {
    try {
        const assignment = await Assignment.findOne({ operator: req.user.id })
            .populate('vehicle')
            .populate('fare');

        if (!assignment) {
            return res.status(404).json({ msg: 'No assignment found for this operator.' });
        }
        res.json(assignment);
    } catch (err) {
        res.status(500).send('Server Error');
    }
});

// @route   DELETE api/assignments/:id
// @desc    Delete an assignment (Admin)
router.delete('/:id', authMiddleware, async (req, res) => {
    try {
        await Assignment.findByIdAndDelete(req.params.id);
        res.json({ msg: 'Assignment removed' });
    } catch (err) {
        res.status(500).send('Server Error');
    }
});

export default router;