import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { Spinner } from 'react-bootstrap';
import  jwtDecode  from 'jwt-decode';
// header and bottom nav now provided by PassengerLayout
import PassengerLayout from '../../layouts/PassengerLayout';
import '../../styles/history.css';

function HistoryPage() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [trips, setTrips] = useState([]);
  const [filteredTrips, setFilteredTrips] = useState([]);
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      navigate('/');
      return;
    }

    try {
      const decodedToken = jwtDecode(token);
      setUser({ name: decodedToken.user.fullName });
    } catch (err) {
      console.error("Invalid token:", err);
      navigate('/');
    }

    const fetchData = async () => {
      setLoading(true);
      setError('');
      try {
        // --- THIS IS THE FIX: Ports changed from 3000 to 5000 ---
        const [tripRes, reportRes] = await Promise.all([
          axios.get("http://localhost:5000/api/trips/my-trips", { headers: { Authorization: `Bearer ${token}` } }),
          axios.get("http://localhost:5000/api/reports/my-reports", { headers: { Authorization: `Bearer ${token}` } })
        ]);
        setTrips(tripRes.data);
        setFilteredTrips(tripRes.data);
        setReports(reportRes.data);
      } catch (err) {
        setError('Failed to load history.');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [navigate]);

  useEffect(() => {
    const results = trips.filter(trip =>
      new Date(trip.tripDate).toLocaleDateString().includes(searchTerm) ||
      (trip.destination && trip.destination.toLowerCase().includes(searchTerm.toLowerCase()))
    );
    setFilteredTrips(results);
  }, [searchTerm, trips]);

  const renderTripContent = () => {
    if (loading) {
      return <div className="status-indicator"><Spinner animation="border" variant="primary" /></div>;
    }
    if (error) {
      return <div className="status-indicator error">{error}</div>;
    }
    if (filteredTrips.length === 0 && searchTerm === '') {
      return (
        <div className="empty-state">
          <span className="material-icons">history</span>
          <p className="empty-title">No recent trips</p>
          <p className="empty-subtitle">Your past trips will appear here.</p>
        </div>
      );
    }
    if (filteredTrips.length === 0 && searchTerm !== '') {
        return <p className="status-indicator">No trips found matching your search.</p>;
    }
    return (
      <div className="trip-list">
        {filteredTrips.map(trip => (
          <div key={trip._id} className="trip-card">
            <div className="trip-card-icon"><span className="material-icons">directions_bus</span></div>
            <div className="trip-card-details">
              <h4>{trip.origin || 'Start'} to {trip.destination}</h4>
              <p>{new Date(trip.tripDate).toDateString()}</p>
            </div>
            <div className="trip-card-fare"><span>₹{trip.fare.toFixed(2)}</span></div>
          </div>
        ))}
      </div>
    );
  };

  return (
    <PassengerLayout>
      <div className="history-page">
        <main className="history-main">
        <h1 className="page-title">Trips</h1>
        <p className="page-subtitle">View your past trips and their details.</p>
        <div className="search-container">
          <div className="search-wrapper">
            <span className="material-icons">search</span>
            <input 
              id="search" name="search" placeholder="Search by date or destination" type="text"
              value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
        <div className="history-content">
          <h2 className="section-title">Recent Trips</h2>
          {renderTripContent()}
        </div>
        
        <div className="history-content">
          <h2 className="section-title">My Reports</h2>
          {loading ? null : reports.length > 0 ? (
            <div className="report-history-list">
              {reports.map(report => (
                <div key={report._id} className="report-history-card">
                  <div className="report-header">
                    <p>Status: <span className={`status-pill ${report.status.toLowerCase()}`}>{report.status}</span></p>
                  </div>
                  <p><strong>Your Report:</strong> {report.description}</p>
                  {report.reply && (
                    <div className="admin-reply">
                      <strong>Admin Reply:</strong>
                      <p>{report.reply.message}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <p>You have not submitted any reports.</p>
          )}
        </div>
        </main>
      </div>
    </PassengerLayout>
  );
}

export default HistoryPage;