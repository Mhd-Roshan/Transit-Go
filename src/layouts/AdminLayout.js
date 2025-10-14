import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import '../styles/adminLayout.css';

const AdminLayout = ({ children }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const currentPath = location.pathname;

  // The navigation items are correct.
  const navItems = [
    { path: '/admin/dashboard', icon: 'dashboard', label: 'Dashboard' },
    { path: '/admin/users', icon: 'group', label: 'Users' },
    { path: '/admin/operators', icon: 'engineering', label: 'Assign' },
    { path: '/admin/vehicles', icon: 'directions_bus', label: 'Vehicles' },
    { path: '/admin/fares', icon: 'receipt_long', label: 'Fares' },
  ];

  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/login'); // Correctly redirects to login
  };

  return (
    <div className="admin-layout animate-fade-in">
      {/* --- THIS WRAPPER IS THE CRUCIAL FIX --- */}
      {/* It creates the container that allows the header to "float" at the top. */}
      <div className="header-container">
        <header className="admin-header">
          <div className="header-brand">
            <span className="material-icons">directions_bus</span>
            <h1>TransitGo</h1>
          </div>
          <div className="header-actions">
            <button className="header-action-btn notification-btn" title="Notifications">
              <span className="material-icons">notifications</span>
              <span className="notification-badge"></span> {/* Number removed for dot style */}
            </button>
            <div className="user-menu">
              <img src="https://i.pravatar.cc/150?img=3" alt="Admin" className="profile-pic" />
              <button onClick={handleLogout} className="header-action-btn logout-btn" title="Logout">
                <span className="material-icons">logout</span>
              </button>
            </div>
          </div>
        </header>
      </div>
      
      <main className="admin-main-content">
        {children}
      </main>

      <footer className="admin-bottom-nav">
        {navItems.map(item => (
          <Link 
            key={item.path} 
            to={item.path} 
            className={`nav-item ${currentPath === item.path ? 'active' : ''}`}
          >
            <span className="material-icons">{item.icon}</span>
            <span className="nav-label">{item.label}</span>
          </Link>
        ))}
      </footer>
    </div>
  );
};

export default AdminLayout;