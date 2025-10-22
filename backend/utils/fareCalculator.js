// backend/utils/fareCalculator.js
import Route from '../models/Fares.js';

const MINIMUM_FARE = 20;

/**
 * Calculates the fare between an origin and destination stop.
 * @param {string} origin - The name of the starting stop.
 * @param {string} destination - The name of the ending stop.
 * @returns {Promise<number>} The calculated fare, or the minimum fare if calculation fails.
 */
export const calculateFare = async (origin, destination) => {
  try {
    // Step 1: Handle the edge case where origin and destination are the same.
    if (origin.trim().toLowerCase() === destination.trim().toLowerCase()) {
      return MINIMUM_FARE;
    }

    // Step 2: Create flexible, case-insensitive regex patterns for both stops.
    // This is crucial for matching names like "Adivaram" and "Adivaram (Start)".
    const originRegex = new RegExp(origin.trim(), 'i');
    const destinationRegex = new RegExp(destination.trim(), 'i');

    // Step 3: Find the single, correct route document that contains BOTH stops.
    // This is the most reliable way to ensure we're using the right fare chart.
    const routeDefinition = await Route.findOne({
      $and: [
        { 'stops.stopName': originRegex },
        { 'stops.stopName': destinationRegex }
      ]
    });

    // Step 4: If no single route contains both stops, we cannot calculate the fare.
    if (!routeDefinition) {
      console.warn(`Fare Warning: No single route definition found containing both "${origin}" and "${destination}".`);
      return MINIMUM_FARE;
    }

    // Step 5: Find the specific stop objects within the located route definition.
    const originStop = routeDefinition.stops.find(s => originRegex.test(s.stopName));
    const destStop = routeDefinition.stops.find(s => destinationRegex.test(s.stopName));

    // Step 6: If both stops are found, calculate the fare from their values.
    if (originStop && destStop) {
      const calculatedFare = Math.abs(destStop.fareFromStart - originStop.fareFromStart);
      
      // Ensure the final fare is at least the minimum.
      const finalFare = Math.max(calculatedFare, MINIMUM_FARE);
      console.log(`Fare Calculated: From "${originStop.stopName}" (₹${originStop.fareFromStart}) to "${destStop.stopName}" (₹${destStop.fareFromStart}) = ₹${finalFare}`);
      return finalFare;
    }

    // Fallback if stops couldn't be found even after finding the route.
    console.warn(`Fare Warning: Could not map both stops within the resolved route. Origin: ${origin}, Dest: ${destination}`);
    return MINIMUM_FARE;

  } catch (error) {
    console.error("CRITICAL ERROR in fare calculation utility:", error);
    return MINIMUM_FARE; // Safe fallback in case of any unexpected error.
  }
};