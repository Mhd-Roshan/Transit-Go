// src/pages/operator/OperatorRoutesPage.js

import React, { useState, useEffect, useCallback, useRef } from "react";
import axios from "axios";
import { Spinner, Card, Button, Alert } from "react-bootstrap";
import { MapContainer, TileLayer, Marker, Popup, Polyline } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { useTrip } from "../../context/TripContext";
import "../../styles/operatorRoutes.css";

// --- Leaflet Icon Fix ---
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: require('leaflet/dist/images/marker-icon-2x.png'),
  iconUrl: require('leaflet/dist/images/marker-icon.png'),
  shadowUrl: require('leaflet/dist/images/marker-shadow.png'),
});
const busIcon = new L.Icon({
    iconUrl: 'https://cdn-icons-png.flaticon.com/512/3448/3448609.png',
    iconSize: [40, 40], iconAnchor: [20, 20], popupAnchor: [0, -20]
});

// --- SIMULATED ROUTE DATA ---
const routeCoordinates = [ [12.9716, 77.5946], [12.9750, 77.6000], [12.9790, 77.6050], [12.9830, 77.6100], [12.9870, 77.6150], [12.9910, 77.6200] ];
const fullSchedule = [
    { time: "8:00 AM", location: "Start Point" }, { time: "8:15 AM", location: "City Park" },
    { time: "8:30 AM", location: "Main Street" }, { time: "8:45 AM", location: "Downtown Central" },
    { time: "9:00 AM", location: "Westside Mall" }, { time: "9:15 AM", location: "North Bridge" },
    { time: "9:30 AM", location: "University Campus" }, { time: "9:45 AM", location: "Hospital Junction" },
    { time: "10:00 AM", location: "Eastside Market" }, { time: "10:15 AM", location: "Riverfront Plaza" },
    { time: "10:30 AM", location: "Green Valley" }, { time: "10:45 AM", location: "Tech Park" },
    { time: "11:00 AM", location: "Airport Shuttle Stop" }, { time: "11:15 AM", location: "Railway Station" },
    { time: "11:30 AM", location: "End Point" },
];

function OperatorRoutesPage() {
  const [myAssignment, setMyAssignment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const {
    isTripActive,
    currentBusPosition,
    selectedVehicle,
    setSelectedVehicle,
    startSimulation,
    endSimulation,
  } = useTrip();

  const mapRef = useRef(null);

  useEffect(() => {
    if (mapRef.current) {
      const timer = setTimeout(() => mapRef.current.invalidateSize(), 100);
      return () => clearTimeout(timer);
    }
  }, [mapRef, currentBusPosition]);

  const fetchMyAssignment = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const token = localStorage.getItem("token");
      const headers = { Authorization: `Bearer ${token}` };
      const res = await axios.get("http://localhost:5000/api/assignments/my-assignment", { headers });
      
      setMyAssignment(res.data);
      setSelectedVehicle(res.data.vehicle);

    } catch (err) {
      if (err.response?.status === 404) {
        setMyAssignment(null);
        setSelectedVehicle(null);
      } else {
        setError(err.response?.data?.msg || "Could not load your assignment details.");
      }
    } finally {
      setLoading(false);
    }
  }, [setSelectedVehicle]);

  useEffect(() => {
    fetchMyAssignment();
  }, [fetchMyAssignment]);

  const handleTripToggle = () => {
    if (!myAssignment || !myAssignment.vehicle) {
      alert("Cannot start trip without an assigned vehicle.");
      return;
    }

    if (isTripActive) {
      endSimulation(false, () => {
        alert(`Trip with Vehicle ${myAssignment.vehicle.vehicleId} has been stopped.`);
      });
    } else {
      alert(`Starting trip with Vehicle ${myAssignment.vehicle.vehicleId}.`);
      // --- THIS IS THE CORRECTED CALL ---
      startSimulation({
        routeCoordinates,
        schedule: fullSchedule, // Pass the full schedule
        onTripEnd: (completed) => {
          if (completed) {
            alert(`Trip with Vehicle ${myAssignment.vehicle.vehicleId} completed!`);
          }
        },
      });
    }
  };

  const renderContent = () => {
    if (loading) return ( <div className="status-container"><Spinner animation="border" variant="primary" /><p>Loading Your Assignment...</p></div> );
    if (error) return ( <div className="status-container"><Alert variant="danger">{error}</Alert></div> );
    
    return (
      <>
        <Card className="dashboard-card map-card">
          <MapContainer
            center={currentBusPosition || routeCoordinates[0]}
            zoom={15}
            scrollWheelZoom={false}
            className="leaflet-container"
            ref={mapRef}
          >
            <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
            <Polyline positions={routeCoordinates} color="blue" />
            {isTripActive && currentBusPosition && selectedVehicle && (
              <Marker position={currentBusPosition} icon={busIcon}>
                <Popup>Vehicle: {selectedVehicle.vehicleId}</Popup>
              </Marker>
            )}
          </MapContainer>
          
          <Card.Body>
            <div className="route-info">
              <div className="route-text">
                <h3>{selectedVehicle ? `${selectedVehicle.model} (${selectedVehicle.vehicleId})` : "No Vehicle Assigned"}</h3>
              </div>
              <Button 
                variant={isTripActive ? "danger" : "primary"}
                onClick={handleTripToggle} 
                disabled={!selectedVehicle}
              >
                {isTripActive ? 'End Trip' : 'Start Trip'}
              </Button>
            </div>
          </Card.Body>
        </Card>
        
        <section className="vehicle-selection">
          <h2 className="section-title">Your Active Assignment</h2>
          {myAssignment && myAssignment.vehicle ? (
            <div className="vehicle-list">
              <div className="vehicle-item selected">
                <span className="material-icons vehicle-icon">directions_bus</span>
                <div className="vehicle-details">
                  <span className="vehicle-name">{myAssignment.vehicle.model} ({myAssignment.vehicle.vehicleId})</span>
                  <span className="status on-time">Assigned to you</span>
                </div>
                <span className="material-icons assigned-check">check_circle</span>
              </div>
            </div>
          ) : (
            <Alert variant="info" className="text-center">
              You are not currently assigned to a vehicle. Please contact an administrator.
            </Alert>
          )}
        </section>
      </>
    );
  };

  return (
    <>
      <div className="page-header">
        <h2 className="page-title">Live Route</h2>
      </div>
      {renderContent()}
    </>
  );
}

export default OperatorRoutesPage;