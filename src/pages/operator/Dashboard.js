// src/pages/operator/Dashboard.js

import React, { useState, useEffect } from "react";
import axios from "axios";
import { Card, Spinner, Alert } from "react-bootstrap";
import QRCode from "react-qr-code";
import { BsCheckCircleFill } from "react-icons/bs";
import OperatorLayout from "../../layouts/OperatorLayout";
import { useTrip } from "../../context/TripContext";
import "../../styles/opdashboard.css";

const Dashboard = () => {
  const [assignment, setAssignment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [liveEarnings, setLiveEarnings] = useState(0);
  // --- NEW: State for simulated passenger count ---
  const [simulatedPassengers, setSimulatedPassengers] = useState(0);

  const { completedStops, isTripActive } = useTrip();
  
  // --- NEW: Daily goal for the progress bar ---
  const DAILY_GOAL = 5000;

  const schedule = [
    { time: "8:00 AM", location: "Start Point" },
    { time: "8:15 AM", location: "City Park" },
    { time: "8:30 AM", location: "Main Street" },
    { time: "8:45 AM", location: "Downtown Central" },
    { time: "9:00 AM", location: "Westside Mall" },
    { time: "9:15 AM", location: "North Bridge" },
    { time: "9:30 AM", location: "University Campus" },
    { time: "9:45 AM", location: "Hospital Junction" },
    { time: "10:00 AM", location: "Eastside Market" },
    { time: "10:30 AM", location: "Green Valley" },
    { time: "11:00 AM", location: "Airport Shuttle Stop" },
    { time: "11:15 AM", location: "Railway Station" },
    { time: "11:30 AM", location: "End Point" },
  ];

  useEffect(() => {
    const fetchAssignment = async () => {
      setLoading(true);
      setError("");
      try {
        const token = localStorage.getItem("token");
        const headers = { Authorization: `Bearer ${token}` };
        const res = await axios.get("http://localhost:5000/api/assignments/my-assignment", { headers });
        setAssignment(res.data);
      } catch (err) {
        if (err.response?.status === 404) {
          console.log("Operator has no current assignment.");
          setAssignment(null);
        } else {
          console.error("Error fetching assignment:", err);
          setError("Could not load dashboard data. Please try again later.");
        }
      } finally {
        setLoading(false);
      }
    };
    fetchAssignment();
  }, []);

  // --- UPDATED: Simulation now also counts passengers ---
  useEffect(() => {
    let intervalId = null;
    if (assignment && isTripActive) {
      intervalId = setInterval(() => {
        setLiveEarnings(prevEarnings => {
          const CAP = DAILY_GOAL + 500; // Allow going slightly over goal
          if (prevEarnings >= CAP) return CAP;
          const newFare = Math.random() * (150 - 20) + 20;
          const updated = prevEarnings + newFare;
          // Increment passengers when fare is collected
          setSimulatedPassengers(p => p + Math.floor(Math.random() * 3) + 1);
          return updated >= CAP ? CAP : updated;
        });
      }, 8000);
    }
    return () => { if (intervalId) clearInterval(intervalId); };
  }, [assignment, isTripActive]);

  // --- UPDATED: Reset both earnings and passengers on trip start ---
  useEffect(() => {
    if (isTripActive && assignment) {
      setLiveEarnings(0);
      setSimulatedPassengers(0);
    }
  }, [isTripActive, assignment]);
  
  const earningsProgress = (liveEarnings / DAILY_GOAL) * 100;

  const renderContent = () => {
    if (loading) {
      return <div className="status-container"><Spinner animation="border" variant="primary" /><p className="mt-2">Loading Dashboard...</p></div>;
    }
    
    if (error) {
       return <div className="status-container"><Alert variant="danger">{error}</Alert></div>;
    }

    // --- NEW: Render a full-page "No Assignment" state ---
    if (!assignment || !assignment.vehicle) {
        return (
            <div className="no-assignment-container">
                <span className="material-icons icon">no_transfer</span>
                <h2>No Vehicle Assigned</h2>
                <p>You cannot start a trip or collect fares until an administrator assigns a vehicle to you.</p>
            </div>
        );
    }

    return (
      <>
        {/* --- Card 1: Redesigned Live Trip Status Card --- */}
        <Card className="dashboard-card" style={{ animationDelay: '100ms' }}>
          <Card.Body>
            <div className="vehicle-details-grid">
              {/* Left Side: Details */}
              <div className="vehicle-info">
                <p className="vehicle-id">{assignment.vehicle.vehicleId}</p>
                <p className="vehicle-model">{assignment.vehicle.model}</p>
                
                <div className="earnings-section">
                    <p className="earnings-label">Live Earnings (Simulated)</p>
                    <h3 className="earnings-amount">₹{liveEarnings.toLocaleString('en-IN')}</h3>
                    <div className="earnings-progress">
                        <div className="earnings-progress-bar" style={{ width: `${Math.min(earningsProgress, 100)}%` }}></div>
                    </div>
                </div>

                <div className="summary-grid">
                    <div className="summary-item">
                        <p className="summary-value">
                            <span className="material-icons">hail</span>
                            {simulatedPassengers}
                        </p>
                        <p className="summary-label">Passengers</p>
                    </div>
                    <div className="summary-item">
                        <p className="summary-value">
                            <span className="material-icons">tour</span>
                            {completedStops.size} / {schedule.length}
                        </p>
                        <p className="summary-label">Stops Completed</p>
                    </div>
                    <div className="summary-item">
                        <p className="summary-value">
                            <span className={`status-badge ${isTripActive ? 'active' : 'inactive'}`}>
                                {isTripActive ? 'Active' : 'Inactive'}
                            </span>
                        </p>
                        <p className="summary-label">Trip Status</p>
                    </div>
                </div>

              </div>
              {/* Right Side: QR Code */}
              <div className="qr-code-container">
                <div className="qr-code-wrapper">
                  <QRCode value={`/pay?vehicle=${assignment.vehicle._id}`} size={128} viewBox={`0 0 128 128`} />
                </div>
              </div>
            </div>
          </Card.Body>
        </Card>

        {/* --- Card 2: Schedule Tracker Card --- */}
        <Card className="dashboard-card" style={{ animationDelay: '200ms' }}>
          <Card.Body>
            <Card.Title>Schedule Tracker</Card.Title>
            <div className="schedule-timeline">
              {schedule.map((item, index) => (
                <div key={index} className={`schedule-item ${completedStops.has(index) ? 'completed' : ''}`}>
                  <div className="schedule-details">
                    <p className="schedule-time m-0">{item.time}</p>
                    <p className="schedule-location m-0">{item.location}</p>
                  </div>
                  {completedStops.has(index) && (
                    <BsCheckCircleFill className="completed-icon" />
                  )}
                </div>
              ))}
            </div>
          </Card.Body>
        </Card>
      </>
    );
  };

  return (
    <OperatorLayout>
      {renderContent()}
    </OperatorLayout>
  );
};

export default Dashboard;