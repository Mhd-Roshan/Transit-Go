import React from 'react';
import { useNavigate, useLocation, Link, Outlet } from 'react-router-dom';
import { Image } from 'react-bootstrap';
import { BsSignpostSplit } from "react-icons/bs";
import jwtDecode from 'jwt-decode';
import { TripProvider } from '../context/TripContext';
import '../styles/opdashboard.css';

const OperatorLayout = ({ children }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const isActive = (path) => location.pathname === path || location.pathname.startsWith(path + '/');
  
  // This robust authentication logic remains the same.
  const user = React.useMemo(() => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        return null;
      }
      const decoded = jwtDecode(token);
      if (decoded.exp * 1000 < Date.now()) {
        localStorage.removeItem("token");
        return null;
      }
      // We only need the first name for the greeting
      const firstName = decoded.user.fullName.split(' ')[0];
      return { name: firstName, id: decoded.user.id };
    } catch (error) {
      localStorage.removeItem("token");
      return null;
    }
  }, []);

  React.useEffect(() => {
    if (!user) {
      navigate('/login');
    }
  }, [user, navigate]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/login');
  };

  if (!user) {
    return null;
  }

  return (
    <TripProvider>
      <div className="operator-layout-fixed">
        <header className="operator-header-glass">
          <div className="brand">
            <span className="material-icons">directions_bus</span>
            <h1>TransitGo</h1>
          </div>

          {/* --- NEW: Added user greeting --- */}
          <div className="header-greeting">
            Welcome, {user.name}!
          </div>

          <div className="header-actions">
            <Image src={`https://i.pravatar.cc/150?u=${user.id}`} roundedCircle className="profile-pic" />
            <button type="button" onClick={handleLogout} className="action-btn" title="Logout">
              <span className="material-icons">logout</span>
            </button>
          </div>
        </header>
        
        <main className="operator-main-scrollable">
          {/* Render children if provided (e.g., Dashboard uses <OperatorLayout>...children...</OperatorLayout>)
             otherwise fall back to Router Outlet for routed children. */}
          {children || <Outlet />}
        </main>

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
      </div>
    </TripProvider>
  );
};

export default OperatorLayout;