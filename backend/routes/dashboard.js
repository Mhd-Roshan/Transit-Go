import express from 'express';
import authMiddleware from '../middleware/authMiddleware.js';
import User from '../models/User.js';
import Vehicle from '../models/Vehicle.js';
import Collection from '../models/Collection.js'; 
import Transaction from '../models/Transaction.js';

const router = express.Router();

// @route   GET api/dashboard/revenue-report
// @desc    Get a combined list of passenger payments and operator collections
router.get('/revenue-report', authMiddleware, async (req, res) => {
    // ... this route is correct and remains unchanged ...
    try {
        const { startDate, endDate, operatorId, vehicleId } = req.query;
        let combinedReport = [];

        // --- Fetch Passenger Transactions ---
        const transactionQuery = { amount: { $gt: 0 } };
        if (startDate || endDate) {
            transactionQuery.createdAt = {};
            if (startDate) transactionQuery.createdAt.$gte = new Date(`${startDate}T00:00:00.000Z`);
            if (endDate) transactionQuery.createdAt.$lte = new Date(`${endDate}T23:59:59.999Z`);
        }
        
        const transactions = await Transaction.find(transactionQuery).populate('user', 'fullName').populate({ path: 'trip', populate: { path: 'vehicle', select: 'vehicleId' } });
        
        transactions.forEach(tx => {
            const tripVehicleId = tx.trip?.vehicle?._id;
            if (vehicleId && (!tripVehicleId || tripVehicleId.toString() !== vehicleId)) return;
            
            combinedReport.push({
                _id: tx._id, type: 'Passenger Payment', amount: tx.amount, date: tx.createdAt,
                description: tx.description, userName: tx.user?.fullName, vehicleId: tx.trip?.vehicle?.vehicleId,
            });
        });

        // --- Fetch Operator Collections ---
        const collectionQuery = {};
        if (startDate || endDate) {
            collectionQuery.collectionDate = {};
            if (startDate) collectionQuery.collectionDate.$gte = new Date(`${startDate}T00:00:00.000Z`);
            if (endDate) collectionQuery.collectionDate.$lte = new Date(`${endDate}T23:59:59.999Z`);
        }
        if (operatorId) collectionQuery.operator = operatorId;
        if (vehicleId) collectionQuery.vehicle = vehicleId;

        const collections = await Collection.find(collectionQuery).populate('operator', 'fullName').populate('vehicle', 'vehicleId');

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


// @route   GET api/dashboard/stats
// @desc    Get key statistics for the admin dashboard
router.get('/stats', authMiddleware, async (req, res) => {
  try {
    // --- THIS IS THE CORRECTED LOGIC ---
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
      // 1. Get the sum of all operator collections
      Collection.aggregate([
        { $group: { _id: null, total: { $sum: '$amount' } } },
      ]),
      // 2. Get the sum of all passenger payments and top-ups (credits)
      Transaction.aggregate([
        { $match: { amount: { $gt: 0 } } }, // Only include positive amounts
        { $group: { _id: null, total: { $sum: '$amount' } } },
      ]),
      User.find()
        .sort({ createdAt: -1 }) 
        .limit(5)
        .select('fullName role createdAt'),
    ]);

    // 3. Calculate the true total revenue by combining both sources
    const collectionRevenue = totalCollectionResult[0]?.total || 0;
    const transactionRevenue = totalTransactionResult[0]?.total || 0;
    const totalRevenue = collectionRevenue + transactionRevenue;

    // FaresToday can also be a combination if you have digital payments today
    // For simplicity, we'll keep it as collection-based for now.
    // To include transactions, you'd add another aggregation here with a date filter.
    
    const stats = {
      totalUsers: totalUsers || 0,
      totalOperators: totalOperators || 0,
      totalVehicles: totalVehicles || 0,
      faresToday: 0, // Placeholder, as this requires a separate daily aggregation
      totalRevenue: totalRevenue, // Use the new combined total
      recentActivity: recentActivity || [],
    };

    res.json(stats);

  } catch (err) {
    console.error("Error in /api/dashboard/stats:", err.message);
    res.status(500).send('Server Error');
  }
});

export default router;