import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Modal, Button, Form, Spinner } from 'react-bootstrap';
import API from '../api'; // Import the new API client
import '../styles/adminLayout.css';

const AdminLayout = ({ children }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const currentPath = location.pathname;

  const [reports, setReports] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showReplyModal, setShowReplyModal] = useState(false);
  const [selectedReport, setSelectedReport] = useState(null);
  const [replyText, setReplyText] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const fetchReports = async () => {
      try {
        // Use the new API client
        const res = await API.get("/reports");
        setReports(res.data);
      } catch (err) {
        console.error("Failed to fetch reports for notifications", err);
      }
    };
    fetchReports();
  }, []);

  const pendingReports = reports.filter(r => r.status === 'Pending');

  const navItems = [
    { path: '/admin/dashboard', icon: 'dashboard', label: 'Dashboard' },
    { path: '/admin/users', icon: 'group', label: 'Users' },
    { path: '/admin/operators', icon: 'engineering', label: 'Assign' },
    { path: '/admin/vehicles', icon: 'directions_bus', label: 'Vehicles' },
    { path: '/admin/fares', icon: 'receipt_long', label: 'Fares' },
  ];

  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/login');
  };
  
  const handleOpenReplyModal = (report) => {
    setSelectedReport(report);
    setShowReplyModal(true);
    setShowNotifications(false);
  };

  const handleReplySubmit = async () => {
    if (!replyText.trim() || !selectedReport) return;
    setIsSubmitting(true);
    try {
      // Use the new API client
      const res = await API.put(`/reports/${selectedReport._id}/reply`, 
        { message: replyText }
      );
      setReports(reports.map(r => r._id === selectedReport._id ? res.data : r));
      setShowReplyModal(false);
      setReplyText("");
    } catch (err) {
      alert("Failed to send reply.");
    } finally {
      setIsSubmitting(false);
    }
  };


  return (
    <div className="admin-layout animate-fade-in">
      <header className="admin-header">
        <div className="header-content">
            <div className="header-brand">
                <span className="material-icons">directions_bus</span>
                <h1>TransitGo</h1>
            </div>
            <div className="header-user-cluster">
                <div className="notification-wrapper">
                    <button 
                        type="button" 
                        className="header-action-btn notification-btn" 
                        title="Notifications"
                        onClick={() => setShowNotifications(!showNotifications)}
                    >
                        <span className="material-icons">notifications</span>
                        {pendingReports.length > 0 && (
                            <span className="notification-badge">{pendingReports.length}</span>
                        )}
                    </button>
                    {showNotifications && (
                        <div className="notification-dropdown">
                            <div className="dropdown-header"><h3>New Reports</h3></div>
                            {pendingReports.length > 0 ? (
                                pendingReports.slice(0, 5).map(report => (
                                    <div key={report._id} className="notification-item">
                                        <div className="item-icon"><span className="material-icons">report</span></div>
                                        <div className="item-content">
                                            <p><strong>{report.passenger?.fullName || 'N/A'}</strong> reported an issue with vehicle <strong>{report.vehicle?.vehicleId || 'N/A'}</strong>.</p>
                                            <small>{new Date(report.createdAt).toLocaleString()}</small>
                                        </div>
                                        <div className="item-actions">
                                            <button className="btn-action-sm view" onClick={() => navigate('/admin/reports')}>View</button>
                                            <button className="btn-action-sm reply" onClick={() => handleOpenReplyModal(report)}>Reply</button>
                                        </div>
                                    </div>
                                ))
                            ) : (<div className="empty-notification">No new reports.</div>)}
                            <div className="dropdown-footer">
                                <Link to="/admin/reports" onClick={() => setShowNotifications(false)}>View All Reports</Link>
                            </div>
                        </div>
                    )}
                </div>
                <div className="user-menu">
                    <img src="https://i.pravatar.cc/150?img=3" alt="Admin" className="profile-pic" />
                    <button type="button" onClick={handleLogout} className="header-action-btn" title="Logout">
                        <span className="material-icons">logout</span>
                    </button>
                </div>
            </div>
        </div>
      </header>
      
      <main className="admin-main-content">
        {children}
      </main>

      <footer className="admin-bottom-nav">
        {navItems.map(item => (
          <Link 
            key={item.path} 
            to={item.path} 
            className={`nav-item ${currentPath.startsWith(item.path) ? 'active' : ''}`}
          >
            <span className="material-icons">{item.icon}</span>
            <span className="nav-label">{item.label}</span>
          </Link>
        ))}
      </footer>
      
      <Modal show={showReplyModal} onHide={() => setShowReplyModal(false)} centered>
          <Modal.Header closeButton><Modal.Title>Reply to Report</Modal.Title></Modal.Header>
          <Modal.Body>
              {selectedReport && (
                  <div className="report-summary">
                      <p><strong>From:</strong> {selectedReport.passenger?.fullName}</p>
                      <p><strong>Vehicle:</strong> {selectedReport.vehicle?.vehicleId}</p>
                      <p className="report-description">"{selectedReport.description}"</p>
                  </div>
              )}
              <Form.Group>
                  <Form.Label>Your Reply</Form.Label>
                  <Form.Control as="textarea" rows={4} value={replyText} onChange={(e) => setReplyText(e.target.value)} placeholder="Type your response to resolve this issue..."/>
              </Form.Group>
          </Modal.Body>
          <Modal.Footer>
              <Button variant="secondary" onClick={() => setShowReplyModal(false)}>Cancel</Button>
              <Button variant="primary" onClick={handleReplySubmit} disabled={isSubmitting}>
                  {isSubmitting ? <Spinner size="sm" /> : "Send Reply & Resolve"}
              </Button>
          </Modal.Footer>
      </Modal>
    </div>
  );
};

export default AdminLayout;