// src/pages/operator/Dashboard.js

import React, { useState, useEffect } from "react";
import axios from "axios";
import { Card, Spinner, Alert } from "react-bootstrap";
import QRCode from "react-qr-code";
import { BsCheckCircleFill } from "react-icons/bs"; // Restored this import
import OperatorLayout from "../../layouts/OperatorLayout";
import { useTrip } from "../../context/TripContext"; // Restored this import
import "../../styles/opdashboard.css";

const Dashboard = () => {
  const [assignment, setAssignment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [liveEarnings, setLiveEarnings] = useState(0);

  // --- RESTORED: Getting trip state from context ---
  const { completedStops, isTripActive } = useTrip();

  // --- RESTORED: Schedule data for the tracker ---
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

  useEffect(() => {
    let intervalId = null;
    // Only run earnings simulation when an assignment exists and a trip is active
    if (assignment && isTripActive) {
      intervalId = setInterval(() => {
        setLiveEarnings(prevEarnings => {
          // If we've already reached the cap, keep it capped
          const CAP = 4000;
          if (prevEarnings >= CAP) return CAP;
          const newFare = Math.random() * (150 - 20) + 20;
          const updated = prevEarnings + newFare;
          return updated >= CAP ? CAP : updated;
        });
      }, 8000);
    }

    return () => { if (intervalId) clearInterval(intervalId); };
  }, [assignment, isTripActive]);

  // Ensure live fare starts at ₹0 when a trip begins; keep cap enforced by the interval
  useEffect(() => {
    if (isTripActive && assignment) {
      setLiveEarnings(0);
    }
  }, [isTripActive, assignment]);

  const renderContent = () => {
    if (loading) {
      return <div className="status-container"><Spinner animation="border" variant="primary" /><p className="mt-2">Loading Dashboard...</p></div>;
    }
    
    if (error) {
       return <div className="status-container"><Alert variant="danger">{error}</Alert></div>
    }

    return (
      <>
        {/* Card 1: Live Fare Collection */}
        <Card className="dashboard-card" style={{ animationDelay: '100ms' }}>
          <Card.Body>
            <Card.Title>Live Fare Collection</Card.Title>
            {assignment && assignment.vehicle ? (
              <div className="vehicle-details-grid">
                <div className="vehicle-info">
                  <p className="vehicle-id">{assignment.vehicle.vehicleId}</p>
                  <p className="vehicle-model">
                    Use this QR code for passenger payments.
                  </p>
                  <div className="collection-display mt-3">
                    <span className="collection-time">Live Earnings (Simulated)</span>
                    <span className="collection-amount text-success">
                        ₹{liveEarnings.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </span>
                  </div>
                </div>
                <div className="qr-code-container">
                  <div className="qr-code-wrapper">
                    <QRCode
                      value={`/pay?vehicle=${assignment.vehicle._id}`}
                      size={128}
                      viewBox={`0 0 128 128`}
                    />
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center p-3">
                 <span className="material-icons" style={{fontSize: '48px', color: 'var(--op-text-secondary)'}}>no_transfer</span>
                 <h5 className="mt-3">No Vehicle Assigned</h5>
                 <p className="no-collection-msg">
                   You cannot collect fares because you have not been assigned a vehicle. Please contact an administrator.
                 </p>
              </div>
            )}
          </Card.Body>
        </Card>

        {/* --- RESTORED: Schedule Tracker Card --- */}
        {/* This card will only be displayed if an assignment exists */}
        {assignment && (
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
        )}
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