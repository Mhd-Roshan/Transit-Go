import express from 'express';
import Vehicle from '../models/Vehicle.js';
import authMiddleware from '../middleware/authMiddleware.js'; // Import middleware

const router = express.Router();

// @route   POST api/vehicles
// @desc    Register a new vehicle (NOW PROTECTED)
router.post('/', authMiddleware, async (req, res) => {
  const { vehicleId, model, capacity, source, destination } = req.body;
  try {
    let vehicle = await Vehicle.findOne({ vehicleId });
    if (vehicle) {
      return res.status(400).json({ msg: 'A vehicle with this ID already exists.' });
    }
    vehicle = new Vehicle({ vehicleId, model, capacity, source, destination });
    await vehicle.save();
    res.status(201).json(vehicle);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   GET api/vehicles
// @desc    Get all registered vehicles (NOW PROTECTED)
router.get('/', authMiddleware, async (req, res) => {
  try {
    const vehicles = await Vehicle.find().sort({ registrationDate: -1 });
    res.json(vehicles);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   PUT api/vehicles/:id
// @desc    Update a vehicle's source and destination (NOW PROTECTED)
router.put('/:id', authMiddleware, async (req, res) => {
  const { source, destination } = req.body;
  try {
    const updatedVehicle = await Vehicle.findByIdAndUpdate(
      req.params.id,
      { source, destination },
      { new: true }
    );
    if (!updatedVehicle) {
      return res.status(404).json({ msg: 'Vehicle not found' });
    }
    res.json(updatedVehicle);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   DELETE api/vehicles/:id
// @desc    Delete a vehicle by its MongoDB ID (NOW PROTECTED)
router.delete('/:id', authMiddleware, async (req, res) => {
    try {
        const vehicle = await Vehicle.findById(req.params.id);
        if (!vehicle) {
            return res.status(404).json({ msg: 'Vehicle not found' });
        }
        await Vehicle.findByIdAndDelete(req.params.id);
        res.json({ msg: 'Vehicle removed successfully' });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

export default router;