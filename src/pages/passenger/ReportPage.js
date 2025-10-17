import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { Spinner } from 'react-bootstrap';
import jwtDecode from 'jwt-decode';
// header and bottom nav now provided by PassengerLayout
import PassengerLayout from '../../layouts/PassengerLayout';
import '../../styles/report.css';

function ReportPage() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null); 
  const [vehicles, setVehicles] = useState([]);
  const [selectedVehicle, setSelectedVehicle] = useState('');
  
  const [timeOfIncident, setTimeOfIncident] = useState('');
  const [description, setDescription] = useState('');
  const [fileName, setFileName] = useState(''); // Note: File upload logic is not implemented
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState({ success: null, message: '' });

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) { navigate('/'); return; }
    try {
      const decodedToken = jwtDecode(token);
      setUser({ name: decodedToken.user.fullName }); 
    } catch (error) {
      console.error("Invalid token:", error);
      navigate('/');
    }

    const fetchVehicles = async () => {
      setLoading(true);
      try {
        const res = await axios.get("http://localhost:5000/api/vehicles", {
          headers: { Authorization: `Bearer ${token}` }
        });
        setVehicles(res.data);
      } catch (err) {
        console.error("Failed to fetch vehicles", err);
        setSubmitStatus({ success: false, message: 'Could not load vehicle options.' });
      } finally {
        setLoading(false);
      }
    };
    fetchVehicles();
  }, [navigate]);

  const handleFileChange = (e) => {
    if (e.target.files.length > 0) {
      setFileName(e.target.files[0].name);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedVehicle || !timeOfIncident || !description) {
      setSubmitStatus({ success: false, message: 'Please fill in all required fields.' });
      return;
    }
    setIsSubmitting(true);
    setSubmitStatus({ success: null, message: '' });
    try {
      const token = localStorage.getItem("token");
      const res = await axios.post("http://localhost:5000/api/reports", 
        { vehicleId: selectedVehicle, timeOfIncident, description },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setSubmitStatus({ success: true, message: res.data.msg });
      // Reset form on success
      setSelectedVehicle('');
      setTimeOfIncident('');
      setDescription('');
      setFileName('');
    } catch (err) {
      setSubmitStatus({ success: false, message: err.response?.data?.msg || 'Submission failed.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <PassengerLayout>
      <div className="report-page">
        <main className="report-main">
        <div className="report-card">
          <h1 className="form-title">Submit a Report</h1>
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
              {/* --- CHANGE: Input type changed for better UX --- */}
              <input type="datetime-local" id="time" value={timeOfIncident} onChange={(e) => setTimeOfIncident(e.target.value)} required />
            </div>

            <div className="form-group">
              <label htmlFor="description">Description of Report</label>
              <textarea id="description" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Please provide as much detail as possible..." required></textarea>
            </div>

            <div className="form-group">
              <label>Attach Media (Optional)</label>
              <div className="file-upload-box">
                <input type="file" id="file-upload" className="file-input" onChange={handleFileChange} />
                <label htmlFor="file-upload" className="file-label">
                  <span className="material-icons">attach_file</span>
                  {fileName || 'Upload File'}
                </label>
              </div>
            </div>
            
            {submitStatus.message && (
              <div className={`alert ${submitStatus.success ? 'alert-success' : 'alert-danger'}`}>
                {submitStatus.message}
              </div>
            )}

            <button type="submit" className="submit-btn" disabled={isSubmitting}>
              {isSubmitting ? <Spinner as="span" size="sm" /> : 'Submit Report'}
            </button>
          </form>
        </div>
        </main>
      </div>
    </PassengerLayout>
  );
}

export default ReportPage;