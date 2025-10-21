import React from 'react';
import { useState, useEffect } from 'react';
import axios from 'axios';
import { Card, Spinner, Alert } from 'react-bootstrap';
import QRCode from 'react-qr-code';
import { useTrip } from '../../context/TripContext';
import '../../styles/opdashboard.css';

// --- DATA & CONFIG ---
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
const DAILY_GOAL = 5000;
const SIMULATED_WEATHER_CONDITIONS = [
  { condition: 'Sunny', icon: 'wb_sunny', temp: 31 },
  { condition: 'Partly Cloudy', icon: 'cloud', temp: 29 },
  { condition: 'Light Rain', icon: 'grain', temp: 26 },
  { condition: 'Clear', icon: 'nightlight_round', temp: 24 },
];

// --- HELPER COMPONENTS ---
const WeatherDisplay = () => {
  const [weather] = useState(
    SIMULATED_WEATHER_CONDITIONS[
      Math.floor(Math.random() * SIMULATED_WEATHER_CONDITIONS.length)
    ]
  );
  if (!weather) return null;
  return (
    <div className="info-block weather">
      <span className="info-block-label">WAYANAD, KERALA</span>
      <span className="info-block-value">
        <span className="material-icons">{weather.icon}</span> {weather.temp}°C,{' '}
        {weather.condition}
      </span>
    </div>
  );
};

const RadialProgress = ({ progress }) => {
  const radius = 45; 
  const stroke = 7; 
  const normalizedRadius = radius - stroke * 2;
  const circumference = normalizedRadius * 2 * Math.PI;
  const strokeDashoffset = circumference - (progress / 100) * circumference;
  return (
    <div className="radial-progress-container">
      <svg height={radius * 2} width={radius * 2}>
        <circle
          className="progress-ring-bg"
          strokeWidth={stroke}
          r={normalizedRadius}
          cx={radius}
          cy={radius}
        />
        <circle
          className="progress-ring-fg"
          strokeWidth={stroke}
          strokeDasharray={`${circumference} ${circumference}`}
          style={{ strokeDashoffset }}
          r={normalizedRadius}
          cx={radius}
          cy={radius}
        />
      </svg>
      <div className="progress-text">{Math.round(progress)}%</div>
    </div>
  );
};

// --- MAIN DASHBOARD COMPONENT ---
const Dashboard = () => {
  const [assignment, setAssignment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [liveEarnings, setLiveEarnings] = useState(0);
  const [currentTime, setCurrentTime] = useState(new Date());

  const { completedStops, isTripActive } = useTrip();

  useEffect(() => {
    const fetchAssignment = async () => {
      setLoading(true);
      setError('');
      try {
        const token = localStorage.getItem('token');
        const res = await axios.get(
          'http://localhost:5000/api/assignments/my-assignment',
          { headers: { Authorization: `Bearer ${token}` } }
        );
        setAssignment(res.data);
      } catch (err) {
        if (err.response?.status === 404) setAssignment(null);
        else setError('Could not load dashboard data.');
      } finally {
        setLoading(false);
      }
    };
    fetchAssignment();
  }, []);

  useEffect(() => {
    const timerId = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timerId);
  }, []);

  // --- THIS IS THE FIX: Modified logic for earnings ---
  useEffect(() => {
    let intervalId = null;
    
    // 1. If the trip is active, start simulating earnings.
    if (isTripActive) {
      intervalId = setInterval(() => {
        setLiveEarnings((prev) => prev + Math.random() * (150 - 20) + 20);
      }, 7000);
    } else {
      // 2. If trip is NOT active and NOT complete (stopped early), reset earnings.
      if (completedStops.size < schedule.length) {
        setLiveEarnings(0);
      }
      // 3. If trip is NOT active and IS complete, the earnings value persists.
    }
    
    // 4. Cleanup function stops the simulation when the trip ends.
    return () => clearInterval(intervalId);
  }, [isTripActive, completedStops.size]); 

  const tripProgress = Math.min((completedStops.size > 0 ? completedStops.size - 1 : 0) * 12.5, 100);
  
  const nextStopIndex = isTripActive
    ? schedule.findIndex((_, index) => !completedStops.has(index))
    : -1;

  const renderContent = () => {
    if (loading)
      return (
        <div className="status-container">
          <Spinner animation="border" />
          <p>Loading Dashboard...</p>
        </div>
      );
    if (error)
      return (
        <div className="status-container">
          <Alert variant="danger">{error}</Alert>
        </div>
      );
    if (!assignment)
      return (
        <div className="no-assignment-container">
          <span className="material-icons icon">no_transfer</span>
          <h2>No Vehicle Assigned</h2>
          <p>
            You cannot start a trip until an administrator assigns a vehicle to
            you.
          </p>
        </div>
      );

    const { vehicle } = assignment;
    const source = vehicle.source || schedule[0].location;
    const destination =
      vehicle.destination || schedule[schedule.length - 1].location;

    return (
      <div className="dashboard-grid">
        {/* --- Header Info Card --- */}
        <Card
          className="dashboard-card header-card"
          style={{ '--stagger-delay': '100ms' }}
        >
          <Card.Body>
            <div>
              <h3 className="vehicle-id-header">{vehicle.vehicleId}</h3>
              <p className="current-time-display">
                {currentTime.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
              </p>
            </div>
            <p className="route-path-header">
              <span>{source.split(' ')[0]}</span>{' '}
              <span className="material-icons">arrow_right_alt</span>{' '}
              <span>{destination.split(' ')[0]}</span>
            </p>
            <div className="header-info-footer">
              <WeatherDisplay />
            </div>
          </Card.Body>
        </Card>

        {/* --- QR Code Card --- */}
        <Card
          className="dashboard-card qr-card"
          style={{ '--stagger-delay': '200ms' }}
        >
          <Card.Body>
            <Card.Title>Scan for UPI Payment</Card.Title>
            <div className="qr-wrapper">
              <QRCode
                value={`/pay?vehicle=${vehicle._id}`}
                size={256}
                viewBox={`0 0 256 256`}
                style={{
                  height: 'auto',
                  maxWidth: '100%',
                  width: '100%',
                }}
              />
            </div>
          </Card.Body>
        </Card>

        {/* --- Live Status & Earnings Card --- */}
        <Card
          className="dashboard-card status-card"
          style={{ '--stagger-delay': '300ms' }}
        >
          <Card.Body>
            <Card.Title>Live Status</Card.Title>
            <div className="earnings-container">
              <RadialProgress progress={tripProgress} />
              <div className="earnings-details">
                <span className="earnings-amount">
                  ₹
                  {liveEarnings.toLocaleString('en-IN', {
                    maximumFractionDigits: 0,
                  })}
                </span>
                <span className="earnings-label">Today's Earnings</span>
              </div>
            </div>
            <div className="stats-grid">
              <div className="stat-item">
                <span className="material-icons">tour</span>
                <div className="stat-details">
                  <span className="stat-value">
                    {completedStops.size}/{schedule.length}
                  </span>
                  <span className="stat-label">Stops</span>
                </div>
              </div>
              <div className="stat-item">
                <span
                  className={`status-indicator ${
                    isTripActive ? 'active' : ''
                  }`}
                ></span>
                <div className="stat-details">
                  <span
                    className={`stat-value ${
                      isTripActive ? 'text-success' : 'text-danger'
                    }`}
                  >
                    {isTripActive ? 'Active' : 'Ended'}
                  </span>
                  <span className="stat-label">Trip Status</span>
                </div>
              </div>
            </div>
          </Card.Body>
        </Card>

        {/* --- Live Route Tracker Card --- */}
        <Card
          className="dashboard-card route-card"
          style={{ '--stagger-delay': '400ms' }}
        >
          <Card.Body>
            <Card.Title>Live Route Tracker</Card.Title>
            <div className="route-timeline">
              {schedule.map((item, index) => {
                const isCompleted = completedStops.has(index);
                const isCurrent = nextStopIndex === index;
                return (
                  <div
                    key={index}
                    className={`route-stop ${
                      isCompleted ? 'completed' : ''
                    } ${isCurrent ? 'current' : ''}`}
                  >
                    <div className="stop-marker"></div>
                    <div className="stop-details">
                      <span className="stop-time">{item.time}</span>
                      <span className="stop-location">{item.location}</span>
                    </div>
                    {isCurrent && (
                      <span className="eta-badge">EN ROUTE</span>
                    )}
                  </div>
                );
              })}
            </div>
          </Card.Body>
        </Card>
      </div>
    );
  };

  return (
    <div className="operator-dashboard-page">
      <div className="page-header">
        <h2 className="page-title">Operator View Control</h2>
        <p className="page-subtitle">Your real-time mission overview.</p>
      </div>
      {renderContent()}
    </div>
  );
};

export default Dashboard;