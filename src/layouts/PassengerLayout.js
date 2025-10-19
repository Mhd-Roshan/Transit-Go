import React, { useState, useEffect, useMemo } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Image } from 'react-bootstrap';
import jwtDecode from 'jwt-decode';
import axios from 'axios';
import '../styles/passengerLayout.css';

const PassengerLayout = ({ children }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const isActive = (path) => location.pathname === path;

  const [reports, setReports] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [readReportIds, setReadReportIds] = useState(() => {
      try {
          const readIds = localStorage.getItem('readReportIds');
          return readIds ? new Set(JSON.parse(readIds)) : new Set();
      } catch {
          return new Set();
      }
  });

  const user = useMemo(() => {
    try {
      const token = localStorage.getItem("token");
      if (!token) return null;
      const decodedToken = jwtDecode(token);
      if (decodedToken.exp * 1000 < Date.now()) {
        localStorage.removeItem("token");
        return null;
      }
      return { name: decodedToken.user.fullName, id: decodedToken.user.id };
    } catch (error) {
      console.error("Invalid token:", error);
      localStorage.removeItem("token");
      return null;
    }
  }, []);

  useEffect(() => {
    if (!user) {
      navigate('/login');
    } else {
      const fetchReports = async () => {
        const token = localStorage.getItem("token");
        try {
          const res = await axios.get("http://localhost:5000/api/reports/my-reports", {
            headers: { Authorization: `Bearer ${token}` }
          });
          setReports(res.data);
        } catch (err) {
          console.error("Failed to fetch passenger reports for notifications:", err);
        }
      };
      fetchReports();
    }
  }, [user, navigate]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/login');
  };
  
  const navItems = [
    { path: '/home', icon: 'home', label: 'Home' },
    { path: '/timings', icon: 'schedule', label: 'Timings' },
    { path: '/payment', icon: 'payment', label: 'Payment' },
    { path: '/history', icon: 'history', label: 'History' },
    { path: '/report', icon: 'report', label: 'Report' }
  ];

  const unreadReports = reports.filter(r => r.status === 'Resolved' && r.reply?.message && !readReportIds.has(r._id));

  const handleNotificationClick = (reportId) => {
    const newReadIds = new Set(readReportIds).add(reportId);
    setReadReportIds(newReadIds);
    localStorage.setItem('readReportIds', JSON.stringify(Array.from(newReadIds)));
    navigate('/report');
    setShowNotifications(false);
  };

  if (!user) {
    return null;
  }

  return (
    <div className="passenger-layout">
      {/* --- THIS IS THE UPDATED HEADER STRUCTURE --- */}
      <header className="passenger-header-glass">
        <div className="header-content">
          <div className="header-brand">
            <span className="material-icons">directions_bus</span>
            <h1>TransitGo</h1>
          </div>

          <div className="header-user-cluster">
            <div className="user-greeting">
              <Image src={`https://i.pravatar.cc/150?u=${user.id}`} alt="User" className="profile-pic" roundedCircle />
              <div>
                <span>Welcome,</span>
                <h3>{user.name.split(' ')[0]}</h3>
              </div>
            </div>
            
            <div className="notification-wrapper">
                <button 
                    type="button" 
                    onClick={() => setShowNotifications(!showNotifications)} 
                    className="header-action-btn" 
                    title="Notifications"
                >
                    <span className="material-icons">notifications</span>
                    {unreadReports.length > 0 && (
                        <span className="notification-badge">{unreadReports.length}</span>
                    )}
                </button>

                {showNotifications && (
                    <div className="notification-dropdown">
                        <div className="dropdown-header"><h3>Admin Replies</h3></div>
                        {unreadReports.length > 0 ? (
                            unreadReports.slice(0, 5).map(report => (
                                <div key={report._id} className="notification-item" onClick={() => handleNotificationClick(report._id)}>
                                    <div className="item-icon"><span className="material-icons">admin_panel_settings</span></div>
                                    <div className="item-content">
                                        <p>An admin replied to your report about vehicle <strong>{report.vehicle?.vehicleId || 'N/A'}</strong>.</p>
                                        <small>Click to view</small>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="empty-notification">No new replies.</div>
                        )}
                    </div>
                )}
            </div>
            <button type="button" onClick={handleLogout} className="header-action-btn" title="Logout">
              <span className="material-icons">logout</span>
            </button>
          </div>
        </div>
      </header>
      
      <main className="passenger-main-scrollable">
        {children}
      </main>
      
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