import express from 'express';
import Route from '../models/Fares.js';

const router = express.Router();

// @route   GET api/utility/seed-fares
// @desc    (DEV ONLY) Clear and create a sample fare route for testing
// @access  Public
router.get('/seed-fares', async (req, res) => {
    try {
        // This object defines the entire fare chart for one route
        const wayanadRoute = {
            routeName: 'Wayanad Express',
            startPoint: 'Adivaram',
            endPoint: 'Pulpally',
            stops: [
                { stopName: 'Adivaram (Start)', fareFromStart: 0 },
                { stopName: 'Lakkidi View Point', fareFromStart: 20 },
                { stopName: 'Vythiri', fareFromStart: 30 },
                { stopName: 'Chundale', fareFromStart: 40 },
                { stopName: 'Kalpetta Bus Stand', fareFromStart: 55 },
                { stopName: 'Meenangadi', fareFromStart: 70 },
                { stopName: 'Sulthan Bathery', fareFromStart: 85 },
                { stopName: 'Pazhassi Park', fareFromStart: 95 },
                { stopName: 'Pulpally (End Point)', fareFromStart: 110 },
            ],
        };

        // Clear all existing routes to prevent duplicates
        await Route.deleteMany({});
        // Create the new, detailed route
        await Route.create(wayanadRoute);

        res.status(201).send('Successfully seeded the database with a sample fare route.');

    } catch (err) {
        console.error("Error seeding fares:", err.message);
        res.status(500).send('Server Error during seeding.');
    }
});

export default router;