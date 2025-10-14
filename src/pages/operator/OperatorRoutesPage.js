import React, { useState, useEffect } from "react";
import axios from "axios";
import { Spinner, Card, Button } from "react-bootstrap";
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';

// CORRECT: Import your reusable components from the new location
import OperatorHeader from "../../components/OperatorHeader";
import OperatorBottomNav from "../../components/OperatorBottomNav";

import "../../styles/operatorRoutes.css";

function OperatorRoutesPage() {
  const [assignment, setAssignment] = useState(null);
  const [vehicles, setVehicles] = useState([]);
  const [selectedVehicle, setSelectedVehicle] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const defaultPosition = [12.9716, 77.5946];

  // *** LOGIC RESTORED ***
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError("");
      try {
        const token = localStorage.getItem("token");
        const headers = { Authorization: `Bearer ${token}` };
        
        const [assignmentRes, vehiclesRes] = await Promise.all([
          axios.get("http://localhost:5000/api/assignments/my-assignment", { headers }),
          axios.get("http://localhost:5000/api/vehicles", { headers }),
        ]);

        setAssignment(assignmentRes.data);
        setVehicles(vehiclesRes.data);

        if (assignmentRes.data.vehicle) {
            setSelectedVehicle(assignmentRes.data.vehicle);
        }
      } catch (err) {
        setError(err.response?.status === 404 ? "You do not have an active assignment." : "Could not load route details.");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // *** LOGIC RESTORED ***
  const handleStartTrip = () => {
    if (!selectedVehicle) {
      alert("Please select a vehicle to start the trip.");
      return;
    }
    alert(`Starting trip with Vehicle ${selectedVehicle.vehicleId}.`);
  };

  // *** LOGIC RESTORED ***
  const renderContent = () => {
    if (loading) return ( <div className="status-container"><Spinner animation="border" variant="primary" /><p className="mt-2 text-muted">Loading Routes...</p></div> );
    if (error) return ( <div className="status-container"><Card className="shadow-sm p-4 text-center"><Card.Body className="error-text">{error}</Card.Body></Card></div> );
    
    if (assignment) {
      return (
        <>
          <div className="map-card">
            <MapContainer center={defaultPosition} zoom={13} scrollWheelZoom={false} className="leaflet-container">
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />
              <Marker position={defaultPosition}>
                <Popup>Your current route starts here.</Popup>
              </Marker>
            </MapContainer>
            
            <div className="route-info">
              <div className="route-text">
                <h3>{selectedVehicle ? `Vehicle ${selectedVehicle.vehicleId}` : "No Vehicle Selected"}</h3>
                <p>Next Stop: {selectedVehicle ? "City Park" : "..."}</p>
              </div>
              <Button className="select-route-btn" onClick={handleStartTrip} disabled={!selectedVehicle}>
                Start Trip
              </Button>
            </div>
          </div>
          
          <section className="vehicle-selection">
            <h2 className="section-title">Select Vehicle</h2>
            <div className="vehicle-list">
              {vehicles.map((vehicle, index) => {
                const status = index % 2 === 0 ? "On Time" : "Delayed";
                const isSelected = selectedVehicle?._id === vehicle._id;
                return (
                  <label key={vehicle._id} className={`vehicle-item ${isSelected ? 'selected' : ''}`}>
                    <span className="material-icons vehicle-icon">directions_bus</span>
                    <div className="vehicle-details">
                      <span className="vehicle-name">Vehicle {vehicle.vehicleId}</span>
                      <span className={`status ${status === 'Delayed' ? 'delayed' : 'on-time'}`}>{status}</span>
                    </div>
                    <input
                      type="radio"
                      name="vehicle"
                      checked={isSelected}
                      onChange={() => setSelectedVehicle(vehicle)}
                      className="vehicle-radio"
                    />
                    <span className="custom-radio"></span>
                  </label>
                );
              })}
            </div>
          </section>
        </>
      );
    }
    return null;
  };


  return (
    <div className="routes-page">
      <OperatorHeader />
      
      <main className="main-content">
        <div className="page-header">
          <h2 className="page-title">Routes</h2>
          <button className="filter-btn">
            <span className="material-icons">filter_list</span>
            Filter
          </button>
        </div>
        {renderContent()}
      </main>

      <div className="action-banner">
        <span className="material-icons">info</span>
        Action Required
      </div>
      
      <OperatorBottomNav />
    </div>
  );
}

export default OperatorRoutesPage;