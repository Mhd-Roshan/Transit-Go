import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { Spinner } from 'react-bootstrap';
import PassengerLayout from '../../layouts/PassengerLayout';
import '../../styles/timings.css';

function TimingsPage() {
  const [routes, setRoutes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [fetchErrorDetails, setFetchErrorDetails] = useState(null);
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
        const res = await axios.get("http://localhost:5000/api/assignments/active", {
          headers: { Authorization: `Bearer ${token}` }
        });
        setRoutes(res.data);
      } catch (err) {
        // Capture detailed error information for debugging in UI
        const details = {
          status: err.response?.status ?? null,
          data: err.response?.data ?? null,
          message: err.message ?? String(err),
        };
        setFetchErrorDetails(details);

        if (details.status === 401) {
          setError('Your session has expired. Please log in again.');
          localStorage.removeItem('token');
          setTimeout(() => navigate('/login'), 2000);
        } else if (details.status) {
          console.error("Failed to load bus schedules:", details);
          setError(`Failed to load bus schedules (HTTP ${details.status}). Please try again later.`);
        } else {
          console.error("Failed to load bus schedules:", details);
          setError('Failed to load bus schedules. Please try again later.');
        }
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
          {/* --- FIX: Combined hero and list into a single section --- */}
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