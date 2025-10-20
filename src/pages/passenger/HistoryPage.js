import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { Spinner } from 'react-bootstrap';
import PassengerLayout from '../../layouts/PassengerLayout';
import '../../styles/history.css';

function HistoryPage() {
  const navigate = useNavigate();
  const [trips, setTrips] = useState([]);
  const [filteredTrips, setFilteredTrips] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      navigate('/login');
      return;
    }
    const fetchData = async () => {
      setLoading(true);
      setError('');
      try {
        const tripRes = await axios.get("http://localhost:5000/api/trips/my-trips", {
          headers: { Authorization: `Bearer ${token}` }
        });
        const data = Array.isArray(tripRes.data) ? tripRes.data : [];
        setTrips(data);
        setFilteredTrips(data);
      } catch (err) {
        setError('Failed to load trip history.');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [navigate]);

  useEffect(() => {
    const results = trips.filter(trip =>
      (trip.destination && trip.destination.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (trip.origin && trip.origin.toLowerCase().includes(searchTerm.toLowerCase()))
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
          <p className="empty-title">No Trip History</p>
          <p className="empty-subtitle">Your past trips will appear here once you travel.</p>
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
            {/* --- THIS IS THE FIX --- */}
            {/* Use `trip.amountPaid` if it exists, otherwise fall back to `trip.fare`. */}
            {/* Also, provide a default of 0 to prevent crashes if neither exists. */}
            <div className="trip-card-fare">
              <span>₹{(trip.amountPaid || trip.fare || 0).toFixed(2)}</span>
            </div>
          </div>
        ))}
      </div>
    );
  };

  return (
    <PassengerLayout>
      <div className="history-page">
        <main className="history-main">
          <section className="history-header">
            <div className="title-group">
              <h1 className="page-title">Trip History</h1>
              <p className="page-subtitle">View your past trips and their details.</p>
            </div>
            <div className="search-wrapper">
              <span className="material-icons">search</span>
              <input 
                id="search" name="search" placeholder="Search by destination..." type="text"
                value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </section>
          
          <section className="history-content">
            <h2 className="section-title">Recent Trips</h2>
            {renderTripContent()}
          </section>
        </main>
      </div>
    </PassengerLayout>
  );
}

export default HistoryPage;