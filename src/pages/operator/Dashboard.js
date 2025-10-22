import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Card, Spinner, Alert, Modal } from 'react-bootstrap';
import QRCode from 'react-qr-code';
import { useTrip } from '../../context/TripContext';
import API from '../../api';
import '../../styles/opdashboard.css';

// Isolated LiveClock component to prevent re-renders
const LiveClock = () => {
  const [currentTime, setCurrentTime] = useState(new Date());
  useEffect(() => {
    const timerId = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timerId);
  }, []);
  return (
    <p className="current-time-display">
      {currentTime.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
    </p>
  );
};

const schedule = [
  { time: '8:00 AM', location: 'Adivaram (Start)' },
  { time: '8:30 AM', location: 'Lakkidi View Point' },
  { time: '8:45 AM', location: 'Vythiri' },
  { time: '9:00 AM', location: 'Chundale' },
  { time: '9:15 AM', location: 'Kalpetta Bus Stand' },
  { time: '9:45 AM', location: 'Meenangadi' },
  { time: '10:15 AM', location: 'Sulthan Bathery' },
  { time: '10:45 AM', location: 'Pazhassi Park' },
  { time: '11:00 AM', location: 'Pulpally (End Point)' },
];

const RadialProgress = ({ progress }) => {
  const radius = 45; 
  const stroke = 7; 
  const normalizedRadius = radius - stroke * 2;
  const circumference = normalizedRadius * 2 * Math.PI;
  const strokeDashoffset = circumference - (progress / 100) * circumference;
  return (
    <div className="radial-progress-container">
      <svg height={radius * 2} width={radius * 2}>
        <circle className="progress-ring-bg" strokeWidth={stroke} r={normalizedRadius} cx={radius} cy={radius}/>
        <circle className="progress-ring-fg" strokeWidth={stroke} strokeDasharray={`${circumference} ${circumference}`} style={{ strokeDashoffset }} r={normalizedRadius} cx={radius} cy={radius}/>
      </svg>
      <div className="progress-text">{Math.round(progress)}%</div>
    </div>
  );
};

const Dashboard = () => {
  const [assignment, setAssignment] = useState(null);
  // This state holds the live, polled data from the database.
  const [liveVehicleData, setLiveVehicleData] = useState(null); 
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [liveEarnings, setLiveEarnings] = useState(0);
  const [qrValue, setQrValue] = useState('');
  const [showQrModal, setShowQrModal] = useState(false);
  const pollingRef = useRef(null);

  const { completedStops, isTripActive, tripSchedule } = useTrip();

  // Effect for the initial data load
  useEffect(() => {
    const fetchCoreData = async () => {
      setLoading(true);
      setError('');
      try {
        const assignmentRes = await API.get('/assignments/my-assignment');
        setAssignment(assignmentRes.data);
        setLiveVehicleData(assignmentRes.data.vehicle); // Set initial live data
      } catch (err) {
        if (err.response?.status === 404) setAssignment(null);
        else setError('Could not load assignment data.');
      } finally {
        setLoading(false);
      }
    };
    fetchCoreData();

    // Cleanup polling when the component is unmounted
    return () => clearInterval(pollingRef.current);
  }, []);

  // Effect to handle polling for live data when a trip is active
  useEffect(() => {
    const pollLiveData = async () => {
      if (!assignment) return;
      try {
        // Fetch both assignment (for vehicle data) and earnings
        const [assignmentRes, earningsRes] = await Promise.all([
          API.get('/assignments/my-assignment'),
          API.get('/dashboard/operator-earnings')
        ]);
        setLiveVehicleData(assignmentRes.data.vehicle);
        setLiveEarnings(earningsRes.data.todayEarnings);
      } catch (err) {
        console.warn("Could not poll for live data.", err);
      }
    };

    if (isTripActive && assignment) {
      // Start polling every 7 seconds for fresh data
      pollingRef.current = setInterval(pollLiveData, 7000);
    } else {
      // Stop polling if the trip is not active
      clearInterval(pollingRef.current);
    }

    return () => clearInterval(pollingRef.current);
  }, [isTripActive, assignment]);


  const displaySchedule = useMemo(() => 
    tripSchedule.length > 0 ? tripSchedule : schedule, 
    [tripSchedule]
  );

  // --- THE DEFINITIVE QR CODE FIX ---
  // This effect generates the QR code based *only* on the live data from the database.
  useEffect(() => {
    if (!assignment?.vehicle) return;
    
    // Use the liveVehicleData's location from the database as the source of truth.
    // Fallback to the vehicle's source if the live location isn't set yet (e.g., at the start).
    const currentStopLocation = liveVehicleData?.currentLocation || assignment.vehicle.source || 'Start Point';

    const qrUrl = `${window.location.origin}/pay?vehicle=${assignment.vehicle._id}&ts=${Date.now()}&loc=${encodeURIComponent(currentStopLocation)}`;
    setQrValue(qrUrl);
    
  }, [assignment, liveVehicleData]); // Re-generates QR whenever live DB data changes

  const tripProgress = Math.min((completedStops.size / (displaySchedule.length || 1)) * 100, 100);
  const nextStopIndex = isTripActive ? displaySchedule.findIndex((_, index) => !completedStops.has(index)) : -1;
  
  const handleShowQrModal = () => setShowQrModal(true);
  const handleCloseQrModal = () => setShowQrModal(false);

  const renderContent = () => {
    if (loading) return ( <div className="status-container"><Spinner animation="border" /><p>Loading Dashboard...</p></div> );
    if (error) return ( <div className="status-container"><Alert variant="danger">{error}</Alert></div> );
    if (!assignment) return ( <div className="no-assignment-container"><span className="material-icons icon">no_transfer</span><h2>No Vehicle Assigned</h2><p>You cannot start a trip until an administrator assigns a vehicle to you.</p></div>);

    const { vehicle } = assignment;
    const source = vehicle.source || displaySchedule[0].location;
    const destination = vehicle.destination || displaySchedule[displaySchedule.length - 1].location;

    return (
      <>
        <div className="dashboard-grid">
          <Card className="dashboard-card header-card" style={{ '--stagger-delay': '100ms' }}>
            <Card.Body>
              <div>
                <h3 className="vehicle-id-header">{vehicle.vehicleId}</h3>
                <LiveClock />
              </div>
              <p className="route-path-header">
                <span>{source.split(' ')[0]}</span> <span className="material-icons">arrow_right_alt</span> <span>{destination.split(' ')[0]}</span>
              </p>
            </Card.Body>
          </Card>

          <Card 
            className="dashboard-card qr-card clickable" 
            style={{ '--stagger-delay': '200ms' }}
            onClick={handleShowQrModal}
          >
            <Card.Body>
              <span className="material-icons expand-qr-icon">zoom_in</span>
              <Card.Title>Scan to Enter/Exit</Card.Title>
              <div className="qr-wrapper">
                {qrValue ? <QRCode value={qrValue} size={256} viewBox={`0 0 256 256`} style={{ height: 'auto', maxWidth: '100%', width: '100%'}}/> : <Spinner />}
              </div>
            </Card.Body>
          </Card>

          <Card className="dashboard-card status-card" style={{ '--stagger-delay': '300ms' }}>
            <Card.Body>
              <Card.Title>Live Status</Card.Title>
              <div className="earnings-container">
                <RadialProgress progress={tripProgress} />
                <div className="earnings-details">
                  <span className="earnings-amount">₹{(liveEarnings || 0).toLocaleString('en-IN', { maximumFractionDigits: 0 })}</span>
                  <span className="earnings-label">Today's Earnings</span>
                </div>
              </div>
              <div className="stats-grid">
                <div className="stat-item">
                  <span className="material-icons">tour</span>
                  <div className="stat-details"><span className="stat-value">{completedStops.size}/{displaySchedule.length}</span><span className="stat-label">Stops</span></div>
                </div>
                <div className="stat-item">
                  <span className={`status-indicator ${isTripActive ? 'active' : ''}`}></span>
                  <div className="stat-details"><span className={`stat-value ${isTripActive ? 'text-success' : 'text-danger'}`}>{isTripActive ? 'Active' : 'Ended'}</span><span className="stat-label">Trip Status</span></div>
                </div>
              </div>
            </Card.Body>
          </Card>

          <Card className="dashboard-card route-card" style={{ '--stagger-delay': '400ms' }}>
            <Card.Body>
              <Card.Title>Live Route Tracker</Card.Title>
              <div className="route-timeline">
                {displaySchedule.map((item, index) => {
                  const isCompleted = completedStops.has(index);
                  const isCurrent = nextStopIndex === index;
                  return (
                    <div key={index} className={`route-stop ${isCompleted ? 'completed' : ''} ${isCurrent ? 'current' : ''}`}>
                      <div className="stop-marker"></div>
                      <div className="stop-details"><span className="stop-time">{item.time}</span><span className="stop-location">{item.location}</span></div>
                      {isCurrent && <span className="eta-badge">EN ROUTE</span>}
                    </div>
                  );
                })}
              </div>
            </Card.Body>
          </Card>
        </div>

        <Modal show={showQrModal} onHide={handleCloseQrModal} centered size="lg">
          <Modal.Header closeButton>
            <Modal.Title>Scan for Vehicle: {vehicle.vehicleId}</Modal.Title>
          </Modal.Header>
          <Modal.Body className="qr-modal-body">
            <div className="qr-modal-wrapper">
              {qrValue ? (
                <QRCode value={qrValue} size={320} />
              ) : (
                <Spinner animation="border" />
              )}
            </div>
            <p className="instruction-text">
              Passengers can scan this code to start or end their trip.
            </p>
          </Modal.Body>
        </Modal>
      </>
    );
  };

  return (
    <div className="operator-dashboard-page">
      <div className="page-header"><h2 className="page-title">Operator View Control</h2><p className="page-subtitle">Your real-time mission overview.</p></div>
      {renderContent()}
    </div>
  );
};

export default Dashboard;