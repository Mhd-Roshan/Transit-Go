import React, { useState, useEffect, useRef, useCallback } from "react";
import axios from "axios";
import { Spinner, Card, Button } from "react-bootstrap";
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

// --- SIMULATED ROUTE & SCHEDULE MAPPING ---
const routeCoordinates = [ [12.9716, 77.5946], [12.9750, 77.6000], [12.9790, 77.6050], [12.9830, 77.6100], [12.9870, 77.6150], [12.9910, 77.6200] ];
const routeStops = ["Start Point", "City Park", "Main Street", "End Point"];
const legToStopMap = { 0: 0, 2: 1, 4: 2, 5: 3 };

function OperatorRoutesPage() {
  const [allVehicles, setAllVehicles] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [selectedVehicle, setSelectedVehicle] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [isTripActive, setIsTripActive] = useState(false);
  const [currentBusPosition, setCurrentBusPosition] = useState(routeCoordinates[0]);
  const [currentLeg, setCurrentLeg] = useState(0);
  const intervalRef = useRef(null);
  
  const { markStopAsComplete, resetCompletedStops } = useTrip();

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const token = localStorage.getItem("token");
      const headers = { Authorization: `Bearer ${token}` };
      const [assignmentRes, vehiclesRes] = await Promise.all([
        axios.get("http://localhost:5000/api/assignments", { headers }),
        axios.get("http://localhost:5000/api/vehicles", { headers }),
      ]);
      setAssignments(assignmentRes.data);
      setAllVehicles(vehiclesRes.data);
    } catch (err) {
      const serverMsg = err?.response?.data?.msg || err?.message;
      const isUnauthorized = err?.response?.status === 401;
      setError(
        isUnauthorized
          ? "Session expired. Please log in again."
          : `Could not load route details.${serverMsg ? ` Details: ${serverMsg}` : ""}`
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
    return () => clearInterval(intervalRef.current);
  }, [fetchData]);

  const startSimulation = () => {
    clearInterval(intervalRef.current);
    resetCompletedStops();
    markStopAsComplete(0);
    setCurrentLeg(0);
    setCurrentBusPosition(routeCoordinates[0]);

    intervalRef.current = setInterval(() => {
      setCurrentLeg(prevLeg => {
        const nextLeg = prevLeg + 1;
        if (nextLeg >= routeCoordinates.length) {
          endSimulation(true);
          return prevLeg;
        }
        setCurrentBusPosition(routeCoordinates[nextLeg]);
        if (legToStopMap[nextLeg] !== undefined) {
          markStopAsComplete(legToStopMap[nextLeg]);
        }
        return nextLeg;
      });
    }, 5000);
  };

  const endSimulation = (completed = false) => {
    clearInterval(intervalRef.current);
    setIsTripActive(false);
    if (completed) {
      alert(`Trip with Vehicle ${selectedVehicle.vehicleId} completed!`);
    } else {
      alert(`Trip with Vehicle ${selectedVehicle.vehicleId} has been stopped.`);
    }
  };

  const handleTripToggle = () => {
    if (!selectedVehicle) {
      alert("Please select a vehicle first.");
      return;
    }
    if (isTripActive) {
      endSimulation();
    } else {
      setIsTripActive(true);
      alert(`Starting trip with Vehicle ${selectedVehicle.vehicleId}.`);
      startSimulation();
    }
  };
  
  const availableVehicles = allVehicles.filter(v => !assignments.some(a => a.vehicle?._id === v._id));
  const getNextStop = () => {
    if (!isTripActive) return "Trip not started";
    if (currentLeg >= routeStops.length - 1) return "Final Destination";
    return routeStops[currentLeg + 1];
  };

  const renderContent = () => {
    if (loading) return ( <div className="status-container"><Spinner animation="border" variant="primary" /><p>Loading...</p></div> );
    if (error) return (
      <div className="status-container">
        <Card className="error-card">
          <Card.Body>
            <p style={{marginBottom: '1rem'}}>{error}</p>
            <div style={{display: 'flex', gap: '0.5rem', justifyContent: 'center'}}>
              <Button variant="outline-danger" onClick={() => setError("")}>Dismiss</Button>
              <Button variant="primary" onClick={fetchData} disabled={loading}>
                {loading ? 'Retrying...' : 'Retry'}
              </Button>
            </div>
          </Card.Body>
        </Card>
      </div>
    );
    
    return (
      <>
        <Card className="dashboard-card map-card">
          <MapContainer center={currentBusPosition} zoom={15} scrollWheelZoom={false} className="leaflet-container">
            <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
            <Polyline positions={routeCoordinates} color="blue" />
            {isTripActive && (
              <Marker position={currentBusPosition} icon={busIcon}>
                <Popup>Vehicle: {selectedVehicle.vehicleId}</Popup>
              </Marker>
            )}
          </MapContainer>
          
          <Card.Body>
            <div className="route-info">
              <div className="route-text">
                <h3>{selectedVehicle ? `${selectedVehicle.model} (${selectedVehicle.vehicleId})` : "No Vehicle Selected"}</h3>
                <p>
                  <span className="material-icons">fmd_good</span>
                  Next Stop: <strong>{getNextStop()}</strong>
                </p>
              </div>
              <Button 
                className={`trip-toggle-btn ${isTripActive ? 'active' : ''}`} 
                onClick={handleTripToggle} 
                disabled={!selectedVehicle}
              >
                {isTripActive ? 'End Trip' : 'Start Trip'}
              </Button>
            </div>
          </Card.Body>
        </Card>
        
        <section className="vehicle-selection">
          <h2 className="section-title">Select an Available Vehicle</h2>
          <div className="vehicle-list">
            {availableVehicles.length > 0 ? availableVehicles.map(vehicle => {
              const isSelected = selectedVehicle?._id === vehicle._id;
              return (
                <label key={vehicle._id} className={`vehicle-item ${isSelected ? 'selected' : ''}`}>
                  <span className="material-icons vehicle-icon">directions_bus</span>
                  <div className="vehicle-details">
                    <span className="vehicle-name">{vehicle.model} ({vehicle.vehicleId})</span>
                    <span className="status on-time">Available</span>
                  </div>
                  <input type="radio" name="vehicle" checked={isSelected} onChange={() => setSelectedVehicle(vehicle)} className="vehicle-radio" disabled={isTripActive} />
                  <span className="custom-radio"></span>
                </label>
              );
            }) : <p className="no-vehicles-msg">No vehicles are currently available for assignment.</p>}
          </div>
        </section>
      </>
    );
  };

  return (
    <>
      <div className="page-header">
        <h2 className="page-title">Live Route</h2>
        <button className="filter-btn">
          <span className="material-icons">filter_list</span>
          Filter
        </button>
      </div>
      {renderContent()}
    </>
  );
}

export default OperatorRoutesPage;