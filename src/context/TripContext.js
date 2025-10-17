import React, { createContext, useState, useContext, useCallback } from 'react';

// 1. Create the context which will be shared
const TripContext = createContext();

// 2. Create a custom hook for easy access in components
export const useTrip = () => {
  return useContext(TripContext);
};

// 3. Create the Provider component that will hold the state and logic
export const TripProvider = ({ children }) => {
  const [completedStops, setCompletedStops] = useState(new Set());

  // Function to add a stop index to the completed set
  const markStopAsComplete = useCallback((stopIndex) => {
    setCompletedStops(prevStops => {
      const newStops = new Set(prevStops); // Create a new set to trigger re-renders
      newStops.add(stopIndex);
      return newStops;
    });
  }, []);
  
  // Function to clear all completed stops, e.g., for a new trip
  const resetCompletedStops = useCallback(() => {
    setCompletedStops(new Set());
  }, []);

  // The value that will be available to all consumer components
  const value = {
    completedStops,
    markStopAsComplete,
    resetCompletedStops,
  };

  return <TripContext.Provider value={value}>{children}</TripContext.Provider>;
};