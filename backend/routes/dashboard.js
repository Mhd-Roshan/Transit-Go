import express from 'express';
import authMiddleware from '../middleware/authMiddleware.js';
import User from '../models/User.js';
import Vehicle from '../models/Vehicle.js';
import Collection from '../models/Collection.js'; 

const router = express.Router();

// @route   GET api/dashboard/stats
// @desc    Get key statistics for the admin dashboard
router.get('/stats', authMiddleware, async (req, res) => {
  try {
    // --- THIS IS THE UPDATED SECTION ---
    const [
      totalUsers,
      totalOperators,
      totalVehicles,
      faresTodayResult,
      // 1. ADD a new variable to hold the total revenue result
      totalRevenueResult, 
      recentActivity,
    ] = await Promise.all([
      User.countDocuments(),
      User.countDocuments({ role: 'Operator' }),
      Vehicle.countDocuments(),
      (() => {
        const today = new Date();
        const startOfDay = new Date(new Date().setUTCHours(0, 0, 0, 0));
        const endOfDay = new Date(new Date().setUTCHours(23, 59, 59, 999));
        return Collection.aggregate([
          { $match: { collectionDate: { $gte: startOfDay, $lte: endOfDay } } },
          { $group: { _id: null, total: { $sum: '$amount' } } },
        ]);
      })(),
      // 2. ADD the new query to calculate the sum of all collections
      Collection.aggregate([
        { $group: { _id: null, total: { $sum: '$amount' } } },
      ]),
      User.find()
        .sort({ createdAt: -1 }) 
        .limit(5)
        .select('fullName role createdAt'),
    ]);

    const stats = {
      totalUsers: totalUsers || 0,
      totalOperators: totalOperators || 0,
      totalVehicles: totalVehicles || 0,
      faresToday: faresTodayResult[0]?.total || 0,
      // 3. ADD the new totalRevenue property to the response object
      totalRevenue: totalRevenueResult[0]?.total || 0,
      recentActivity: recentActivity || [],
    };

    res.json(stats);

  } catch (err) {
    console.error("Error in /api/dashboard/stats:", err.message);
    res.status(500).send('Server Error');
  }
});

export default router;