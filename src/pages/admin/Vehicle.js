import React, { useState, useEffect } from "react";
import { Modal, Button } from "react-bootstrap";
import QRCode from "react-qr-code";
import AdminLayout from "../../layouts/AdminLayout";
import API from "../../api"; // Import the new API client
import "../../styles/vehicle.css";

function VehicleManagementPage() {
  const [vehicles, setVehicles] = useState([]);
  const [vehicleId, setVehicleId] = useState("");
  const [model, setModel] = useState("");
  const [capacity, setCapacity] = useState("");
  const [source, setSource] = useState("");
  const [destination, setDestination] = useState("");
  const [registrationDate, setRegistrationDate] = useState("");

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [vehicleIdError, setVehicleIdError] = useState("");
  
  const [editMode, setEditMode] = useState(false);
  const [currentVehicleDbId, setCurrentVehicleDbId] = useState(null);

  const [showEditModal, setShowEditModal] = useState(false);
  const [editingVehicle, setEditingVehicle] = useState(null);
  const [showQRModal, setShowQRModal] = useState(false);
  const [selectedVehicleForQR, setSelectedVehicleForQR] = useState(null);

  const fetchVehicles = async () => {
    setLoading(true);
    setError("");
    try {
      // Use the new API client
      const res = await API.get("/vehicles");
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
  
  const formatDateForInput = (dateString) => {
    if (!dateString) return "";
    return new Date(dateString).toISOString().split('T')[0];
  };

  const clearForm = () => {
    setVehicleId(""); setModel(""); setCapacity("");
    setSource(""); setDestination(""); setRegistrationDate("");
    setVehicleIdError(""); setEditMode(false); setCurrentVehicleDbId(null); setError("");
  };

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
  
  const handleVehicleIdBlur = () => {
    if (!vehicleId || vehicleIdError) return;
    const existingVehicle = vehicles.find(v => v.vehicleId === vehicleId);
    if (existingVehicle) {
      setModel(existingVehicle.model); setCapacity(existingVehicle.capacity);
      setSource(existingVehicle.source); setDestination(existingVehicle.destination);
      setRegistrationDate(formatDateForInput(existingVehicle.registrationDate));
      setEditMode(true); setCurrentVehicleDbId(existingVehicle._id);
    } else {
      setModel(""); setCapacity(""); setSource(""); setDestination("");
      setRegistrationDate(""); setEditMode(false); setCurrentVehicleDbId(null);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (vehicleIdError) return;
    if (!vehicleId || !model || !capacity || !registrationDate) {
      setError("Vehicle ID, Model, Capacity, and Registration Date are required.");
      return;
    }
    setIsSubmitting(true);
    setError("");
    
    const vehicleData = { vehicleId, model, capacity, source, destination, registrationDate };

    try {
      if (editMode) {
        // Use the new API client
        const res = await API.put(`/vehicles/${currentVehicleDbId}`, vehicleData);
        setVehicles(vehicles.map(v => v._id === currentVehicleDbId ? res.data : v));
      } else {
        // Use the new API client
        const res = await API.post("/vehicles", vehicleData);
        setVehicles([res.data, ...vehicles]);
      }
      clearForm();
    } catch (err) {
      setError(err.response?.data?.msg || `Failed to ${editMode ? 'update' : 'register'} vehicle.`);
    } finally {
      setIsSubmitting(false);
    }
  };


  const handleEditClick = (vehicle) => {
    const regDate = vehicle.registrationDate ? new Date(vehicle.registrationDate).toISOString().split('T')[0] : '';
    setEditingVehicle({ ...vehicle, registrationDate: regDate });
    setShowEditModal(true);
  };

  const handleCloseModal = () => {
    setShowEditModal(false); setEditingVehicle(null);
  };

  const handleUpdateSubmit = async () => {
    if (!editingVehicle) return;
    try {
        const updatedData = { 
          source: editingVehicle.source, destination: editingVehicle.destination, 
          model: editingVehicle.model, capacity: editingVehicle.capacity,
          status: editingVehicle.status, registrationDate: editingVehicle.registrationDate
        };
        // Use the new API client
        const res = await API.put(`/vehicles/${editingVehicle._id}`, updatedData);
        setVehicles(vehicles.map(v => v._id === editingVehicle._id ? res.data : v));
        handleCloseModal();
    } catch (err) {
        console.error("Failed to update vehicle", err);
        alert("Failed to update vehicle details.");
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this vehicle? This action cannot be undone.")) {
      try {
        // Use the new API client
        await API.delete(`/vehicles/${id}`);
        setVehicles(vehicles.filter(v => v._id !== id));
      } catch (err) {
          setError("Failed to delete vehicle. It may be currently assigned to an operator.");
      }
    }
  };

  const handleShowQR = (vehicle) => { setSelectedVehicleForQR(vehicle); setShowQRModal(true); };
  const handleCloseQRModal = () => { setSelectedVehicleForQR(null); setShowQRModal(false); };
  const handlePrintQR = () => window.print();

  return (
    <AdminLayout>
      <div className="vehicle-management-page animate-fade-in">
        <h2 className="page-title">Vehicle Management</h2>
        <p className="page-subtitle">Add new vehicles and manage their routes and details.</p>
        
        <div className="form-card">
          {error && <p className="error-message">{error}</p>}
          <form onSubmit={handleSubmit}>
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="vehicleId">Vehicle ID / Number</label>
                <input type="text" id="vehicleId" value={vehicleId} onChange={handleVehicleIdChange} onBlur={handleVehicleIdBlur} className={vehicleIdError ? 'input-error' : ''} disabled={isSubmitting} />
                {vehicleIdError && <p className="input-error-message">{vehicleIdError}</p>}
                {editMode && <p className="input-error-message" style={{color: 'var(--admin-primary)'}}>Update mode: Modifying existing vehicle.</p>}
              </div>
              <div className="form-group"><label htmlFor="model">Vehicle Model</label><input type="text" id="model" value={model} onChange={(e) => setModel(e.target.value)} disabled={isSubmitting} /></div>
              <div className="form-group"><label htmlFor="capacity">Capacity</label><input type="number" id="capacity" value={capacity} onChange={(e) => setCapacity(e.target.value)} disabled={isSubmitting} /></div>
            </div>
            <div className="form-row">
              <div className="form-group"><label htmlFor="source">Source</label><input type="text" id="source" value={source} onChange={(e) => setSource(e.target.value)} disabled={isSubmitting} /></div>
              <div className="form-group"><label htmlFor="destination">Destination</label><input type="text" id="destination" value={destination} onChange={(e) => setDestination(e.target.value)} disabled={isSubmitting} /></div>
              <div className="form-group"><label htmlFor="registrationDate">Registration Date</label><input type="date" id="registrationDate" value={registrationDate} onChange={(e) => setRegistrationDate(e.target.value)} disabled={isSubmitting} /></div>
            </div>
            <button type="submit" className="register-btn" disabled={isSubmitting}>
                <span className="material-icons">{editMode ? 'save' : 'add_circle'}</span>
                {isSubmitting ? "Submitting..." : (editMode ? "Update Vehicle Details" : "Register Vehicle")}
            </button>
          </form>
        </div>
        
        <h3 className="section-title">Assigned Vehicles</h3>
        {loading ? <p className="loading-text">Loading...</p> : (
          <div className="vehicles-list">
            {vehicles.map((v, index) => (
              <div key={v._id} className="vehicle-card" style={{ animationDelay: `${index * 50}ms` }}>
                <div className="vehicle-card-header">
                    <p className="vehicle-main-id">{v.vehicleId}</p>
                    <span className={`status-badge ${v.status ? v.status.toLowerCase().replace(/\s+/g, '-') : 'inactive'}`}>
                      {v.status || 'Inactive'}
                    </span>
                </div>
                <div className="vehicle-card-body">
                    <div className="vehicle-detail-item"><span className="material-icons detail-icon">category</span><span>{v.model}</span></div>
                    <div className="vehicle-detail-item"><span className="material-icons detail-icon">group</span><span>{v.capacity} Passengers</span></div>
                    <div className="vehicle-detail-item"><span className="material-icons detail-icon">event</span><span>Registered: {new Date(v.registrationDate).toLocaleDateString()}</span></div>
                    <div className="vehicle-detail-item route"><span className="material-icons detail-icon">trip_origin</span><span>{v.source || 'Not set'}</span><span className="material-icons route-arrow">east</span> <span className="material-icons detail-icon">flag</span><span>{v.destination || 'Not set'}</span></div>
                </div>
                <div className="card-actions"><button className="icon-btn" onClick={() => handleShowQR(v)} title="Show QR Code"><span className="material-icons">qr_code_2</span></button><button className="icon-btn" onClick={() => handleEditClick(v)} title="Edit Vehicle"><span className="material-icons">edit</span></button><button className="icon-btn delete-btn" onClick={() => handleDelete(v._id)} title="Delete Vehicle"><span className="material-icons">delete</span></button></div>
              </div>
            ))}
          </div>
        )}
      </div>

      <Modal show={showEditModal} onHide={handleCloseModal} centered>
        <Modal.Header closeButton><Modal.Title>Edit Vehicle: {editingVehicle?.vehicleId}</Modal.Title></Modal.Header>
        <Modal.Body>
          <div className="form-group mb-3"><label htmlFor="editModel">Vehicle Model</label><input type="text" id="editModel" className="form-control" value={editingVehicle?.model || ''} onChange={(e) => setEditingVehicle({...editingVehicle, model: e.target.value})}/></div>
          <div className="form-group mb-3"><label htmlFor="editCapacity">Capacity</label><input type="number" id="editCapacity" className="form-control" value={editingVehicle?.capacity || ''} onChange={(e) => setEditingVehicle({...editingVehicle, capacity: e.target.value})}/></div>
          <div className="form-group mb-3"><label htmlFor="editRegDate">Registration Date</label><input type="date" id="editRegDate" className="form-control" value={editingVehicle?.registrationDate || ''} onChange={(e) => setEditingVehicle({...editingVehicle, registrationDate: e.target.value})}/></div>
          <div className="form-group mb-3"><label htmlFor="editSource">Source</label><input type="text" id="editSource" className="form-control" value={editingVehicle?.source || ''} onChange={(e) => setEditingVehicle({...editingVehicle, source: e.target.value})}/></div>
          <div className="form-group mb-3"><label htmlFor="editDestination">Destination</label><input type="text" id="editDestination" className="form-control" value={editingVehicle?.destination || ''} onChange={(e) => setEditingVehicle({...editingVehicle, destination: e.target.value})}/></div>
          <div className="form-group"><label htmlFor="editStatus">Status</label>
            <select id="editStatus" className="form-control" value={editingVehicle?.status || 'Active'} onChange={(e) => setEditingVehicle({...editingVehicle, status: e.target.value})}>
                <option value="Active">Active</option>
                <option value="Under Maintenance">Under Maintenance</option>
                <option value="Inactive">Inactive</option>
            </select>
          </div>
        </Modal.Body>
        <Modal.Footer><Button variant="secondary" onClick={handleCloseModal}>Close</Button><Button variant="primary" onClick={handleUpdateSubmit}>Save Changes</Button></Modal.Footer>
      </Modal>

      {selectedVehicleForQR && (<Modal show={showQRModal} onHide={handleCloseQRModal} centered><Modal.Header closeButton><Modal.Title>QR Code for {selectedVehicleForQR.vehicleId}</Modal.Title></Modal.Header><Modal.Body className="qr-modal-body"><h5>{selectedVehicleForQR.model}</h5><div className="qr-code-wrapper"><QRCode value={`${window.location.origin}/pay?vehicle=${selectedVehicleForQR._id}`} size={220} /></div><p>Passengers can scan this code to initiate payment for this vehicle.</p></Modal.Body><Modal.Footer><Button variant="secondary" onClick={handleCloseQRModal}>Close</Button><Button variant="primary" onClick={handlePrintQR}><span className="material-icons" style={{ fontSize: '1rem', marginRight: '0.5rem' }}>print</span>Print</Button></Modal.Footer></Modal>)}
    </AdminLayout>
  );
}

export default VehicleManagementPage;