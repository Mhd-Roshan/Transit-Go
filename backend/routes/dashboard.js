import express from 'express';
import authMiddleware from '../middleware/authMiddleware.js';
import User from '../models/User.js';
import Vehicle from '../models/Vehicle.js';
import Collection from '../models/Collection.js'; 
import Transaction from '../models/Transaction.js';
import Trip from '../models/Trip.js';
import Assignment from '../models/Assignment.js'; // Import the Assignment model

const router = express.Router();

// ... (other routes like /operator-earnings remain the same) ...
// @route   GET api/dashboard/operator-earnings
// @desc    Get today's earnings for the logged-in operator
router.get('/operator-earnings', authMiddleware, async (req, res) => {
    try {
        const assignment = await Assignment.findOne({ operator: req.user.id });
        if (!assignment) {
            return res.json({ todayEarnings: 0 });
        }

        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const trips = await Trip.find({
            vehicle: assignment.vehicle,
            status: 'Completed',
            tripDate: { $gte: today }
        });

        const todayEarnings = trips.reduce((sum, trip) => sum + trip.amountPaid, 0);
        res.json({ todayEarnings });

    } catch (err) {
        console.error("Error fetching operator earnings:", err.message);
        res.status(500).send('Server Error');
    }
});


// @route   GET api/dashboard/revenue-report
// @desc    Get a combined list of passenger payments and operator collections
router.get('/revenue-report', authMiddleware, async (req, res) => {
    try {
        // --- THIS IS THE FIX (PART 1) ---
        // Use `let` to allow modification of vehicleId
        let { startDate, endDate, operatorId, vehicleId } = req.query;
        let effectiveVehicleId = vehicleId;

        // If an operator is selected, find their assigned vehicle.
        // This will override any specific vehicle filter.
        if (operatorId) {
            const assignment = await Assignment.findOne({ operator: operatorId });
            if (!assignment) {
                // If the operator has no assignment, they can't have any revenue.
                return res.json([]);
            }
            // Use the operator's assigned vehicle ID for all subsequent filtering.
            effectiveVehicleId = assignment.vehicle.toString();
        }
        // --- END OF FIX (PART 1) ---

        let combinedReport = [];
        
        // --- PASSENGER PAYMENTS (Transactions) ---
        const transactionQuery = { amount: { $lt: 0 } }; 
        if (startDate || endDate) {
            transactionQuery.createdAt = {};
            if (startDate) transactionQuery.createdAt.$gte = new Date(`${startDate}T00:00:00.000Z`);
            if (endDate) transactionQuery.createdAt.$lte = new Date(`${endDate}T23:59:59.999Z`);
        }
        
        // Find all trips related to the effective vehicle, if one is specified
        let relevantTripIds = [];
        if (effectiveVehicleId) {
            const relevantTrips = await Trip.find({ vehicle: effectiveVehicleId }).select('_id');
            relevantTripIds = relevantTrips.map(t => t._id);
            transactionQuery.trip = { $in: relevantTripIds };
        }

        const transactions = await Transaction.find(transactionQuery)
          .populate('user', 'fullName')
          .populate({ 
            path: 'trip', 
            populate: { path: 'vehicle', select: 'vehicleId' } 
          });
        
        transactions.forEach(tx => {
            combinedReport.push({
                _id: tx._id, type: 'Passenger Payment', amount: Math.abs(tx.amount),
                date: tx.createdAt, description: tx.description, 
                userName: tx.user?.fullName, vehicleId: tx.trip?.vehicle?.vehicleId,
            });
        });

        // --- OPERATOR CASH COLLECTIONS ---
        const collectionQuery = {};
        if (startDate || endDate) {
            collectionQuery.collectionDate = {};
            if (startDate) collectionQuery.collectionDate.$gte = new Date(`${startDate}T00:00:00.000Z`);
            if (endDate) collectionQuery.collectionDate.$lte = new Date(`${endDate}T23:59:59.999Z`);
        }
        if (operatorId) collectionQuery.operator = operatorId;

        // --- THIS IS THE FIX (PART 2) ---
        // Also filter collections by the effective vehicle ID
        if (effectiveVehicleId) collectionQuery.vehicle = effectiveVehicleId;
        // --- END OF FIX (PART 2) ---

        const collections = await Collection.find(collectionQuery)
            .populate('operator', 'fullName')
            .populate('vehicle', 'vehicleId');

        collections.forEach(col => {
            combinedReport.push({
                _id: col._id, type: 'Operator Collection', amount: col.amount, date: col.collectionDate,
                description: `Cash collection`, userName: col.operator?.fullName, vehicleId: col.vehicle?.vehicleId,
            });
        });
        
        combinedReport.sort((a, b) => new Date(b.date) - new Date(a.date));
        res.json(combinedReport);
    } catch (err) {
        console.error("Error fetching revenue report:", err.message);
        res.status(500).send('Server Error');
    }
});


// ... (the rest of the file remains the same) ...
// @route   GET api/dashboard/stats
// @desc    Get key statistics for the admin dashboard
router.get('/stats', authMiddleware, async (req, res) => {
  try {
    const [
      totalUsers,
      totalOperators,
      totalVehicles,
      totalCollectionResult, 
      totalTransactionResult,
      recentActivity,
    ] = await Promise.all([
      User.countDocuments(),
      User.countDocuments({ role: 'Operator' }),
      Vehicle.countDocuments(),
      Collection.aggregate([
        { $group: { _id: null, total: { $sum: '$amount' } } },
      ]),
      Transaction.aggregate([
        { $match: { amount: { $lt: 0 } } }, 
        { $group: { _id: null, total: { $sum: '$amount' } } },
      ]),
      User.find()
        .sort({ createdAt: -1 }) 
        .limit(5)
        .select('fullName role createdAt'),
    ]);

    const collectionRevenue = totalCollectionResult[0]?.total || 0;
    const transactionRevenue = Math.abs(totalTransactionResult[0]?.total || 0);
    const totalRevenue = collectionRevenue + transactionRevenue;
    
    const stats = {
      totalUsers: totalUsers || 0,
      totalOperators: totalOperators || 0,
      totalVehicles: totalVehicles || 0,
      faresToday: 0, 
      totalRevenue: totalRevenue, 
      recentActivity: recentActivity || [],
    };

    res.json(stats);

  } catch (err) {
    console.error("Error in /api/dashboard/stats:", err.message);
    res.status(500).send('Server Error');
  }
});

export default router;