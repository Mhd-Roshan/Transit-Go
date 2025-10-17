import express from 'express';
import authMiddleware from '../middleware/authMiddleware.js';
import Assignment from '../models/Assignment.js';
import User from '../models/User.js';

const router = express.Router();

// @route   POST api/assignments
// @desc    Create a new assignment (Admin)
router.post('/', authMiddleware, async (req, res) => {
  // The 'fareId' is never sent from the frontend, so it's removed here.
  const { operatorId, vehicleId } = req.body;
  try {
    const newAssignment = new Assignment({
      operator: operatorId,
      vehicle: vehicleId,
      // The 'fare' field is omitted since it's optional and not provided.
    });
    const assignment = await newAssignment.save();
    
    // Populate the response with details, but without the 'fare'.
    const populatedAssignment = await Assignment.findById(assignment._id)
        .populate('operator', 'fullName')
        .populate('vehicle');
        // --- FIX: Removed .populate('fare') ---

    res.status(201).json(populatedAssignment);
  } catch (err) {
    console.error("Error creating assignment:", err.message);
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
      // --- FIX: Removed .populate('fare') ---
      .sort({ assignmentDate: -1 });
      
    res.json(assignments);
  } catch (err) {
    console.error("Error fetching all assignments:", err.message);
    res.status(500).send('Server Error');
  }
});

// @route   GET api/assignments/my-assignment
// @desc    Get the assignment for the logged-in operator
router.get('/my-assignment', authMiddleware, async (req, res) => {
    try {
        const assignment = await Assignment.findOne({ operator: req.user.id })
            .populate('vehicle');
            // --- FIX: Removed .populate('fare') ---

        if (!assignment) {
            return res.status(404).json({ msg: 'No assignment found for this operator.' });
        }
        res.json(assignment);
    } catch (err) {
        console.error("Error fetching my-assignment:", err.message);
        res.status(500).send('Server Error');
    }
});

// @route   DELETE api/assignments/:id
// @desc    Delete an assignment (Admin)
router.delete('/:id', authMiddleware, async (req, res) => {
    try {
        const assignment = await Assignment.findById(req.params.id);
        if (!assignment) {
            return res.status(404).json({ msg: 'Assignment not found' });
        }
        await Assignment.findByIdAndDelete(req.params.id);
        res.json({ msg: 'Assignment removed' });
    } catch (err) {
        console.error("Error deleting assignment:", err.message);
        res.status(500).send('Server Error');
    }
});

export default router;