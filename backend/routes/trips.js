import express from 'express';
import authMiddleware from '../middleware/authMiddleware.js';
import Trip from '../models/Trip.js';
import User from '../models/User.js';
import Vehicle from '../models/Vehicle.js';
import { calculateFare } from '../utils/fareCalculator.js'; // Import the new utility
import Transaction from '../models/Transaction.js';

const router = express.Router();

// Helper function to validate dynamic QR code timestamps
const isQrCodeValid = (timestamp) => {
    const now = Date.now();
    const qrTime = parseInt(timestamp, 10);
    return (now - qrTime) < 600000; // 10 minute validity
};


// @route   GET api/trips/status
// @desc    Check if the user has an active trip
router.get('/status', authMiddleware, async (req, res) => {
    try {
        const user = await User.findById(req.user.id).populate('activeTrip');
        if (user && user.activeTrip) {
            res.json({ hasActiveTrip: true, trip: user.activeTrip });
        } else {
            res.json({ hasActiveTrip: false });
        }
    } catch (err) {
        console.error('Error checking trip status:', err.message);
        res.status(500).send('Server Error');
    }
});


// @route   POST api/trips/scan-entry
// @desc    Start a new trip upon scanning QR code
router.post('/scan-entry', authMiddleware, async (req, res) => {
    const { vehicleId, busLocation, timestamp } = req.body;

    if (!isQrCodeValid(timestamp)) {
        return res.status(400).json({ msg: 'Expired QR Code. Please scan the latest one.' });
    }

    try {
        const user = await User.findById(req.user.id);
        if (user.activeTrip) {
            return res.status(400).json({ msg: 'You already have an ongoing trip.' });
        }

        const vehicle = await Vehicle.findById(vehicleId);
        if (!vehicle) return res.status(404).json({ msg: 'Vehicle not found.' });

        if (vehicle.status !== 'On Route') {
            return res.status(400).json({ msg: 'This vehicle is not currently on its route. Please choose another bus.' });
        }

        const newTrip = new Trip({
            passenger: req.user.id, vehicle: vehicleId,
            origin: busLocation, status: 'Ongoing',
        });
        await newTrip.save();

        user.activeTrip = newTrip._id;
        await user.save();

        res.status(201).json({ msg: `Trip started successfully from ${busLocation}.` });

    } catch (err) {
        console.error('Error starting trip:', err.message);
        res.status(500).send('Server Error');
    }
});

// @route   POST api/trips/scan-exit
// @desc    End a trip, calculate fare, and process payment
router.post('/scan-exit', authMiddleware, async (req, res) => {
    const { busLocation, timestamp } = req.body;

    if (!isQrCodeValid(timestamp)) {
        return res.status(400).json({ msg: 'Expired QR Code. Please scan the latest one.' });
    }

    try {
        const user = await User.findById(req.user.id);
        if (!user.activeTrip) {
            return res.status(400).json({ msg: 'No active trip found to end.' });
        }

        const trip = await Trip.findById(user.activeTrip);
        if (!trip || trip.status !== 'Ongoing') {
            user.activeTrip = null;
            await user.save();
            return res.status(400).json({ msg: 'Active trip is invalid. Please start a new one.' });
        }
        
        const origin = trip.origin;
        const destination = busLocation;
        
        // --- THIS IS THE NEW, CLEAN IMPLEMENTATION ---
        // Call the dedicated utility function to handle all the complex logic.
        const fare = await calculateFare(origin, destination);
        // --- END OF NEW IMPLEMENTATION ---

        if (user.walletBalance < fare) {
            return res.status(402).json({ msg: `Insufficient balance. Fare is ₹${fare.toFixed(2)}. Please top up your wallet.` });
        }
        user.walletBalance -= fare;
        
        trip.destination = destination;
        trip.amountPaid = fare;
        trip.calculatedFare = fare;
        trip.status = 'Completed';
        user.activeTrip = null;

        await user.save();
        await trip.save();

        await Transaction.create({
            user: req.user.id, amount: -fare,
            description: `Trip from ${origin} to ${destination}`,
            status: 'succeeded', trip: trip._id
        });

        res.json({
            msg: `Trip ended. A fare of ₹${fare.toFixed(2)} has been deducted.`,
            newBalance: user.walletBalance,
        });

    } catch (err) {
        console.error('Error ending trip:', err.message);
        res.status(500).send('Server Error');
    }
});


// @route   GET api/trips/my-trips
// @desc    Get all completed trips for the logged-in passenger
router.get('/my-trips', authMiddleware, async (req, res) => {
  try {
    const trips = await Trip.find({ passenger: req.user.id, status: 'Completed' })
      .sort({ tripDate: -1 });
    res.json(trips);
  } catch (err) {
    console.error('Error fetching my-trips:', err.message);
    res.status(500).send('Server Error');
  }
});

export default router;