import React, { createContext, useState, useContext, useCallback, useRef } from 'react';
import API from '../api'; // Import the new API client

const TripContext = createContext();

export const useTrip = () => useContext(TripContext);

export const TripProvider = ({ children }) => {
  const [isTripActive, setIsTripActive] = useState(false);
  const [currentLeg, setCurrentLeg] = useState(0);
  const [currentBusPosition, setCurrentBusPosition] = useState(null);
  const [completedStops, setCompletedStops] = useState(new Set());
  const [selectedVehicle, setSelectedVehicle] = useState(null);
  const [tripSchedule, setTripSchedule] = useState([]);

  const movementIntervalRef = useRef(null);

  const clearAllIntervals = () => {
    clearInterval(movementIntervalRef.current);
  };
  
  const markStopAsComplete = useCallback((stopIndex) => {
    setCompletedStops(prev => new Set(prev).add(stopIndex));
  }, []);

  const resetCompletedStops = useCallback(() => {
    setCompletedStops(new Set());
  }, []);

  const endSimulation = useCallback(async (vehicleId, completed = false, onTripEnd) => {
    clearAllIntervals();
    try {
      await API.post(`/vehicles/${vehicleId}/end-trip`);
    } catch (error) {
      console.error("Failed to notify backend of trip end:", error);
    }

    if (completed && tripSchedule.length > 0) {
      const allStops = new Set(Array.from({ length: tripSchedule.length }, (_, i) => i));
      setCompletedStops(allStops);
    }
    setIsTripActive(false);
    if (typeof onTripEnd === 'function') onTripEnd(completed);
  }, [tripSchedule]);

  const startSimulation = useCallback(async (config) => {
    let { vehicleId, routeCoordinates, schedule, onTripEnd, interval = 10000 } = config;
    if (!vehicleId || !routeCoordinates || !schedule) return;

    try {
      await API.post(`/vehicles/${vehicleId}/start-trip`);
    } catch (error) {
      console.error("Failed to start trip on backend:", error);
      alert("Error: Could not start trip on the server. The vehicle may already be on route.");
      return;
    }

    clearAllIntervals();
    resetCompletedStops();
    setTripSchedule(schedule);
    setIsTripActive(true);
    let legIndex = 0;

    const runSimulationStep = () => {
        // Update the bus's visual position on the map
        setCurrentBusPosition(routeCoordinates[legIndex]);
        setCurrentLeg(legIndex);
        
        // --- THIS IS THE KEY FIX ---
        // Determine the current stop based on progress
        const progress = legIndex / (routeCoordinates.length - 1);
        // Use Math.floor to get the LAST stop the bus has passed or is currently at
        const scheduleIndex = Math.floor(progress * (schedule.length - 1));
        const currentStop = schedule[scheduleIndex];

        // Only update the database if the current stop is valid
        if (currentStop?.location) {
            // Update the official location in the database
            API.put(`/vehicles/${vehicleId}/update-location`, { location: currentStop.location })
               .then(res => {
                    // Update local state for UI consistency, but DB is the source of truth
                    if(selectedVehicle) {
                        setSelectedVehicle(prev => ({...prev, currentLocation: res.data.currentLocation}));
                    }
               })
               .catch(err => console.error("Live location update failed:", err));
        }
        markStopAsComplete(scheduleIndex);

        // Move to the next leg or end the trip
        if (legIndex < routeCoordinates.length - 1) {
            legIndex++;
        } else {
            endSimulation(vehicleId, true, onTripEnd);
        }
    };
    
    runSimulationStep(); 
    movementIntervalRef.current = setInterval(runSimulationStep, interval);

  }, [resetCompletedStops, markStopAsComplete, endSimulation, selectedVehicle]);

  const value = {
    completedStops, markStopAsComplete, resetCompletedStops, isTripActive,
    setIsTripActive,
    currentLeg, currentBusPosition, selectedVehicle, setSelectedVehicle,
    tripSchedule, startSimulation, endSimulation
  };

  return <TripContext.Provider value={value}>{children}</TripContext.Provider>;
};