import React, { createContext, useState, useContext, useCallback, useRef } from 'react';
import API from '../api'; // Import the new API client

const TripContext = createContext();

export const useTrip = () => useContext(TripContext);

// Note: This schedule is now just for the frontend simulation.
// Real fare calculation happens on the backend.
const fullSchedule = [
    { time: "8:00 AM", location: "Adivaram (Start)" },
    { time: "8:30 AM", location: "Lakkidi View Point" },
    { time: "8:45 AM", location: "Vythiri" },
    { time: "9:00 AM", location: "Chundale" },
    { time: "9:15 AM", location: "Kalpetta Bus Stand" },
    { time: "9:45 AM", location: "Meenangadi" },
    { time: "10:15 AM", location: "Sulthan Bathery" },
    { time: "10:45 AM", location: "Pazhassi Park" },
    { time: "11:00 AM", location: "Pulpally (End Point)" },
];

export const TripProvider = ({ children }) => {
  const [isTripActive, setIsTripActive] = useState(false);
  const [currentLeg, setCurrentLeg] = useState(0);
  const [currentBusPosition, setCurrentBusPosition] = useState(null);
  const [completedStops, setCompletedStops] = useState(new Set());
  const [selectedVehicle, setSelectedVehicle] = useState(null);
  const [tripSchedule, setTripSchedule] = useState([]);
  const [currentDirection, setCurrentDirection] = useState('forward'); // 'forward' or 'backward'

  const movementIntervalRef = useRef(null);
  const scheduleIntervalRef = useRef(null);

  const clearAllIntervals = () => {
    clearInterval(movementIntervalRef.current);
    clearInterval(scheduleIntervalRef.current);
  };
  
  // This function is no longer needed in the context as data is fetched directly in components.
  // const loadAssignment = useCallback(async () => { ... });

  const markStopAsComplete = useCallback((stopIndex) => {
    setCompletedStops(prev => new Set(prev).add(stopIndex));
  }, []);

  const resetCompletedStops = useCallback(() => {
    setCompletedStops(new Set());
  }, []);

  const endSimulation = useCallback((completed = false, onTripEnd) => {
    clearAllIntervals();
    if (completed && tripSchedule.length > 0) {
      const allStops = new Set(Array.from({ length: tripSchedule.length }, (_, i) => i));
      setCompletedStops(allStops);
    }
    setIsTripActive(false);
    if (typeof onTripEnd === 'function') onTripEnd(completed);
  }, [tripSchedule]);

  const startSimulation = useCallback((config) => {
    let { routeCoordinates, schedule, onTripEnd, interval = 8000 } = config; // Slower bus speed
    if (!routeCoordinates || !schedule) return;

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
                        endSimulation(true, onTripEnd);
                    }
                    return prevLeg;
                }
                setCurrentBusPosition(coords[nextLeg]);
                return nextLeg;
            });
        }, interval);
    };

    runTrip(routeCoordinates, 0, 'forward');

    let currentStopIndex = 0;
    const totalDuration = (routeCoordinates.length - 1) * interval;
    const scheduleInterval = totalDuration / (schedule.length - 1);
    scheduleIntervalRef.current = setInterval(() => {
        currentStopIndex++;
        if (currentStopIndex < schedule.length) {
            markStopAsComplete(currentStopIndex);
        } else {
            clearInterval(scheduleIntervalRef.current);
        }
    }, scheduleInterval);

  }, [resetCompletedStops, markStopAsComplete, endSimulation]);

  const value = {
    completedStops, markStopAsComplete, resetCompletedStops, isTripActive,
    currentLeg, currentBusPosition, selectedVehicle, setSelectedVehicle,
    tripSchedule, startSimulation, endSimulation, currentDirection
  };

  return <TripContext.Provider value={value}>{children}</TripContext.Provider>;
};