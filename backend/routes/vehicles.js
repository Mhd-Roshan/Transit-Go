import express from 'express';
import Vehicle from '../models/Vehicle.js';
import authMiddleware from '../middleware/authMiddleware.js';

const router = express.Router();

// @route   POST api/vehicles
// @desc    Register a new vehicle
router.post('/', authMiddleware, async (req, res) => {
  const { vehicleId, model, capacity, source, destination, registrationDate } = req.body;
  try {
    let vehicle = await Vehicle.findOne({ vehicleId });
    if (vehicle) {
      return res.status(400).json({ msg: 'This Vehicle ID is already registered. Please use the edit function to update details.' });
    }
    vehicle = new Vehicle({ vehicleId, model, capacity, source, destination, registrationDate });
    await vehicle.save();
    res.status(201).json(vehicle);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   GET api/vehicles
// @desc    Get all registered vehicles
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
// @desc    Update a vehicle's details
router.put('/:id', authMiddleware, async (req, res) => {
  const { source, destination, model, capacity, status, registrationDate } = req.body;
  
  const updateFields = {};
  if (source !== undefined) updateFields.source = source;
  if (destination !== undefined) updateFields.destination = destination;
  if (model) updateFields.model = model;
  if (capacity) updateFields.capacity = capacity;
  if (status) updateFields.status = status;
  if (registrationDate) updateFields.registrationDate = registrationDate;

  try {
    const updatedVehicle = await Vehicle.findByIdAndUpdate(
      req.params.id,
      { $set: updateFields },
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
// @desc    Delete a vehicle by its MongoDB ID
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

// --- NEW SIMULATION CONTROL ENDPOINTS ---

// @route   GET api/vehicles/live
// @desc    Get all vehicles currently 'On Route' for passenger view
router.get('/live', authMiddleware, async (req, res) => {
  try {
    const liveVehicles = await Vehicle.find({ status: 'On Route' });
    res.json(liveVehicles);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   POST api/vehicles/:id/start-trip
// @desc    Operator starts a trip simulation
router.post('/:id/start-trip', authMiddleware, async (req, res) => {
  try {
    const vehicle = await Vehicle.findById(req.params.id);
    if (!vehicle) return res.status(404).json({ msg: 'Vehicle not found' });
    if (vehicle.status !== 'Active') return res.status(400).json({ msg: 'Vehicle is not available to start a trip.' });

    vehicle.status = 'On Route';
    vehicle.currentLocation = vehicle.source || 'Starting Point';
    await vehicle.save();
    res.json(vehicle);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   POST api/vehicles/:id/end-trip
// @desc    Operator ends a trip simulation
router.post('/:id/end-trip', authMiddleware, async (req, res) => {
  try {
    const vehicle = await Vehicle.findByIdAndUpdate(
      req.params.id,
      { status: 'Active', currentLocation: null },
      { new: true }
    );
    if (!vehicle) return res.status(404).json({ msg: 'Vehicle not found' });
    res.json(vehicle);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   PUT api/vehicles/:id/update-location
// @desc    Operator's client updates its live location
router.put('/:id/update-location', authMiddleware, async (req, res) => {
  const { location } = req.body;
  if (!location) return res.status(400).json({ msg: 'Location is required.' });

  try {
    const vehicle = await Vehicle.findByIdAndUpdate(
      req.params.id,
      { currentLocation: location },
      { new: true }
    );
    if (!vehicle) return res.status(404).json({ msg: 'Vehicle not found' });
    res.json(vehicle);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

export default router;