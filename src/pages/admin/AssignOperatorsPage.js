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
        
        // --- THIS IS THE CRITICAL FIX ---
        // Only include operators who have been approved by an admin.
        const operators = userRes.data.filter(
          u => u.role === "Operator" && u.status === "Approved"
        );
        
        setAllOperators(operators);
        setAllVehicles(vehicleRes.data);
        setAssignments(assignmentRes.data);

      } catch (err) {
        setError("Failed to load data. Please ensure the server is running.");
        console.error("Data fetch error:", err);
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

  const handleVehicleSelect = (e) => {
    setSelectedVehicle(e.target.value);
    setSelectedOperator("");
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
    const assignedIds = new Set(
      assignments.filter(a => a.vehicle).map(a => String(a.vehicle._id))
    );
    return allVehicles.filter(v => !assignedIds.has(String(v._id)));
  }, [allVehicles, assignments]);
  
  const availableOperators = useMemo(() => {
    const assignedIds = new Set(
      assignments
        .filter(a => a.operator)
        .map(a => String(a.operator._id))
    );
    return allOperators.filter(op => !assignedIds.has(String(op._id)));
  }, [allOperators, assignments]);

  const isFormInvalid = !selectedVehicle || !selectedOperator;

  return (
    <AdminLayout>
      <div className="assign-operators-page animate-fade-in">
        <h2 className="page-title">Assign Operators</h2>
        <p className="page-subtitle">Create and manage links between operators and vehicles.</p>
        
        {error && <div className="error-banner">{error}</div>}
        {success && <div className="success-banner">{success}</div>}
        
        <div className="form-card">
          <div className="form-group">
            <label>Step 1: Select an available Vehicle</label>
            <select value={selectedVehicle} onChange={handleVehicleSelect} disabled={loading || isSubmitting}>
              <option value="">{loading ? "Loading..." : availableVehicles.length > 0 ? "Choose a vehicle..." : "No vehicles available"}</option>
              {availableVehicles.map(v => <option key={v._id} value={v._id}>{v.model} ({v.vehicleId})</option>)}
            </select>
          </div>

          {selectedVehicle && (
            <div className="form-group animate-slide-down">
              <label>Step 2: Select an available Operator</label>
              <select value={selectedOperator} onChange={(e) => setSelectedOperator(e.target.value)} disabled={loading || isSubmitting}>
                <option value="">{loading ? "Loading..." : availableOperators.length > 0 ? "Choose an operator..." : "No operators available"}</option>
                {availableOperators.map(op => <option key={op._id} value={op._id}>{op.fullName}</option>)}
              </select>
            </div>
          )}

          <button className="assign-btn" onClick={handleAssign} disabled={isFormInvalid || isSubmitting}>
            {isSubmitting ? "Assigning..." : "Assign Operator"}
          </button>
        </div>

        <h3 className="section-title">Current Assignments</h3>
        {loading ? <p className="loading-text">Loading assignments...</p> : assignments.length === 0 ? (
          <div className="empty-state">
            <span className="material-icons empty-icon">link_off</span>
            <h4 className="empty-title">No Operators Assigned</h4>
            <p className="empty-subtitle">Use the form above to link an operator to a vehicle.</p>
          </div>
        ) : (
          <div className="assignments-list">
            {assignments
              .filter(a => a.operator && a.vehicle)
              .map((a, index) => (
              <div key={a._id} className="assignment-card" style={{ animationDelay: `${index * 50}ms` }}>
                <img src={`https://i.pravatar.cc/150?u=${a.operator._id}`} alt="Operator" className="operator-avatar"/>
                <div className="assignment-info">
                  <p className="operator-name">{a.operator.fullName}</p>
                  <p className="vehicle-name">
                    <span className="material-icons">directions_bus</span>
                    {a.vehicle.model} ({a.vehicle.vehicleId})
                  </p>
                </div>
                <button className="remove-btn" onClick={() => handleRemove(a._id)} title="Remove Assignment">
                  <span className="material-icons">delete</span>
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </AdminLayout>
  );
}

export default AssignOperatorsPage;