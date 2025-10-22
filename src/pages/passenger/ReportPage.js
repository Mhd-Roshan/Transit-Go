import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Spinner, Alert } from 'react-bootstrap';
import PassengerLayout from '../../layouts/PassengerLayout';
import API from '../../api'; // Import the new API client
import '../../styles/report.css';

function ReportPage() {
  const navigate = useNavigate();
  const [vehicles, setVehicles] = useState([]);
  const [selectedVehicle, setSelectedVehicle] = useState('');
  const [timeOfIncident, setTimeOfIncident] = useState('');
  const [description, setDescription] = useState('');
  
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState({ success: null, message: '' });

  const [reportHistory, setReportHistory] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(true);
  const [historyError, setHistoryError] = useState('');

  const fetchReportHistory = async () => {
    setHistoryLoading(true);
    setHistoryError('');
    try {
      // Use the new API client
      const res = await API.get("/reports/my-reports");
      setReportHistory(res.data);
    } catch (err) {
      setHistoryError('Could not load your report history.');
    } finally {
      setHistoryLoading(false);
    }
  };

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) { navigate('/login'); return; }

    const fetchVehicles = async () => {
      setLoading(true);
      try {
        // Use the new API client
        const res = await API.get("/vehicles");
        setVehicles(res.data);
      } catch (err) {
        console.error("Failed to fetch vehicles", err);
      } finally {
        setLoading(false);
      }
    };

    fetchVehicles();
    fetchReportHistory();
  }, [navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedVehicle || !timeOfIncident || !description) {
      setSubmitStatus({ success: false, message: 'Please fill in all required fields.' });
      return;
    }
    setIsSubmitting(true);
    setSubmitStatus({ success: null, message: '' });
    try {
      // Use the new API client
      const res = await API.post("/reports", { 
        vehicleId: selectedVehicle, 
        timeOfIncident, 
        description 
      });
      setSubmitStatus({ success: true, message: res.data.msg });
      setSelectedVehicle('');
      setTimeOfIncident('');
      setDescription('');
      fetchReportHistory(); // Refetch history after submission
    } catch (err) {
      setSubmitStatus({ success: false, message: err.response?.data?.msg || 'Submission failed.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <PassengerLayout>
      <div className="report-page">
        <div className="report-header">
            <h1 className="page-title">Reports & Feedback</h1>
            <p className="page-subtitle">Submit a report about an incident or view your past submissions.</p>
        </div>
        
        <main className="report-main-grid">
          <div className="report-form-column">
            <div className="report-card">
              <h2 className="form-title">Submit a New Report</h2>
              <form onSubmit={handleSubmit} noValidate>
                <div className="form-group">
                  <label htmlFor="vehicle">Vehicle</label>
                  <select id="vehicle" value={selectedVehicle} onChange={(e) => setSelectedVehicle(e.target.value)} required disabled={loading}>
                    <option value="">{loading ? 'Loading vehicles...' : 'Select Vehicle'}</option>
                    {vehicles.map(vehicle => (
                      <option key={vehicle._id} value={vehicle._id}>
                        {vehicle.model} - ({vehicle.vehicleId})
                      </option>
                    ))}
                  </select>
                </div>
                
                <div className="form-group">
                  <label htmlFor="time">Time of Incident</label>
                  <input type="datetime-local" id="time" value={timeOfIncident} onChange={(e) => setTimeOfIncident(e.target.value)} required />
                </div>

                <div className="form-group">
                  <label htmlFor="description">Description of Report</label>
                  <textarea id="description" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Please provide as much detail as possible..." required></textarea>
                </div>
                
                {submitStatus.message && (
                  <Alert variant={submitStatus.success ? 'success' : 'danger'} className="mt-3">
                    {submitStatus.message}
                  </Alert>
                )}

                <button type="submit" className="submit-btn" disabled={isSubmitting}>
                  {isSubmitting ? <Spinner as="span" size="sm" /> : 'Submit Report'}
                </button>
              </form>
            </div>
          </div>

          <div className="report-history-column">
            <h2 className="section-title">Your Report History</h2>
            {historyLoading ? (
              <div className="text-center p-3"><Spinner animation="border" /></div>
            ) : historyError ? (
              <Alert variant="warning">{historyError}</Alert>
            ) : reportHistory.length > 0 ? (
              <div className="report-history-list">
                {reportHistory.map(report => (
                  <div key={report._id} className="report-history-card">
                    <div className="card-header">
                      <span>Vehicle: <strong>{report.vehicle?.vehicleId || 'N/A'}</strong></span>
                      <span className={`status-pill ${report.status.toLowerCase()}`}>{report.status}</span>
                    </div>
                    <div className="card-body">
                      <p><strong>Your Report:</strong> {report.description}</p>
                      {report.status === 'Resolved' && report.reply?.message && (
                        <div className="admin-reply">
                          <strong>Admin Reply:</strong>
                          <p>{report.reply.message}</p>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="empty-state">
                <span className="material-icons">inbox</span>
                <h5>No Reports Found</h5>
                <p>Your submitted reports will appear here.</p>
              </div>
            )}
          </div>
        </main>
      </div>
    </PassengerLayout>
  );
}

export default ReportPage