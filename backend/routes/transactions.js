// backend/routes/transactions.js

import express from 'express';
import authMiddleware from '../middleware/authMiddleware.js';
import Transaction from '../models/Transaction.js';
import Trip from '../models/Trip.js';

const router = express.Router();

// @route   GET api/transactions/all
// @desc    Get all transactions for the admin revenue report, with filters
// @access  Private (Admin)
router.get('/all', authMiddleware, async (req, res) => {
    try {
        const { vehicleId, passengerId, startDate, endDate } = req.query;
        
        let tripIds = [];
        if (vehicleId) {
            const relevantTrips = await Trip.find({ vehicle: vehicleId }).select('_id');
            tripIds = relevantTrips.map(t => t._id);
        }

        const query = {};
        if (vehicleId) query.trip = { $in: tripIds };
        if (passengerId) query.user = passengerId;

        // --- THIS IS THE CORRECTED DATE FILTERING LOGIC ---
        if (startDate || endDate) {
            query.createdAt = {};
            if (startDate) {
                // Create a date object representing the start of the day in UTC
                query.createdAt.$gte = new Date(`${startDate}T00:00:00.000Z`);
            }
            if (endDate) {
                // Create a date object representing the end of the day in UTC
                query.createdAt.$lte = new Date(`${endDate}T23:59:59.999Z`);
            }
        }
        // --- END OF FIX ---

        const transactions = await Transaction.find(query)
            .populate('user', 'fullName')
            .populate({
                path: 'trip',
                populate: { path: 'vehicle', select: 'vehicleId' }
            })
            .sort({ createdAt: -1 });

        res.json(transactions);
    } catch (err) {
        console.error('Error fetching all transactions:', err.message);
        res.status(500).send('Server Error');
    }
});

// @route   PUT api/transactions/:id
// @desc    Update a transaction (e.g., to link it to a trip)
// @access  Private
router.put('/:id', authMiddleware, async (req, res) => {
    try {
        const { tripId } = req.body;
        const transaction = await Transaction.findById(req.params.id);
        if (!transaction) return res.status(404).json({ msg: 'Transaction not found' });

        if (transaction.user.toString() !== req.user.id) {
            return res.status(401).json({ msg: 'User not authorized' });
        }

        if (tripId) transaction.trip = tripId;
        
        await transaction.save();
        res.json(transaction);
    } catch (err) {
        console.error('Error updating transaction:', err.message);
        res.status(500).send('Server Error');
    }
});

export default router;