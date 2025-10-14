import React, { useState, useEffect } from "react";
import axios from "axios";
import AdminLayout from "../../layouts/AdminLayout";
import "../../styles/fares.css"; 

function Faresmgt() {
  const [collections, setCollections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // --- NEW: State for filters and their dropdown data ---
  const [allVehicles, setAllVehicles] = useState([]);
  const [allOperators, setAllOperators] = useState([]);
  const [filters, setFilters] = useState({
    startDate: '',
    endDate: '',
    vehicleId: '',
    operatorId: ''
  });

  // Fetch initial data for filter dropdowns (vehicles & operators)
  useEffect(() => {
    const fetchFilterData = async () => {
      const token = localStorage.getItem("token");
      const headers = { Authorization: `Bearer ${token}` };
      try {
        const [vehiclesRes, usersRes] = await Promise.all([
          axios.get("http://localhost:5000/api/vehicles", { headers }),
          axios.get("http://localhost:5000/api/users", { headers }),
        ]);
        setAllVehicles(vehiclesRes.data);
        setAllOperators(usersRes.data.filter(u => u.role === 'Operator'));
      } catch (err) {
        setError("Failed to load filter options.");
      }
    };
    fetchFilterData();
  }, []);

  // Fetch collections whenever a filter changes
  useEffect(() => {
    const fetchCollections = async () => {
      setLoading(true);
      setError("");
      try {
        const token = localStorage.getItem("token");
        const params = {
          startDate: filters.startDate || undefined,
          endDate: filters.endDate || undefined,
          vehicleId: filters.vehicleId || undefined,
          operatorId: filters.operatorId || undefined,
        };

        const res = await axios.get(`http://localhost:5000/api/collections`, {
          headers: { Authorization: `Bearer ${token}` },
          params,
        });
        setCollections(res.data);
      } catch (err) {
        setError("Failed to fetch collections.");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchCollections();
  }, [filters]);

  const handleFilterChange = (e) => {
    setFilters({ ...filters, [e.target.name]: e.target.value });
  };
  
  const resetFilters = () => {
    setFilters({ startDate: '', endDate: '', vehicleId: '', operatorId: '' });
  };

  const totalFilteredRevenue = collections.reduce((sum, item) => sum + item.amount, 0);

  return (
    <AdminLayout>
      <div className="fare-management-page animate-fade-in">
        <h2 className="page-title">Fare Collections</h2>
        <p className="page-subtitle">Review and filter all daily revenue from each vehicle.</p>
        
        {/* --- NEW: Advanced Filter Card --- */}
        <div className="filter-card">
          <div className="filter-grid">
            <div className="form-group">
              <label htmlFor="startDate">Start Date</label>
              <input type="date" name="startDate" value={filters.startDate} onChange={handleFilterChange} />
            </div>
            <div className="form-group">
              <label htmlFor="endDate">End Date</label>
              <input type="date" name="endDate" value={filters.endDate} onChange={handleFilterChange} />
            </div>
            <div className="form-group">
              <label htmlFor="vehicleId">Filter by Vehicle</label>
              <select name="vehicleId" value={filters.vehicleId} onChange={handleFilterChange}>
                <option value="">All Vehicles</option>
                {allVehicles.map(v => <option key={v._id} value={v._id}>{v.vehicleId} - {v.model}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label htmlFor="operatorId">Filter by Operator</label>
              <select name="operatorId" value={filters.operatorId} onChange={handleFilterChange}>
                <option value="">All Operators</option>
                {allOperators.map(op => <option key={op._id} value={op._id}>{op.fullName}</option>)}
              </select>
            </div>
          </div>
          <div className="filter-actions">
            <div className="revenue-total">
              <span className="total-label">Filtered Revenue</span>
              <span className="total-amount">₹{totalFilteredRevenue.toLocaleString('en-IN')}</span>
            </div>
            <button className="reset-btn" onClick={resetFilters}>Reset Filters</button>
          </div>
        </div>

        <h3 className="section-title">Collection Records</h3>
        {loading ? (
          <p className="loading-text">Loading collections...</p>
        ) : error ? (
          <p className="error-message">{error}</p>
        ) : collections.length === 0 ? (
          <div className="empty-state">
            <span className="material-icons empty-icon">search_off</span>
            <h4 className="empty-title">No Collections Found</h4>
            <p className="empty-subtitle">Try adjusting your filters or wait for new collections to be submitted.</p>
          </div>
        ) : (
          <div className="collections-list">
            {collections.map((collection, index) => (
              <div key={collection._id} className="collection-card" style={{ animationDelay: `${index * 50}ms` }}>
                <div className="collection-info">
                  <p className="vehicle-id">{collection.vehicle?.vehicleId || "N/A"}</p>
                  <div className="sub-details">
                    <p className="operator-name">
                      <span className="material-icons">person</span>
                      {collection.operator?.fullName || "N/A"}
                    </p>
                    <p className="collection-date">
                      <span className="material-icons">event</span>
                      {new Date(collection.collectionDate).toLocaleDateString('en-GB')}
                    </p>
                  </div>
                </div>
                <div className="amount-section">
                  <p className="collection-amount">₹{collection.amount.toLocaleString('en-IN')}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </AdminLayout>
  );
}

export default Faresmgt;