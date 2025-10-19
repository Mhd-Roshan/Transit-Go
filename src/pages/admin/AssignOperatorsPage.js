import React, { useState, useEffect, useMemo } from "react";
import axios from "axios";
import AdminLayout from "../../layouts/AdminLayout";
import "../../styles/assignOperators.css";

function AssignOperatorsPage() {
  const [allOperators, setAllOperators] = useState([]);
  const [allVehicles, setAllVehicles] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [selectedOperator, setSelectedOperator] = useState("");
  const [selectedVehicle, setSelectedVehicle] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState("");

  const clearMessages = () => {
    setError("");
    setSuccess("");
  };

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError("");
      const token = localStorage.getItem("token");
      const headers = { Authorization: `Bearer ${token}` };
      
      try {
        const [userRes, vehicleRes, assignmentRes] = await Promise.all([
          axios.get("http://localhost:5000/api/users", { headers }),
          axios.get("http://localhost:5000/api/vehicles", { headers }),
          axios.get("http://localhost:5000/api/assignments", { headers }),
        ]);
        
        const operators = userRes.data.filter(u => u.role === "Operator" && u.status === "Approved");
        
        setAllOperators(operators);
        setAllVehicles(vehicleRes.data);
        setAssignments(assignmentRes.data);

      } catch (err) {
        setError("Failed to load data. Please ensure the server is running.");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleAssign = async () => {
    setIsSubmitting(true);
    clearMessages();
    try {
      const token = localStorage.getItem("token");
      const res = await axios.post(
        "http://localhost:5000/api/assignments",
        { operatorId: selectedOperator, vehicleId: selectedVehicle },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setAssignments([res.data, ...assignments]);
      setSuccess("Assignment created successfully!");
      setSelectedVehicle("");
      setSelectedOperator("");
    } catch (err) {
      setError(err.response?.data?.msg || "Failed to create assignment.");
    } finally {
      setIsSubmitting(false);
      setTimeout(clearMessages, 3000);
    }
  };

  const handleRemove = async (assignmentIdToRemove) => {
    if (window.confirm("Are you sure you want to remove this assignment?")) {
      const originalAssignments = [...assignments];
      setAssignments(assignments.filter(a => a._id !== assignmentIdToRemove));
      try {
        const token = localStorage.getItem("token");
        await axios.delete(`http://localhost:5000/api/assignments/${assignmentIdToRemove}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
      } catch (err) {
        setAssignments(originalAssignments);
        setError("Failed to remove assignment. Please try again.");
        setTimeout(clearMessages, 3000);
      }
    }
  };

  const availableVehicles = useMemo(() => {
    const assignedIds = new Set(assignments.filter(a => a.vehicle).map(a => String(a.vehicle._id)));
    return allVehicles.filter(v => !assignedIds.has(String(v._id)));
  }, [allVehicles, assignments]);
  
  const availableOperators = useMemo(() => {
    const assignedIds = new Set(assignments.filter(a => a.operator).map(a => String(a.operator._id)));
    return allOperators.filter(op => !assignedIds.has(String(op._id)));
  }, [allOperators, assignments]);

  const isFormInvalid = !selectedVehicle || !selectedOperator;

  return (
    <AdminLayout>
      <div className="assign-operators-page animate-fade-in">
        <h2 className="page-title">Assignment Hub</h2>
        <p className="page-subtitle">Pair available operators with vehicles to create active routes.</p>
        
        {error && <div className="error-banner">{error}</div>}
        {success && <div className="success-banner">{success}</div>}
        
        <div className="assignment-creator-card">
            <div className="creator-column">
                <h4 className="column-title">
                    <span className="material-icons">engineering</span> Available Operators
                </h4>
                <div className="selectable-list">
                    {availableOperators.length > 0 ? availableOperators.map(op => (
                        <div key={op._id} className={`selectable-item ${selectedOperator === op._id ? 'selected' : ''}`} onClick={() => setSelectedOperator(op._id)}>
                            <img src={`https://i.pravatar.cc/150?u=${op._id}`} alt="Operator" className="item-avatar"/>
                            <span>{op.fullName}</span>
                        </div>
                    )) : <p className="empty-list-text">No operators available.</p>}
                </div>
            </div>

            <div className="assignment-actions">
                <button className="assign-btn" onClick={handleAssign} disabled={isFormInvalid || isSubmitting}>
                    <span className="material-icons">{isSubmitting ? 'sync' : 'link'}</span>
                </button>
            </div>

            <div className="creator-column">
                <h4 className="column-title">
                    <span className="material-icons">directions_bus</span> Available Vehicles
                </h4>
                <div className="selectable-list">
                    {availableVehicles.length > 0 ? availableVehicles.map(v => (
                        <div key={v._id} className={`selectable-item ${selectedVehicle === v._id ? 'selected' : ''}`} onClick={() => setSelectedVehicle(v._id)}>
                            <span className="material-icons item-icon">directions_bus</span>
                            <span>{v.vehicleId} ({v.model})</span>
                        </div>
                    )) : <p className="empty-list-text">No vehicles available.</p>}
                </div>
            </div>
        </div>

        <h3 className="section-title">Current Assignments</h3>
        {loading ? <p className="loading-text">Loading assignments...</p> : assignments.length === 0 ? (
          <div className="empty-state">
            <span className="material-icons empty-icon">link_off</span>
            <h4 className="empty-title">No Operators Assigned</h4>
            <p className="empty-subtitle">Use the hub above to link an operator to a vehicle.</p>
          </div>
        ) : (
          <div className="assignments-list">
            {assignments
              .filter(a => a.operator && a.vehicle)
              .map((a, index) => {
                // --- THIS IS THE FIX ---
                // Create a date object and check its validity before rendering
                const assignmentDate = new Date(a.createdAt);
                const isValidDate = !isNaN(assignmentDate);

                return (
                  <div key={a._id} className="assignment-card" style={{ animationDelay: `${index * 50}ms` }}>
                    <div className="assignment-info operator">
                        <img src={`https://i.pravatar.cc/150?u=${a.operator._id}`} alt="Operator" className="operator-avatar"/>
                        <p className="operator-name">{a.operator.fullName}</p>
                    </div>
    
                    <div className="assignment-connector">
                        <span className="material-icons">east</span>
                    </div>
    
                    <div className="assignment-info vehicle">
                        <p className="vehicle-name">
                            <span className="material-icons">directions_bus</span> 
                            {a.vehicle.vehicleId} ({a.vehicle.model})
                        </p>
                        <p className="vehicle-route">
                            {a.vehicle.source} 
                            <span className="material-icons route-arrow">east</span> 
                            {a.vehicle.destination}
                        </p>
                        <p className="assignment-timestamp">
                            <span className="material-icons timestamp-icon">event</span>
                            {isValidDate 
                              ? `Assigned on ${assignmentDate.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}`
                              : 'Assigned just now'
                            }
                        </p>
                    </div>
                    
                    <button className="remove-btn" onClick={() => handleRemove(a._id)} title="Remove Assignment">
                      <span className="material-icons">delete</span>
                    </button>
                  </div>
                );
              })}
          </div>
        )}
      </div>
    </AdminLayout>
  );
}

export default AssignOperatorsPage;