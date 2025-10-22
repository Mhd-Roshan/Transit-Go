import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Spinner } from 'react-bootstrap';
import PassengerLayout from '../../layouts/PassengerLayout';
import API from '../../api';
import '../../styles/timings.css';

function TimingsPage() {
  const [liveBuses, setLiveBuses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const navigate = useNavigate();
  const pollingIntervalRef = useRef(null);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      navigate('/login');
      return;
    }

    const fetchLiveBuses = async (isInitialLoad = false) => {
      if (isInitialLoad) setLoading(true);
      setError('');
      try {
        const res = await API.get("/vehicles/live");
        setLiveBuses(res.data);
      } catch (err) {
        console.error("Failed to load live bus data:", err);
        setError(`Failed to load live bus data. Please try again later.`);
        clearInterval(pollingIntervalRef.current); // Stop polling on error
      } finally {
        if (isInitialLoad) setLoading(false);
      }
    };

    fetchLiveBuses(true); // Initial fetch with loading indicator

    // --- FIX: Set up polling to fetch live data every 15 seconds ---
    pollingIntervalRef.current = setInterval(() => {
      fetchLiveBuses(false); // Subsequent fetches without loading indicator
    }, 15000); // Poll every 15 seconds

    // Cleanup function: clear interval when component unmounts
    return () => clearInterval(pollingIntervalRef.current);

  }, [navigate]);

  const filteredBuses = useMemo(() => 
    liveBuses.filter(bus =>
      (bus.model && bus.model.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (bus.destination && bus.destination.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (bus.vehicleId && bus.vehicleId.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (bus.currentLocation && bus.currentLocation.toLowerCase().includes(searchTerm.toLowerCase()))
    ),
    [liveBuses, searchTerm]
  );

  const renderContent = () => {
    if (loading) {
      return <div className="loading-indicator"><Spinner animation="border" variant="primary" /></div>;
    }
    if (error) {
      return <div className="error-banner">{error}</div>;
    }
    if (filteredBuses.length === 0) {
      return (
        <div className="empty-state">
            <span className="material-icons empty-icon">bus_alert</span>
            <h4>No Buses Currently On Route</h4>
            <p>{searchTerm ? "No running buses match your search." : "Check back later to see live bus locations."}</p>
        </div>
      );
    }
    return (
      <div className="bus-list">
        {filteredBuses.map((bus, index) => (
            <div key={bus._id} className="bus-card" style={{ animationDelay: `${index * 50}ms` }}>
              <div className="bus-details">
                <div className="bus-info">
                  <h4>{bus.model} ({bus.vehicleId})</h4>
                  <p>From: <strong>{bus.source}</strong> To: <strong>{bus.destination}</strong></p>
                </div>
                <div className="departure-info">
                  <span className="departs-at">Current Location:</span>
                  <span className="departure-time">{bus.currentLocation}</span>
                </div>
              </div>
              <div className={`status-badge on-time`}>On Route</div>
            </div>
          )
        )}
      </div>
    );
  };

  return (
    <PassengerLayout>
      <div className="timings-page">
        <main className="timings-main">
          <section className="schedules-section animate-fade-in">
            <div className="schedules-header">
              <div className="schedules-title-group">
                <h2>Live Bus Tracker</h2>
                <p>Find real-time locations for all buses currently on route.</p>
              </div>
              <div className="search-bar">
                <span className="material-icons">search</span>
                <input 
                  type="text" 
                  placeholder="Search by ID, model, or location..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
            
            <div className="schedules-content">
              <h3>Buses In Service</h3>
              {renderContent()}
            </div>
          </section>
        </main>
      </div>
    </PassengerLayout>
  );
}

export default TimingsPage;