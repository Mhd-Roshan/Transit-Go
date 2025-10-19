// src/pages/operator/OperatorRoutesPage.js

import React, { useState, useEffect, useCallback, useRef } from "react";
import axios from "axios";
import { Spinner, Alert } from "react-bootstrap";
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
      startSimulation({
        routeCoordinates,
        schedule: fullSchedule,
        onTripEnd: (completed) => {
          if (completed) {
            alert(`Trip with Vehicle ${myAssignment.vehicle.vehicleId} completed!`);
          }
        },
      });
    }
  };

  const renderContent = () => {
    if (loading) return ( <div className="status-container"><Spinner animation="border" variant="primary" /><p className="mt-2">Loading Assignment...</p></div> );
    if (error) return ( <div className="status-container"><Alert variant="danger">{error}</Alert></div> );
    
    // --- RENDER NO ASSIGNMENT VIEW ---
    if (!myAssignment || !myAssignment.vehicle) {
        return (
            <div className="no-assignment-container">
                <span className="material-icons icon">map</span>
                <h2>No Active Route</h2>
                <p>You must be assigned a vehicle by an administrator to view and start a route.</p>
            </div>
        );
    }

    // --- RENDER LIVE TRIP VIEW ---
    return (
      <div className="live-trip-card">
        <div className="map-wrapper">
          <MapContainer
            center={currentBusPosition || routeCoordinates[0]}
            zoom={15}
            scrollWheelZoom={false}
            className="leaflet-container"
            ref={mapRef}
          >
            <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
            <Polyline positions={routeCoordinates} color="#007aff" weight={5} />
            {isTripActive && currentBusPosition && selectedVehicle && (
              <Marker position={currentBusPosition} icon={busIcon}>
                <Popup>Vehicle: {selectedVehicle.vehicleId} (Live)</Popup>
              </Marker>
            )}
          </MapContainer>
        </div>
        
        <div className="trip-controls">
          <div className="route-details">
            <p className="route-label">
                {selectedVehicle.model} ({selectedVehicle.vehicleId})
            </p>
            <h3 className="route-path">
              <span>{selectedVehicle.source || 'Start'}</span>
              <span className="material-icons">east</span>
              <span>{selectedVehicle.destination || 'End'}</span>
            </h3>
          </div>
          
          <button 
            className={`trip-toggle-btn ${isTripActive ? 'end-trip' : 'start-trip'}`}
            onClick={handleTripToggle} 
            disabled={!selectedVehicle}
          >
            <span className="material-icons">{isTripActive ? 'stop_circle' : 'play_circle'}</span>
            {isTripActive ? 'End Trip' : 'Start Trip'}
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="operator-routes-page">
      <div className="page-header">
        <div>
            <h2 className="page-title">Live Trip Control</h2>
            <p className="page-subtitle">Manage your active route and track your progress.</p>
        </div>
      </div>
      {renderContent()}
    </div>
  );
}

export default OperatorRoutesPage;