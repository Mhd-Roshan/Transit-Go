// src/context/TripContext.js

import React, { createContext, useState, useContext, useCallback, useRef } from 'react';

const TripContext = createContext();

export const useTrip = () => {
  return useContext(TripContext);
};

export const TripProvider = ({ children }) => {
  // State for the trip
  const [isTripActive, setIsTripActive] = useState(false);
  const [currentLeg, setCurrentLeg] = useState(0);
  const [currentBusPosition, setCurrentBusPosition] = useState(null);
  const [completedStops, setCompletedStops] = useState(new Set());
  const [selectedVehicle, setSelectedVehicle] = useState(null);
  
  // Refs to hold interval IDs for cleanup
  const movementIntervalRef = useRef(null);
  const scheduleIntervalRef = useRef(null);

  const clearAllIntervals = () => {
    clearInterval(movementIntervalRef.current);
    clearInterval(scheduleIntervalRef.current);
    movementIntervalRef.current = null;
    scheduleIntervalRef.current = null;
  };

  const markStopAsComplete = useCallback((stopIndex) => {
    setCompletedStops(prevStops => {
      const newStops = new Set(prevStops);
      newStops.add(stopIndex);
      return newStops;
    });
  }, []);
  
  const resetCompletedStops = useCallback(() => {
    setCompletedStops(new Set());
  }, []);

  const endSimulation = useCallback((completed = false, onTripEnd) => {
    clearAllIntervals();
    setIsTripActive(false);
    if (typeof onTripEnd === 'function') {
      onTripEnd(completed);
    }
  }, []);

  const startSimulation = useCallback((config) => {
    const { routeCoordinates, schedule, onTripEnd, interval = 5000 } = config;

    // Safety check
    if (!routeCoordinates || routeCoordinates.length === 0 || !schedule || schedule.length === 0) {
      console.error("Simulation start failed: Missing route or schedule data.");
      return;
    }

    // Reset any previous trip
    clearAllIntervals();
    resetCompletedStops();

    // Initialize state for the new trip
    setIsTripActive(true);
    setCurrentLeg(0);
    setCurrentBusPosition(routeCoordinates[0]);
    markStopAsComplete(0); // Always complete the first stop on start

    // SIMULATION 1: Bus Movement on the Map
    movementIntervalRef.current = setInterval(() => {
      setCurrentLeg(prevLeg => {
        const nextLeg = prevLeg + 1;
        if (nextLeg >= routeCoordinates.length) {
          clearInterval(movementIntervalRef.current);
          return prevLeg;
        }
        setCurrentBusPosition(routeCoordinates[nextLeg]);
        return nextLeg;
      });
    }, interval);

    // SIMULATION 2: Accurate Schedule Tracker Progression
    let currentStopIndex = 0;
    const totalTripDuration = (routeCoordinates.length - 1) * interval;
    const scheduleIntervalTime = totalTripDuration / (schedule.length - 1);

    scheduleIntervalRef.current = setInterval(() => {
      currentStopIndex++;
      if (currentStopIndex < schedule.length) {
        markStopAsComplete(currentStopIndex);
      } else {
        endSimulation(true, onTripEnd);
      }
    }, scheduleIntervalTime);

  }, [resetCompletedStops, markStopAsComplete, endSimulation]);

  const value = {
    completedStops,
    markStopAsComplete,
    resetCompletedStops,
    isTripActive,
    currentLeg,
    currentBusPosition,
    selectedVehicle,
    setSelectedVehicle,
    startSimulation,
    endSimulation,
  };

  return <TripContext.Provider value={value}>{children}</TripContext.Provider>;
};