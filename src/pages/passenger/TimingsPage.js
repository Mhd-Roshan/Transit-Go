import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { Spinner, Image } from 'react-bootstrap';
import jwtDecode from 'jwt-decode';
import PassengerBottomNav from '../../components/PassengerBottomNav';
import '../../styles/timings.css';

// Using the same Modern Header as the Home Page for consistency
const ModernPassengerHeader = ({ user, onLogout }) => (
  <div className="header-container">
    <header className="passenger-header">
      <div className="user-info">
        <Image src={`https://i.pravatar.cc/150?u=${user?.id}`} alt="User" className="profile-pic" roundedCircle />
        <div>
          <span>Welcome,</span>
          <h3>{user?.name || 'Passenger'}</h3>
        </div>
      </div>
      <button onClick={onLogout} className="header-action-btn" title="Logout">
        <span className="material-icons">logout</span>
      </button>
    </header>
  </div>
);

// --- NEW: Helper function to generate realistic, dynamic schedules ---
const generateSchedules = (routes) => {
  const now = new Date();
  let lastDeparture = new Date(now.getTime() + (Math.random() * 5 + 3) * 60000); // First bus in 3-8 mins

  return routes.map(() => {
    const statuses = ['On Time', 'On Time', 'On Time', 'Scheduled', 'Delayed'];
    const currentDeparture = new Date(lastDeparture.getTime());
    
    // Next bus departs in 10-25 minutes
    const interval = (Math.random() * 15 + 10) * 60000;
    lastDeparture = new Date(lastDeparture.getTime() + interval);
    
    return {
      departureTime: currentDeparture,
      status: statuses[Math.floor(Math.random() * statuses.length)],
    };
  });
};


function TimingsPage() {
  const [routes, setRoutes] = useState([]);
  // --- NEW: State to hold the generated schedule data ---
  const [schedules, setSchedules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const navigate = useNavigate();
  const [user, setUser] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      const decodedToken = jwtDecode(token);
      setUser({ name: decodedToken.user.fullName, id: decodedToken.user.id });
    } else {
      navigate('/login');
      return;
    }

    const fetchRoutes = async () => {
      setLoading(true);
      setError('');
      try {
        const res = await axios.get("http://localhost:5000/api/fares", {
          headers: { Authorization: `Bearer ${token}` }
        });
        setRoutes(res.data);
        // --- NEW: Generate schedules after fetching routes ---
        setSchedules(generateSchedules(res.data));
      } catch (err) {
        // ... (error handling remains the same)
        if (err.response && err.response.status === 401) { setError('Your session has expired. Please log in again.'); localStorage.removeItem('token'); setTimeout(() => navigate('/login'), 2000); } else { setError('Failed to load bus schedules.'); }
      } finally {
        setLoading(false);
      }
    };
    fetchRoutes();
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/login');
  };

  // --- UPDATED: The filter now returns both the route and its original index ---
  const filteredRoutes = useMemo(() => 
    routes
      .map((route, index) => ({ ...route, originalIndex: index })) // Keep track of original index
      .filter(route =>
        (route.routeName && route.routeName.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (route.endPoint && route.endPoint.toLowerCase().includes(searchTerm.toLowerCase()))
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
      // ... (empty state remains the same)
      return <div className="empty-state"><span className="material-icons empty-icon">search_off</span><h4>No Routes Found</h4><p>{searchTerm ? "Try adjusting your search." : "No bus schedules are available."}</p></div>;
    }
    return (
      <div className="bus-list">
        {filteredRoutes.map((route, index) => {
          // --- UPDATED: Get the correct schedule using the original index ---
          const schedule = schedules[route.originalIndex];
          if (!schedule) return null; // Safety check

          const diffMinutes = Math.round((schedule.departureTime - new Date()) / 60000);
          let departsInText = '';
          if (diffMinutes <= 0) {
            departsInText = 'Departed';
          } else if (diffMinutes === 1) {
            departsInText = 'In 1 min';
          } else {
            departsInText = `In ${diffMinutes} min`;
          }

          return (
            <div key={route._id} className="bus-card" style={{ animationDelay: `${index * 50}ms` }}>
              <div className="bus-details">
                <div className="bus-info">
                  <h4>{route.routeName}</h4>
                  <p>To: <strong>{route.endPoint}</strong></p>
                </div>
                {/* --- NEW: Departure time and countdown section --- */}
                <div className="departure-info">
                  <span className="departs-at">Departs at:</span>
                  <span className="departure-time">{schedule.departureTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                  <span className="departs-in">{departsInText}</span>
                </div>
              </div>
              <div className={`status-badge ${schedule.status.toLowerCase().replace(' ', '-')}`}>{schedule.status}</div>
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div className="timings-page">
      <ModernPassengerHeader user={user} onLogout={handleLogout} />
      
      <main className="timings-main">
        <section className="hero-section animate-fade-in">
          <h2>Bus Schedules</h2>
          <p>Find real-time schedules and route information.</p>
          <div className="search-bar">
            <span className="material-icons">search</span>
            <input 
              type="text" 
              placeholder="Search by route or destination..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </section>

        <section className="upcoming-buses animate-fade-in" style={{ animationDelay: '100ms' }}>
          <h3>Upcoming Buses</h3>
          {renderContent()}
        </section>
      </main>
      
      <PassengerBottomNav />
    </div>
  );
}

export default TimingsPage;