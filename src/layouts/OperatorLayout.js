import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { Image } from 'react-bootstrap';
import { BsSignpostSplit } from "react-icons/bs";
import jwtDecode from 'jwt-decode';
import { TripProvider } from '../context/TripContext'; // Import the provider
import '../styles/opdashboard.css';

const OperatorLayout = ({ children }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const isActive = (path) => location.pathname === path;
  const [user, setUser] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      try {
        const decoded = jwtDecode(token);
        setUser({ name: decoded.user.fullName, id: decoded.user.id });
      } catch (error) {
        localStorage.removeItem("token");
        navigate('/login');
      }
    } else {
      navigate('/login');
    }
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/');
  };

  return (
    // Wrap the entire layout in the TripProvider
    <TripProvider>
      <div className="operator-layout">
        <main className="operator-main">
          <header className="operator-header-glass">
            <div className="brand">
              <span className="material-icons">directions_bus</span>
              <h1>TransitGo</h1>
            </div>
            <div className="header-actions">
              <Image src={`https://i.pravatar.cc/150?u=${user?.id}`} roundedCircle className="profile-pic" />
              <button type="button" onClick={handleLogout} className="action-btn" title="Logout">
                <span className="material-icons">logout</span>
              </button>
            </div>
          </header>

          {children}

          <nav className="operator-bottom-nav-glass">
            <Link to="/operator/dashboard" className={`nav-item ${isActive('/operator/dashboard') ? 'active' : ''}`}>
              <span className="material-icons">dashboard</span>
              <span className="nav-label">Dashboard</span>
            </Link>
            <Link to="/operator/routes" className={`nav-item ${isActive('/operator/routes') ? 'active' : ''}`}>
              <BsSignpostSplit size={22} />
              <span className="nav-label">Routes</span>
            </Link>
          </nav>
        </main>
      </div>
    </TripProvider>
  );
};

export default OperatorLayout;