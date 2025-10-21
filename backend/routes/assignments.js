import express from 'express';
import authMiddleware from '../middleware/authMiddleware.js';
import Assignment from '../models/Assignment.js';
import User from '../models/User.js';

const router = express.Router();

// @route   GET api/assignments/active
// @desc    Get all currently assigned/active buses for passengers to see
// @access  Private (Authenticated Users)
router.get('/active', authMiddleware, async (req, res) => {
  try {
    const activeAssignments = await Assignment.find().populate(
      'vehicle',
      'vehicleId model source destination'
    );

    if (!activeAssignments || activeAssignments.length === 0) {
      return res.json([]);
    }
    
    // --- THIS IS THE FIX ---
    // Filter out any assignments where the vehicle might have been deleted (is null)
    const validAssignments = activeAssignments.filter(assignment => assignment.vehicle);

    const now = new Date();
    let lastDeparture = new Date(now.getTime() + (Math.random() * 5 + 2) * 60000);
    const statuses = ['On Time', 'On Time', 'Scheduled', 'Delayed'];

    const scheduledBuses = validAssignments.map(assignment => {
      const currentDeparture = new Date(lastDeparture.getTime());
      const interval = (Math.random() * 15 + 10) * 60000;
      lastDeparture = new Date(lastDeparture.getTime() + interval);

      return {
        _id: assignment._id,
        vehicle: assignment.vehicle,
        departureTime: currentDeparture,
        status: statuses[Math.floor(Math.random() * statuses.length)],
      };
    });
    
    res.json(scheduledBuses);

  } catch (err) {
    console.error("Error fetching active assignments:", err.message);
    res.status(500).send('Server Error');
  }
});


// @route   POST api/assignments
// @desc    Create a new assignment (Admin)
router.post('/', authMiddleware, async (req, res) => {
  const { operatorId, vehicleId } = req.body;
  try {
    // --- THIS IS THE FIX: Add server-side validation ---
    // Check if the vehicle is already assigned
    const vehicleInUse = await Assignment.findOne({ vehicle: vehicleId });
    if (vehicleInUse) {
      return res.status(400).json({ msg: 'This vehicle is already assigned to another operator.' });
    }
    // The schema enforces operator uniqueness, but an extra check is good practice
    const operatorInUse = await Assignment.findOne({ operator: operatorId });
    if (operatorInUse) {
      return res.status(400).json({ msg: 'This operator is already assigned to another vehicle.' });
    }
    // --- END OF FIX ---

    const newAssignment = new Assignment({
      operator: operatorId,
      vehicle: vehicleId,
    });
    const assignment = await newAssignment.save();
    
    const populatedAssignment = await Assignment.findById(assignment._id)
        .populate('operator', 'fullName')
        .populate('vehicle');

    res.status(201).json(populatedAssignment);
  } catch (err) {
    console.error("Error creating assignment:", err.message);
    // The unique constraint on the schema will also throw an error which is caught here
    if (err.code === 11000) {
      return res.status(400).json({ msg: 'This vehicle or operator is already assigned.' });
    }
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