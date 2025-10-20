import React, { createContext, useState, useContext, useCallback, useRef } from 'react';
import axios from 'axios';

const TripContext = createContext();

export const useTrip = () => useContext(TripContext);

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

  const [assignment, setAssignment] = useState(null);
  const [assignmentLoading, setAssignmentLoading] = useState(true);
  const [assignmentError, setAssignmentError] = useState('');

  const movementIntervalRef = useRef(null);
  const scheduleIntervalRef = useRef(null);

  const clearAllIntervals = () => {
    clearInterval(movementIntervalRef.current);
    clearInterval(scheduleIntervalRef.current);
  };
  
  const loadAssignment = useCallback(async () => {
    setAssignmentLoading(true);
    setAssignmentError('');
    try {
      const token = localStorage.getItem("token");
      const res = await axios.get("http://localhost:5000/api/assignments/my-assignment", {
        headers: { Authorization: `Bearer ${token}` }
      });
      setAssignment(res.data);
      setSelectedVehicle(res.data.vehicle);
      setTripSchedule(fullSchedule); 
    } catch (err) {
      if (err.response?.status === 404) {
        setAssignment(null);
      } else {
        setAssignmentError("Could not load your assignment data.");
      }
    } finally {
      setAssignmentLoading(false);
    }
  }, []);

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
    const { routeCoordinates, schedule, onTripEnd, interval = 5000 } = config;
    if (!routeCoordinates || !schedule) return;

    clearAllIntervals();
    resetCompletedStops();
    setTripSchedule(schedule);
    setIsTripActive(true);
    setCurrentLeg(0);
    setCurrentBusPosition(routeCoordinates[0]);
    markStopAsComplete(0);

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

    let currentStopIndex = 0;
    const totalDuration = (routeCoordinates.length - 1) * interval;
    const scheduleInterval = totalDuration / (schedule.length - 1);

    scheduleIntervalRef.current = setInterval(() => {
      currentStopIndex++;
      if (currentStopIndex < schedule.length) {
        markStopAsComplete(currentStopIndex);
      } else {
        endSimulation(true, onTripEnd);
      }
    }, scheduleInterval);
  }, [resetCompletedStops, markStopAsComplete, endSimulation]);

  const value = {
    completedStops, markStopAsComplete, resetCompletedStops, isTripActive,
    currentLeg, currentBusPosition, selectedVehicle, setSelectedVehicle,
    tripSchedule, startSimulation, endSimulation,
    assignment, assignmentLoading, assignmentError, loadAssignment
  };

  return <TripContext.Provider value={value}>{children}</TripContext.Provider>;
};