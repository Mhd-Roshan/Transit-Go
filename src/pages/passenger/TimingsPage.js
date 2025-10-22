import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Spinner } from 'react-bootstrap';
import PassengerLayout from '../../layouts/PassengerLayout';
import API from '../../api'; // Import the new API client
import '../../styles/timings.css';

function TimingsPage() {
  const [routes, setRoutes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      navigate('/login');
      return;
    }

    const fetchActiveBuses = async () => {
      setLoading(true);
      setError('');
      try {
        // Use the new API client
        const res = await API.get("/assignments/active");
        setRoutes(res.data);
      } catch (err) {
        // The global error interceptor will handle 401s now.
        // We just need to handle the display of a user-friendly message.
        console.error("Failed to load bus schedules:", err);
        const status = err.response?.status;
        setError(`Failed to load bus schedules${status ? ` (HTTP ${status})` : ''}. Please try again later.`);
      } finally {
        setLoading(false);
      }
    };

    fetchActiveBuses();
  }, [navigate]);

  const filteredRoutes = useMemo(() => 
    routes.filter(route =>
      route.vehicle && (
          (route.vehicle.model && route.vehicle.model.toLowerCase().includes(searchTerm.toLowerCase())) ||
          (route.vehicle.destination && route.vehicle.destination.toLowerCase().includes(searchTerm.toLowerCase())) ||
          (route.vehicle.vehicleId && route.vehicle.vehicleId.toLowerCase().includes(searchTerm.toLowerCase()))
      )
    ),
    [routes, searchTerm]
  );

  const renderContent = () => {
    if (loading) {
      return <div className="loading-indicator"><Spinner animation="border" variant="primary" /></div>;
    }
    if (error) {
      return <div className="error-banner">{error}</div>;
    }
    if (filteredRoutes.length === 0) {
      return (
        <div className="empty-state">
            <span className="material-icons empty-icon">search_off</span>
            <h4>No Active Buses Found</h4>
            <p>{searchTerm ? "Try adjusting your search query." : "There are no buses assigned by an admin right now."}</p>
        </div>
      );
    }
    return (
      <div className="bus-list">
        {filteredRoutes.map((route, index) => {
          if (!route || !route.vehicle) return null;

          const diffMinutes = Math.round((new Date(route.departureTime) - new Date()) / 60000);
          const departsInText = diffMinutes <= 0 ? 'Departing' : `In ${diffMinutes} min`;

          return (
            <div key={route._id} className="bus-card" style={{ animationDelay: `${index * 50}ms` }}>
              <div className="bus-details">
                <div className="bus-info">
                  <h4>{route.vehicle?.model} ({route.vehicle?.vehicleId})</h4>
                  <p>From: <strong>{route.vehicle?.source}</strong> To: <strong>{route.vehicle?.destination}</strong></p>
                </div>
                <div className="departure-info">
                  <span className="departs-at">Departs at:</span>
                  <span className="departure-time">{new Date(route.departureTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                  <span className="departs-in">{departsInText}</span>
                </div>
              </div>
              <div className={`status-badge ${route.status.toLowerCase().replace(' ', '-')}`}>{route.status}</div>
            </div>
          );
        })}
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
                <h2>Bus Schedules</h2>
                <p>Find real-time schedules for all active routes.</p>
              </div>
              <div className="search-bar">
                <span className="material-icons">search</span>
                <input 
                  type="text" 
                  placeholder="Search buses..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
            
            <div className="schedules-content">
              <h3>All Active Buses</h3>
              {renderContent()}
            </div>
          </section>
        </main>
      </div>
    </PassengerLayout>
  );
}

export default TimingsPage;