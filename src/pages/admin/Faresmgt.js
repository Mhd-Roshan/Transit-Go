import React, { useState, useEffect } from "react"; 
import { Spinner } from "react-bootstrap";
import AdminLayout from "../../layouts/AdminLayout";
import API from "../../api"; // Import the new API client
import "../../styles/fares.css"; 

function Faresmgt() {
  const [reportData, setReportData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [allVehicles, setAllVehicles] = useState([]);
  const [allOperators, setAllOperators] = useState([]);
  const [filters, setFilters] = useState({
    startDate: '',
    endDate: '',
    vehicleId: '',
    operatorId: ''
  });

  useEffect(() => {
    const fetchFilterData = async () => {
      try {
        const [vehiclesRes, usersRes] = await Promise.all([
          API.get("/vehicles"),
          API.get("/users"),
        ]);
        setAllVehicles(vehiclesRes.data);
        setAllOperators(usersRes.data.filter(u => u.role === 'Operator'));
      } catch (err) {
        setError("Failed to load filter options.");
      }
    };
    fetchFilterData();
  }, []);

  useEffect(() => {
    const fetchRevenueReport = async () => {
      setLoading(true);
      setError("");
      try {
        const params = {
          startDate: filters.startDate || undefined,
          endDate: filters.endDate || undefined,
          vehicleId: filters.vehicleId || undefined,
          operatorId: filters.operatorId || undefined,
        };

        const res = await API.get(`/dashboard/revenue-report`, { params });
        setReportData(res.data);
      } catch (err) {
        setError("Failed to fetch revenue report.");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchRevenueReport();
  }, [filters]);

  const handleFilterChange = (e) => {
    setFilters({ ...filters, [e.target.name]: e.target.value });
  };
  
  const resetFilters = () => {
    setFilters({ startDate: '', endDate: '', vehicleId: '', operatorId: '' });
  };

  const totalFilteredRevenue = reportData.reduce((sum, item) => sum + item.amount, 0);

  return (
    <AdminLayout>
      <div className="fare-management-page animate-fade-in">
        <h2 className="page-title">Revenue Report</h2>
        <p className="page-subtitle">Review passenger trip payments and operator cash collections.</p>
        
        <div className="filter-card">
          <div className="filter-grid">
            <div className="form-group">
              <label htmlFor="startDate">Start Date</label>
              <input type="date" id="startDate" name="startDate" value={filters.startDate} onChange={handleFilterChange} />
            </div>
            <div className="form-group">
              <label htmlFor="endDate">End Date</label>
              <input type="date" id="endDate" name="endDate" value={filters.endDate} onChange={handleFilterChange} />
            </div>
            <div className="form-group">
              <label htmlFor="vehicleId">Filter by Vehicle</label>
              <select id="vehicleId" name="vehicleId" value={filters.vehicleId} onChange={handleFilterChange}>
                <option value="">All Vehicles</option>
                {allVehicles.map(v => <option key={v._id} value={v._id}>{v.vehicleId} - {v.model}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label htmlFor="operatorId">Filter by Operator</label>
              <select id="operatorId" name="operatorId" value={filters.operatorId} onChange={handleFilterChange}>
                <option value="">All Operators</option>
                {allOperators.map(op => <option key={op._id} value={op._id}>{op.fullName}</option>)}
              </select>
            </div>
          </div>
          <div className="filter-actions">
            <div className="revenue-total">
              <span className="total-label">Filtered Revenue</span>
              <span className="total-amount">₹{totalFilteredRevenue.toLocaleString('en-IN', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</span>
            </div>
            <button className="reset-btn" onClick={resetFilters}>
              <span className="material-icons">refresh</span> Reset Filters
            </button>
          </div>
        </div>

        <h3 className="section-title">Revenue Records</h3>
        {loading ? (
          <div className="loading-text"><Spinner animation="border" /></div>
        ) : error ? (
          <p className="error-message">{error}</p>
        ) : reportData.length === 0 ? (
          <div className="empty-state">
            <span className="material-icons empty-icon">receipt_long</span>
            <h4 className="empty-title">No Revenue Found</h4>
            <p className="empty-subtitle">No records match your current filters. Try expanding your date range.</p>
          </div>
        ) : (
          <div className="collections-list">
            {reportData.map((item, index) => {
              const isPayment = item.type === 'Passenger Payment';
              return (
                <div 
                  key={item._id} 
                  className={`collection-card ${isPayment ? 'passenger-payment' : 'operator-collection'}`} 
                  style={{ animationDelay: `${index * 30}ms` }}
                >
                  <div className="collection-card-icon">
                    <span className="material-icons">
                      {isPayment ? 'credit_card' : 'payments'}
                    </span>
                  </div>
                  <div className="collection-info">
                    <p className="main-detail">
                        {item.description}{isPayment && item.vehicleId 
                            ? ` (Vehicle: ${item.vehicleId})` 
                            : ''}
                    </p>
                    <p className="sub-detail">
                      By: {item.userName || 'N/A'}
                      {' • '}
                      {/* --- THIS IS THE DATE FORMAT FIX --- */}
                      {new Date(item.date).toLocaleDateString('en-GB')}
                    </p>
                  </div>
                  <div className="collection-amount">
                    ₹{item.amount.toLocaleString('en-IN')}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </AdminLayout>
  );
}

export default Faresmgt;