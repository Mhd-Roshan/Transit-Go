import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Image } from 'react-bootstrap';
import jwtDecode from 'jwt-decode';
import '../styles/passengerLayout.css'; // We will create this new CSS file

const PassengerLayout = ({ children }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const isActive = (path) => location.pathname === path;
  const [user, setUser] = useState(null);

  // This effect runs once to check for a token and decode user info
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      try {
        const decodedToken = jwtDecode(token);
        setUser({ name: decodedToken.user.fullName, id: decodedToken.user.id });
      } catch (error) {
        console.error("Invalid token:", error);
        localStorage.removeItem("token");
        navigate('/login');
      }
    } else {
      // If no token, redirect to login page
      navigate('/login');
    }
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/');
  };
  
  const navItems = [
    { path: '/home', icon: 'home', label: 'Home' },
    { path: '/timings', icon: 'schedule', label: 'Timings' },
    { path: '/payment', icon: 'payment', label: 'Payment' },
    { path: '/history', icon: 'history', label: 'History' },
    { path: '/report', icon: 'report', label: 'Report' }
  ];

  return (
    <div className="passenger-layout">
      {/* Floating Header */}
      <header className="passenger-header-glass">
        <div className="user-greeting">
          <Image src={`https://i.pravatar.cc/150?u=${user?.id}`} alt="User" className="profile-pic" roundedCircle />
          <div>
            <span>Welcome back,</span>
            <h3>{user?.name || 'Passenger'}</h3>
          </div>
        </div>
        <button type="button" onClick={handleLogout} className="header-icon-btn" title="Logout">
          <span className="material-icons">logout</span>
        </button>
      </header>
      
      {/* Main Content Area */}
      <main className="passenger-main">
        {children}
      </main>
      
      {/* Floating Bottom Navigation */}
      <nav className="passenger-bottom-nav-glass">
        {navItems.map(item => (
          <Link 
            key={item.path}
            to={item.path} 
            className={`nav-item ${isActive(item.path) ? 'active' : ''}`}
          >
            <span className="material-icons">{item.icon}</span>
            <span className="nav-label">{item.label}</span>
          </Link>
        ))}
      </nav>
    </div>
  );
};

export default PassengerLayout;