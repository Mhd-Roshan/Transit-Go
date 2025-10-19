import express from 'express';
import Route from '../models/Fares.js'; // Use the new Route model
import authMiddleware from '../middleware/authMiddleware.js';

const router = express.Router();

// @route   POST api/routes
// @desc    Create a new route with stops
// @access  Private (Admin)
router.post('/', authMiddleware, async (req, res) => {
  // Now accepts 'stops' array
  const { routeName, startPoint, endPoint, price, stops } = req.body;

  if (!routeName || !startPoint || !endPoint || !price || !stops) {
    return res.status(400).json({ msg: 'Please enter all fields, including stops.' });
  }

  try {
    const newRoute = new Route({
      routeName,
      startPoint,
      endPoint,
      price,
      stops,
    });

    const route = await newRoute.save();
    res.status(201).json(route);

  } catch (err) {
    console.error("Error creating route:", err.message);
    res.status(500).send('Server Error');
  }
});

// @route   GET api/routes
// @desc    Get all routes
// @access  Private (Authenticated Users)
router.get('/', authMiddleware, async (req, res) => {
  try {
    const routes = await Route.find().sort({ creationDate: -1 });
    res.json(routes);
  } catch (err) {
    console.error("Error fetching routes:", err.message);
    res.status(500).send('Server Error');
  }
});

// @route   DELETE api/routes/:id
// @desc    Delete a route by its ID
// @access  Private (Admin)
router.delete('/:id', authMiddleware, async (req, res) => {
    try {
        const route = await Route.findById(req.params.id);
        if (!route) {
            return res.status(404).json({ msg: 'Route not found' });
        }
        await Route.findByIdAndDelete(req.params.id);
        res.json({ msg: 'Route removed successfully' });
    } catch (err) {
        console.error("Error deleting route:", err.message);
        if (err.kind === 'ObjectId') {
            return res.status(404).json({ msg: 'Route not found' });
        }
        res.status(500).send('Server Error');
    }
});

export default router;