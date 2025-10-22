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
  const [currentDirection, setCurrentDirection] = useState('forward');

  const movementIntervalRef = useRef(null);
  const scheduleIntervalRef = useRef(null);

  const clearAllIntervals = () => {
    clearInterval(movementIntervalRef.current);
    clearInterval(scheduleIntervalRef.current);
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
    let { vehicleId, routeCoordinates, schedule, onTripEnd, interval = 8000 } = config;
    if (!vehicleId || !routeCoordinates || !schedule) return;

    try {
      await API.post(`/vehicles/${vehicleId}/start-trip`);
    } catch (error) {
      console.error("Failed to start trip on backend:", error);
      alert("Error: Could not start trip on the server. The vehicle may already be on route.");
      return; // Stop execution if backend fails
    }

    clearAllIntervals();
    resetCompletedStops();
    setTripSchedule(schedule);
    setIsTripActive(true);
    setCurrentLeg(0);
    setCurrentBusPosition(routeCoordinates[0]);
    markStopAsComplete(0);
    setCurrentDirection('forward');

    const runTrip = (coords, legStart, direction) => {
        movementIntervalRef.current = setInterval(() => {
            setCurrentLeg(prevLeg => {
                const nextLeg = prevLeg + 1;
                if (nextLeg >= coords.length) {
                    clearInterval(movementIntervalRef.current);
                    if (direction === 'forward') {
                        setCurrentDirection('backward');
                        runTrip([...coords].reverse(), 0, 'backward');
                    } else {
                        endSimulation(vehicleId, true, onTripEnd);
                    }
                    return prevLeg;
                }
                setCurrentBusPosition(coords[nextLeg]);

                const currentStop = schedule[Math.floor((nextLeg / (coords.length -1)) * (schedule.length -1))];
                if (currentStop) {
                    API.put(`/vehicles/${vehicleId}/update-location`, { location: currentStop.location });
                }
                return nextLeg;
            });
        }, interval);
    };

    runTrip(routeCoordinates, 0, 'forward');

    let currentStopIndex = 0;
    const totalDuration = (routeCoordinates.length - 1) * interval;
    const scheduleIntervalTime = totalDuration / (schedule.length - 1);
    scheduleIntervalRef.current = setInterval(() => {
        currentStopIndex++;
        if (currentStopIndex < schedule.length) {
            markStopAsComplete(currentStopIndex);
        } else {
            clearInterval(scheduleIntervalRef.current);
        }
    }, scheduleIntervalTime);

  }, [resetCompletedStops, markStopAsComplete, endSimulation]);

  const value = {
    completedStops, markStopAsComplete, resetCompletedStops, isTripActive,
    // --- THIS IS THE FIX: Expose setIsTripActive for synchronization ---
    setIsTripActive,
    currentLeg, currentBusPosition, selectedVehicle, setSelectedVehicle,
    tripSchedule, startSimulation, endSimulation, currentDirection
  };

  return <TripContext.Provider value={value}>{children}</TripContext.Provider>;
};