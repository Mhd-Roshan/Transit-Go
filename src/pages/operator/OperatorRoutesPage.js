import React, { useState, useEffect, useCallback, useRef } from "react";
import { Spinner, Alert } from "react-bootstrap";
import { MapContainer, TileLayer, Marker, Popup, Polyline } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { useTrip } from "../../context/TripContext";
import API from "../../api";
import "../../styles/operatorRoutes.css";

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

const routeCoordinates = [
  [11.4555, 76.0155], [11.4810, 76.0180], [11.5050, 76.0200],
  [11.5160, 76.0210], [11.5280, 76.0300], [11.5490, 76.0410],
  [11.5780, 76.0520], [11.6000, 76.0750], [11.6100, 76.0840],
  [11.6250, 76.1250], [11.6350, 76.1650], [11.6500, 76.2200],
  [11.6600, 76.2550], [11.6950, 76.2200], [11.7300, 76.1900],
  [11.7750, 76.1700],
];

const fullSchedule = [
    { time: "8:00 AM", location: "Adivaram (Start)" }, { time: "8:30 AM", location: "Lakkidi View Point" },
    { time: "8:45 AM", location: "Vythiri" }, { time: "9:00 AM", location: "Chundale" },
    { time: "9:15 AM", location: "Kalpetta Bus Stand" }, { time: "9:45 AM", location: "Meenangadi" },
    { time: "10:15 AM", location: "Sulthan Bathery" }, { time: "10:45 AM", location: "Pazhassi Park" },
    { time: "11:00 AM", location: "Pulpally (End Point)" },
];


function OperatorRoutesPage() {
  const [myAssignment, setMyAssignment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const {
    isTripActive, 
    // --- THIS IS THE FIX: Get the setter function from the context ---
    setIsTripActive,
    currentBusPosition, selectedVehicle, setSelectedVehicle,
    startSimulation, endSimulation, currentDirection
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
      const res = await API.get("/assignments/my-assignment");
      const assignmentData = res.data;
      setMyAssignment(assignmentData);
      setSelectedVehicle(assignmentData.vehicle);

      // --- THIS IS THE FIX: Sync frontend state with backend state on load ---
      if (assignmentData.vehicle.status === 'On Route') {
        setIsTripActive(true);
      } else {
        setIsTripActive(false);
      }
      // --- END OF FIX ---

    } catch (err) {
      if (err.response?.status === 404) {
        setMyAssignment(null);
        setSelectedVehicle(null);
        setIsTripActive(false); // Ensure state is false if no assignment
      } else {
        setError(err.response?.data?.msg || "Could not load your assignment details.");
      }
    } finally {
      setLoading(false);
    }
  }, [setSelectedVehicle, setIsTripActive]);

  useEffect(() => {
    fetchMyAssignment();
  }, [fetchMyAssignment]);

  const handleTripToggle = () => {
    if (!myAssignment || !myAssignment.vehicle) return;
    const vehicleId = myAssignment.vehicle._id;

    if (isTripActive) {
      endSimulation(vehicleId, false, () => alert(`Trip with Vehicle ${myAssignment.vehicle.vehicleId} has been stopped.`));
    } else {
      alert(`Starting trip with Vehicle ${myAssignment.vehicle.vehicleId}.`);
      startSimulation({
        vehicleId,
        routeCoordinates,
        schedule: fullSchedule,
        onTripEnd: (completed) => {
          if (completed) alert(`Trip with Vehicle ${myAssignment.vehicle.vehicleId} completed!`);
        },
      });
    }
  };
  
  const renderContent = () => {
    if (loading) return ( <div className="status-container"><Spinner animation="border" variant="primary" /><p className="mt-2">Loading Assignment...</p></div> );
    if (error) return ( <div className="status-container"><Alert variant="danger">{error}</Alert></div> );
    
    if (!myAssignment || !myAssignment.vehicle) {
        return (
            <div className="no-assignment-container"><span className="material-icons icon">map</span><h2>No Active Route</h2><p>You must be assigned a vehicle by an administrator to view and start a route.</p></div>
        );
    }

    const source = selectedVehicle.source || 'Adivaram';
    const destination = selectedVehicle.destination || 'Pulpally';
    const displaySource = currentDirection === 'forward' ? source : destination;
    const displayDestination = currentDirection === 'forward' ? destination : source;

    return (
      <div className="live-trip-card">
        <div className="map-wrapper">
          <MapContainer center={currentBusPosition || routeCoordinates[0]} zoom={13} scrollWheelZoom={false} className="leaflet-container" ref={mapRef}>
            <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
            <Polyline positions={routeCoordinates} color="#007aff" weight={5} />
            {isTripActive && currentBusPosition && selectedVehicle && (
              <Marker position={currentBusPosition} icon={busIcon}><Popup>Vehicle: {selectedVehicle.vehicleId} (Live)</Popup></Marker>
            )}
          </MapContainer>
        </div>
        
        <div className="trip-controls">
          <div className="route-details">
            <p className="route-label">{selectedVehicle.model} ({selectedVehicle.vehicleId})</p>
            <h3 className="route-path">
              <span>{displaySource}</span>
              <span className="material-icons">east</span>
              <span>{displayDestination}</span>
            </h3>
          </div>
          
          <button className={`trip-toggle-btn ${isTripActive ? 'end-trip' : 'start-trip'}`} onClick={handleTripToggle} disabled={!selectedVehicle}>
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
        <div><h2 className="page-title">Live Trip Control</h2><p className="page-subtitle">Manage your active route and track your progress.</p></div>
      </div>
      {renderContent()}
    </div>
  );
}

export default OperatorRoutesPage;