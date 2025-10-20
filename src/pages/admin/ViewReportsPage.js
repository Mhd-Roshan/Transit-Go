import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import toast, { Toaster } from 'react-hot-toast';
import AdminLayout from '../../layouts/AdminLayout';
import '../../styles/viewReports.css'; 

// --- THIS IS THE FIX ---

// Helper function for relative time
const timeAgo = (dateString) => {
    const date = new Date(dateString);
    const seconds = Math.floor((new Date() - date) / 1000);
    let interval = seconds / 31536000;
    if (interval > 1) return `${Math.floor(interval)} years ago`;
    interval = seconds / 2592000;
    if (interval > 1) return `${Math.floor(interval)} months ago`;
    interval = seconds / 86400;
    if (interval > 1) return `${Math.floor(interval)} days ago`;
    interval = seconds / 3600;
    if (interval > 1) return `${Math.floor(interval)} hours ago`;
    interval = seconds / 60;
    if (interval > 1) return `${Math.floor(interval)} minutes ago`;
    return "just now";
};

// Helper to check if a date is today
const isToday = (someDate) => {
    const today = new Date();
    const date = new Date(someDate);
    return date.getDate() === today.getDate() &&
           date.getMonth() === today.getMonth() &&
           date.getFullYear() === today.getFullYear();
};

function ViewReportsPage() {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [replyText, setReplyText] = useState({});
  const [openReportId, setOpenReportId] = useState(null);
  const [filterStatus, setFilterStatus] = useState('All');
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState('accordion'); // 'accordion' or 'list'

  const fetchReports = async () => {
    setLoading(true);
    setError('');
    try {
        const token = localStorage.getItem("token");
        const res = await axios.get("http://localhost:5000/api/reports", {
            headers: { Authorization: `Bearer ${token}` }
        });
        setReports(res.data);
    } catch (err) {
        setError("Failed to fetch reports. Please try again later.");
        console.error("Error fetching reports:", err);
    } finally {
        setLoading(false);
    }
  };

  useEffect(() => { fetchReports(); }, []);

  const handleReplySubmit = async (reportId, customMessage = null) => {
    const message = customMessage || replyText[reportId];
    if (!message || !message.trim()) {
      toast.error("Reply message cannot be empty.");
      return;
    }

    const toastId = toast.loading('Sending reply...');
    try {
      const token = localStorage.getItem("token");
      const res = await axios.put(`http://localhost:5000/api/reports/${reportId}/reply`, 
        { message },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setReports(reports.map(r => r._id === reportId ? res.data : r));
      setReplyText({ ...replyText, [reportId]: '' });
      toast.success('Reply sent and report resolved!', { id: toastId });
    } catch (err) {
      toast.error('Failed to send reply.', { id: toastId });
    }
  };

  const filteredReports = useMemo(() => {
    return reports.filter(report => {
      const matchesStatus = filterStatus === 'All' || report.status === filterStatus;
      
      const searchTermLower = searchTerm.toLowerCase();
      const matchesSearch = !searchTerm || 
        (report.passenger?.fullName && report.passenger.fullName.toLowerCase().includes(searchTermLower)) ||
        (report.vehicle?.vehicleId && report.vehicle.vehicleId.toLowerCase().includes(searchTermLower)) ||
        (report.description && report.description.toLowerCase().includes(searchTermLower));
        
      return matchesStatus && matchesSearch;
    });
  }, [reports, filterStatus, searchTerm]);

  // Memoized stats for the top cards
  const reportStats = useMemo(() => {
    const pending = reports.filter(r => r.status === 'Pending').length;
    const resolvedToday = reports.filter(r => r.status === 'Resolved' && r.reply && isToday(r.reply.date)).length;
    return {
      total: reports.length,
      pending,
      resolvedToday,
    };
  }, [reports]);

  return (
    <AdminLayout>
      <Toaster position="top-right" reverseOrder={false} />
      <div className="view-reports-page animate-fade-in">
        <h2 className="page-title">User Reports Inbox</h2>
        <p className="page-subtitle">Review, reply to, and resolve issues submitted by passengers.</p>

        <div className="stat-cards-grid">
            <div className="stat-card-sm"><div className="stat-label">Total Reports</div><div className="stat-value">{reportStats.total}</div></div>
            <div className="stat-card-sm pending"><div className="stat-label">Pending Review</div><div className="stat-value">{reportStats.pending}</div></div>
            <div className="stat-card-sm resolved"><div className="stat-label">Resolved Today</div><div className="stat-value">{reportStats.resolvedToday}</div></div>
        </div>

        <div className="controls-bar">
            <div className="filter-group">
                <div className="filter-controls">
                    <button className={`control-btn ${filterStatus === 'All' ? 'active' : ''}`} onClick={() => setFilterStatus('All')}>All</button>
                    <button className={`control-btn ${filterStatus === 'Pending' ? 'active' : ''}`} onClick={() => setFilterStatus('Pending')}>Pending</button>
                    <button className={`control-btn ${filterStatus === 'Resolved' ? 'active' : ''}`} onClick={() => setFilterStatus('Resolved')}>Resolved</button>
                </div>
                <div className="search-reports">
                    <span className="material-icons">search</span>
                    <input type="text" placeholder="Search..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
                </div>
            </div>
            <div className="view-toggle">
                <button className={`control-btn ${viewMode === 'accordion' ? 'active' : ''}`} onClick={() => setViewMode('accordion')}><span className="material-icons">view_agenda</span>Accordion</button>
                <button className={`control-btn ${viewMode === 'list' ? 'active' : ''}`} onClick={() => setViewMode('list')}><span className="material-icons">view_list</span>List</button>
            </div>
        </div>

        {loading ? <p>Loading reports...</p> : error ? <div className="alert alert-danger">{error}</div> : 
          filteredReports.length > 0 ? (
            viewMode === 'accordion' ? (
              // Accordion View
              <div className="report-accordion">
                {filteredReports.map(report => (
                  <div key={report._id} className="report-accordion-item">
                    <div className="accordion-header" onClick={() => setOpenReportId(openReportId === report._id ? null : report._id)}>
                      <div className="header-info"><h5>{report.passenger?.fullName || 'N/A'}</h5><p>Vehicle: {report.vehicle?.vehicleId || 'N/A'} • {timeAgo(report.createdAt)}</p></div>
                      <span className={`status-pill ${report.status.toLowerCase()}`}>{report.status}</span>
                      <span className={`material-icons chevron-icon ${openReportId === report._id ? 'open' : ''}`}>expand_more</span>
                    </div>
                    <div className={`accordion-body ${openReportId === report._id ? 'open' : ''}`}>
                      <div className="accordion-content">
                        <div className="accordion-details">
                            <div className="detail-block"><strong>Incident Time:</strong><p>{new Date(report.timeOfIncident).toLocaleString()}</p></div>
                            <div className="detail-block"><strong>Passenger's Report:</strong><p>{report.description}</p></div>
                            {report.status === 'Resolved' && report.reply?.message ? (
                                <div className="admin-reply-view"><strong>Your Reply</strong><small>• Sent {timeAgo(report.reply.date)}</small><p>{report.reply.message}</p></div>
                            ) : (
                                <div className="reply-form-wrapper">
                                    <textarea className="form-control" placeholder="Type a custom reply here..." value={replyText[report._id] || ''} onChange={(e) => setReplyText({ ...replyText, [report._id]: e.target.value })}></textarea>
                                    <div className="reply-actions">
                                        <button className="quick-resolve-btn" onClick={() => handleReplySubmit(report._id, "Thank you for your feedback. We have logged the issue and will take appropriate action.")}>Quick Resolve</button>
                                        <button className="send-reply-btn" onClick={() => handleReplySubmit(report._id)}>Send Custom Reply</button>
                                    </div>
                                </div>
                            )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              // List View
              <div className="report-list-view">
                {filteredReports.map(report => (
                  <div key={report._id} className="report-list-item">
                    <div className="info"><h5>{report.passenger?.fullName || 'N/A'}</h5><p>{report.description.substring(0, 50)}...</p></div>
                    <div className="info"><p>Vehicle</p><h5>{report.vehicle?.vehicleId || 'N/A'}</h5></div>
                    <span className={`status-pill ${report.status.toLowerCase()}`}>{report.status}</span>
                    <div className="actions">
                      <button className="control-btn" onClick={() => { setViewMode('accordion'); setOpenReportId(report._id); }}><span className="material-icons">visibility</span> View</button>
                    </div>
                  </div>
                ))}
              </div>
            )
          ) : (
            <div className="empty-state">
              <h5>No Reports Found</h5>
              <p>{searchTerm || filterStatus !== 'All' ? "No reports match your current filters." : "There are no reports in the system yet."}</p>
            </div>
          )
        }
      </div>
    </AdminLayout>
  );
}

export default ViewReportsPage;