import React, { useState, useEffect } from 'react';
import axios from 'axios';
import AdminLayout from '../../layouts/AdminLayout';
import '../../styles/viewReports.css'; 

function ViewReportsPage() {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [replyText, setReplyText] = useState({});

  useEffect(() => {
    const fetchReports = async () => {
      try {
        const token = localStorage.getItem("token");
        const res = await axios.get("http://localhost:5000/api/reports", {
          headers: { Authorization: `Bearer ${token}` }
        });
        setReports(res.data);
      } catch (err) { console.error("Failed to fetch reports", err); }
      finally { setLoading(false); }
    };
    fetchReports();
  }, []);

  const handleReplySubmit = async (reportId) => {
    const message = replyText[reportId];
    if (!message) { alert("Reply cannot be empty."); return; }
    try {
      const token = localStorage.getItem("token");
      const res = await axios.put(`http://localhost:5000/api/reports/${reportId}/reply`, 
        { message },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setReports(reports.map(r => r._id === reportId ? res.data : r));
      setReplyText({ ...replyText, [reportId]: '' });
    } catch (err) {
      alert("Failed to send reply.");
    }
  };

  return (
    <AdminLayout>
      <div className="view-reports-page">
        <h2 className="page-title">User Reports</h2>
        {loading ? <p>Loading reports...</p> : (
          <div className="reports-list">
            {reports.length > 0 ? reports.map(report => (
              <div key={report._id} className="report-item-card">
                <div className="report-header">
                  <span>From: <strong>{report.passenger?.fullName || 'N/A'}</strong></span>
                  <span className={`status-pill ${report.status.toLowerCase()}`}>{report.status}</span>
                </div>
                <div className="report-body">
                  {/* --- THIS SECTION IS THE FIX --- */}
                  <p><strong>Vehicle:</strong> {report.vehicle?.model} ({report.vehicle?.vehicleId || 'N/A'})</p>
                  <p><strong>Time:</strong> {new Date(report.timeOfIncident).toLocaleString()}</p>
                  <div className="description">
                    <strong>Report:</strong>
                    <p>{report.description}</p>
                  </div>
                </div>
                <div className="report-footer">
                  {report.reply && report.reply.message ? (
                    <div className="reply-view">
                      <strong>Your Reply:</strong>
                      <p>{report.reply.message}</p>
                    </div>
                  ) : (
                    <div className="reply-form">
                      <textarea
                        placeholder="Type your reply here to resolve the report..."
                        value={replyText[report._id] || ''}
                        onChange={(e) => setReplyText({ ...replyText, [report._id]: e.target.value })}
                      ></textarea>
                      <button onClick={() => handleReplySubmit(report._id)}>Send Reply</button>
                    </div>
                  )}
                </div>
              </div>
            )) : <p>No reports have been submitted yet.</p>}
          </div>
        )}
      </div>
    </AdminLayout>
  );
}

export default ViewReportsPage;