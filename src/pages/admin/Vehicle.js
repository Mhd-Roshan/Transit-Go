import React, { useState, useEffect } from "react";
import axios from "axios";
import { Modal, Button } from "react-bootstrap";
import QRCode from "react-qr-code"; // Import the QR code component
import AdminLayout from "../../layouts/AdminLayout";
import "../../styles/vehicle.css";

function VehicleManagementPage() {
  const [vehicles, setVehicles] = useState([]);
  const [vehicleId, setVehicleId] = useState("");
  const [model, setModel] = useState("");
  const [capacity, setCapacity] = useState("");
  const [source, setSource] = useState("");
  const [destination, setDestination] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [vehicleIdError, setVehicleIdError] = useState("");
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingVehicle, setEditingVehicle] = useState(null);

  // --- NEW: State for the QR Code Modal ---
  const [showQRModal, setShowQRModal] = useState(false);
  const [selectedVehicleForQR, setSelectedVehicleForQR] = useState(null);

  const fetchVehicles = async () => {
    setLoading(true);
    setError("");
    try {
      const token = localStorage.getItem("token");
      const res = await axios.get("http://localhost:5000/api/vehicles", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setVehicles(res.data);
    } catch (err) {
      setError("Failed to fetch vehicles. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVehicles();
  }, []);

  const handleVehicleIdChange = (e) => {
    const value = e.target.value.toUpperCase();
    setVehicleId(value);
    const regex = /^[A-Z]{2}[0-9]{1,2}[A-Z]{1,2}[0-9]{4}$/;
    if (value === "" || regex.test(value)) {
      setVehicleIdError("");
    } else {
      setVehicleIdError("Invalid format. Use format like KL08AZ1234.");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (vehicleIdError) return;
    if (!vehicleId || !model || !capacity) {
      setError("Vehicle ID, Model, and Capacity are required.");
      return;
    }
    setIsSubmitting(true);
    try {
      const token = localStorage.getItem("token");
      const res = await axios.post(
        "http://localhost:5000/api/vehicles",
        { vehicleId, model, capacity, source, destination },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setVehicles([res.data, ...vehicles]);
      setVehicleId("");
      setModel("");
      setCapacity("");
      setSource("");
      setDestination("");
    } catch (err) {
      setError(err.response?.data?.msg || "Failed to register vehicle.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditClick = (vehicle) => {
    setEditingVehicle(vehicle);
    setShowEditModal(true);
  };

  const handleCloseModal = () => {
    setShowEditModal(false);
    setEditingVehicle(null);
  };

  const handleUpdateSubmit = async () => {
    if (!editingVehicle) return;
    try {
        const token = localStorage.getItem("token");
        const res = await axios.put(
            `http://localhost:5000/api/vehicles/${editingVehicle._id}`,
            { source: editingVehicle.source, destination: editingVehicle.destination },
            { headers: { Authorization: `Bearer ${token}` } }
        );
        setVehicles(vehicles.map(v => v._id === editingVehicle._id ? res.data : v));
        handleCloseModal();
    } catch (err) {
        console.error("Failed to update vehicle", err);
        alert("Failed to update vehicle route.");
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this vehicle?")) {
      try {
        const token = localStorage.getItem("token");
        await axios.delete(`http://localhost:5000/api/vehicles/${id}`, {
            headers: { Authorization: `Bearer ${token}` },
        });
        setVehicles(vehicles.filter(v => v._id !== id));
      } catch (err) {
          setError("Failed to delete vehicle.");
      }
    }
  };

  // --- NEW: Functions to handle the QR Code Modal ---
  const handleShowQR = (vehicle) => {
    setSelectedVehicleForQR(vehicle);
    setShowQRModal(true);
  };

  const handleCloseQRModal = () => {
    setShowQRModal(false);
    setSelectedVehicleForQR(null);
  };
  
  const handlePrintQR = () => {
    window.print();
  };

  return (
    <AdminLayout>
      <div className="vehicle-management-page animate-fade-in">
        <h2 className="page-title">Vehicle Management</h2>
        <p className="page-subtitle">Add new vehicles and manage their routes.</p>
        
        <div className="form-card">
          {error && <p className="error-message">{error}</p>}
          <form onSubmit={handleSubmit}>
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="source">Source</label>
                <input type="text" id="source" value={source} onChange={(e) => setSource(e.target.value)} disabled={isSubmitting} />
              </div>
              <div className="form-group">
                <label htmlFor="destination">Destination</label>
                <input type="text" id="destination" value={destination} onChange={(e) => setDestination(e.target.value)} disabled={isSubmitting} />
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="vehicleId">Vehicle ID / Number</label>
                <input type="text" id="vehicleId" value={vehicleId} onChange={handleVehicleIdChange} className={vehicleIdError ? 'input-error' : ''} disabled={isSubmitting} />
                {vehicleIdError && <p className="input-error-message">{vehicleIdError}</p>}
              </div>
              <div className="form-group">
                <label htmlFor="model">Vehicle Model</label>
                <input type="text" id="model" value={model} onChange={(e) => setModel(e.target.value)} disabled={isSubmitting} />
              </div>
              <div className="form-group">
                <label htmlFor="capacity">Capacity</label>
                <input type="number" id="capacity" value={capacity} onChange={(e) => setCapacity(e.target.value)} disabled={isSubmitting} />
              </div>
            </div>
            <button type="submit" className="register-btn" disabled={isSubmitting}>
              <span className="material-icons">add_circle</span>
              {isSubmitting ? "Registering..." : "Register Vehicle"}
            </button>
          </form>
        </div>
        
        <h3 className="section-title">Registered Vehicles</h3>
        {loading ? <p className="loading-text">Loading...</p> : (
          <div className="vehicles-list">
            {vehicles.map((v) => (
              <div key={v._id} className="vehicle-card">
                <div className="vehicle-info">
                  <p className="vehicle-main-id">{v.vehicleId}</p>
                  <p className="vehicle-route">
                    <span className="material-icons">trip_origin</span>{v.source}
                    <span className="material-icons route-arrow">trending_flat</span>
                    <span className="material-icons">location_on</span>{v.destination}
                  </p>
                  <div className="vehicle-sub-details">
                    <span><span className="material-icons detail-icon">directions_bus</span>{v.model}</span>
                    <span><span className="material-icons detail-icon">group</span>Capacity: {v.capacity}</span>
                  </div>
                </div>
                <div className="card-actions">
                    {/* The new QR Code button is added here */}
                    <button className="icon-btn qr-btn" onClick={() => handleShowQR(v)} title="Show QR Code">
                        <span className="material-icons">qr_code_scanner</span>
                    </button>
                    <button className="icon-btn edit-btn" onClick={() => handleEditClick(v)} title="Edit Route">
                        <span className="material-icons">edit</span>
                    </button>
                    <button className="icon-btn delete-btn" onClick={() => handleDelete(v._id)} title="Delete Vehicle">
                        <span className="material-icons">delete_outline</span>
                    </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Edit Route Modal */}
      <Modal show={showEditModal} onHide={handleCloseModal} centered>
        <Modal.Header closeButton>
          <Modal.Title>Edit Route for {editingVehicle?.vehicleId}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <div className="form-group">
            <label htmlFor="editSource">Source</label>
            <input 
              type="text" 
              id="editSource" 
              className="form-control"
              value={editingVehicle?.source || ''}
              onChange={(e) => setEditingVehicle({...editingVehicle, source: e.target.value})}
            />
          </div>
          <div className="form-group">
            <label htmlFor="editDestination">Destination</label>
            <input 
              type="text" 
              id="editDestination" 
              className="form-control"
              value={editingVehicle?.destination || ''}
              onChange={(e) => setEditingVehicle({...editingVehicle, destination: e.target.value})}
            />
          </div>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={handleCloseModal}>Close</Button>
          <Button variant="primary" onClick={handleUpdateSubmit}>Save Changes</Button>
        </Modal.Footer>
      </Modal>

      {/* QR Code Modal */}
      {selectedVehicleForQR && (
        <Modal show={showQRModal} onHide={handleCloseQRModal} centered>
          <Modal.Header closeButton>
            <Modal.Title>QR Code for {selectedVehicleForQR.vehicleId}</Modal.Title>
          </Modal.Header>
          <Modal.Body className="qr-modal-body">
            <h5>{selectedVehicleForQR.model}</h5>
            <div className="qr-code-wrapper">
              <QRCode
                value={`https://your-app-domain.com/pay?vehicle=${selectedVehicleForQR._id}`}
                size={220}
              />
            </div>
            <p>Passengers can scan this code to initiate payment for this vehicle.</p>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={handleCloseQRModal}>Close</Button>
            <Button variant="primary" onClick={handlePrintQR}>
              <span className="material-icons" style={{ fontSize: '1rem', marginRight: '0.5rem' }}>print</span>
              Print
            </Button>
          </Modal.Footer>
        </Modal>
      )}
    </AdminLayout>
  );
}

export default VehicleManagementPage;