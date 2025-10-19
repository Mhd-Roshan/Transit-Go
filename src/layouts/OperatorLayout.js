import React from 'react';
import { useNavigate, useLocation, Link, Outlet } from 'react-router-dom';
import { Image } from 'react-bootstrap';
import jwtDecode from 'jwt-decode';
import { TripProvider } from '../context/TripContext';
import '../styles/operatorLayout.css';

const OperatorLayout = ({ children }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const isActive = (path) => location.pathname === path || location.pathname.startsWith(path + '/');
  
  const user = React.useMemo(() => {
    try {
      const token = localStorage.getItem("token");
      if (!token) { return null; }
      const decoded = jwtDecode(token);
      if (decoded.exp * 1000 < Date.now()) {
        localStorage.removeItem("token");
        return null;
      }
      return { name: decoded.user.fullName.split(' ')[0], id: decoded.user.id };
    } catch (error) {
      localStorage.removeItem("token");
      return null;
    }
  }, []);

  React.useEffect(() => {
    if (!user) { navigate('/login'); }
  }, [user, navigate]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/login');
  };

  if (!user) { return null; }

  return (
    <TripProvider>
      <div className="operator-layout-fixed">
        <header className="operator-header">
          <div className="header-content">
            <div className="header-brand">
              <span className="material-icons">directions_bus</span>
              <h1>TransitGo</h1>
            </div>
            {/* --- THIS IS THE UPDATED SECTION --- */}
            <div className="header-user-cluster">
              <div className="user-greeting">
                <Image src={`https://i.pravatar.cc/150?u=${user.id}`} roundedCircle className="profile-pic" />
                <div>
                  <span>Welcome,</span>
                  <h3>{user.name}</h3>
                </div>
              </div>
              <div className="user-menu">
                <button type="button" onClick={handleLogout} className="header-action-btn" title="Logout">
                  <span className="material-icons">logout</span>
                </button>
              </div>
            </div>
          </div>
        </header>
        
        <main className="operator-main-scrollable">
          {children || <Outlet />}
        </main>

        <nav className="operator-bottom-nav">
          <Link to="/operator/dashboard" className={`nav-item ${isActive('/operator/dashboard') ? 'active' : ''}`}>
            <span className="material-icons">dashboard</span>
            <span className="nav-label">Dashboard</span>
          </Link>
          <Link to="/operator/routes" className={`nav-item ${isActive('/operator/routes') ? 'active' : ''}`}>
            <span className="material-icons">map</span>
            <span className="nav-label">Routes</span>
          </Link>
        </nav>
      </div>
    </TripProvider>
  );
};

export default OperatorLayout;