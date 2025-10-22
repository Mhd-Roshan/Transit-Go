import React from 'react';
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Modal, Spinner, Alert } from 'react-bootstrap';
import QrScanner from '../../components/QrScanner';
import PassengerLayout from '../../layouts/PassengerLayout';
import API from '../../api'; // Import the new API client
import '../../styles/home.css';

// Remove the local API instance definition

function HomePage() {
  const navigate = useNavigate();
  const [balance, setBalance] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [upcomingBuses, setUpcomingBuses] = useState([]);
  const [showScanner, setShowScanner] = useState(false);
  
  const [hasActiveTrip, setHasActiveTrip] = useState(false);
  const [scanResult, setScanResult] = useState({ status: null, message: '' });
  const [isProcessingScan, setIsProcessingScan] = useState(false);

  const syncTripStatus = async () => {
    try {
        const tripStatusRes = await API.get("/trips/status");
        setHasActiveTrip(tripStatusRes.data.hasActiveTrip);
    } catch (err) {
        console.error("Failed to sync trip status.", err);
        setError("Could not verify your current trip status.");
    }
  };

  useEffect(() => {
    const fetchAllData = async () => {
        setLoading(true);
        setError('');
        try {
            // Use the global API client
            const [balanceRes, busesRes, tripStatusRes] = await Promise.all([
                API.get("/payments/balance"),
                API.get("/assignments/active"),
                API.get("/trips/status")
            ]);
            setBalance(balanceRes.data.balance);
            setUpcomingBuses(busesRes.data.slice(0, 4));
            setHasActiveTrip(tripStatusRes.data.hasActiveTrip);
        } catch (err) {
            console.error("Failed to fetch home page data.", err);
            setError('Could not load page data. Please try refreshing.');
        } finally {
            setLoading(false);
        }
    };
    fetchAllData();
  }, []);
  
  const handleScanSuccess = async (decodedText) => {
    setShowScanner(false);
    setIsProcessingScan(true);
    setScanResult({ status: null, message: '' });

    try {
        const params = new URLSearchParams(decodedText.substring(decodedText.indexOf('?')));
        const vehicleId = params.get('vehicle');
        const timestamp = params.get('ts');
        const busLocation = decodeURIComponent(params.get('loc') || 'Unknown Stop');
        
        if (!vehicleId || !timestamp) throw new Error("Invalid QR Code data.");

        const endpoint = hasActiveTrip ? '/trips/scan-exit' : '/trips/scan-entry';
        const payload = { vehicleId, busLocation, timestamp };
        
        // Use the global API client
        const res = await API.post(endpoint, payload);

        setScanResult({ status: 'success', message: res.data.msg });
        if (res.data.newBalance) setBalance(res.data.newBalance);
        setHasActiveTrip(!hasActiveTrip);

    } catch (err) {
        const errorMessage = err.response?.data?.msg || "An error occurred during the scan.";
        setScanResult({ status: 'error', message: errorMessage });

        if (err.response?.status === 400 && hasActiveTrip) {
            syncTripStatus();
        }
    } finally {
        setIsProcessingScan(false);
    }
  };

  const closeScanner = () => setShowScanner(false);

  const renderScanPayCard = () => {
    if (isProcessingScan) {
        return (
            <div className="scan-pay-card">
                <Spinner animation="border" variant="primary" />
                <div className="scan-pay-text">
                    <h4>Processing...</h4>
                    <p>Please wait while we process your scan.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="scan-pay-card" onClick={() => setShowScanner(true)}>
            <div className="scan-pay-icon"><span className="material-icons-outlined">qr_code_scanner</span></div>
            <div className="scan-pay-text">
                <h4>{hasActiveTrip ? 'Scan to Exit' : 'Scan to Enter'}</h4>
                <p>{hasActiveTrip ? 'Tap here to end your trip and pay the fare.' : 'Tap to scan the QR and start your trip.'}</p>
            </div>
        </div>
    );
  };

  return (
    <PassengerLayout>
      <div>
        {error && <Alert variant="danger" onClose={() => setError('')} dismissible>{error}</Alert>}
        {scanResult.message && (
            <Alert 
                variant={scanResult.status === 'success' ? 'success' : 'danger'}
                onClose={() => setScanResult({ status: null, message: '' })}
                dismissible
            >
                {scanResult.message}
            </Alert>
        )}
        
        <section className="home-hero-grid animate-fade-in">
            <div className="balance-card">
              <span className="balance-label">Wallet Balance</span>
              {loading ? <Spinner animation="border" variant="light" size="sm" /> : <h2 className="balance-amount">₹{balance.toLocaleString('en-IN', {minimumFractionDigits: 2})}</h2>}
              <button className="btn-add-money" onClick={() => navigate('/payment')}><span className="material-icons-outlined">add_circle</span> Add Money</button>
            </div>
            {renderScanPayCard()}
        </section>
        
        <section className="upcoming-buses-section animate-fade-in" style={{ animationDelay: '200ms' }}>
          <h3 className="section-title">Upcoming Buses</h3>
          {loading ? <div className="text-center p-3"><Spinner /></div> : (
              <div className="bus-list">
                  {upcomingBuses.length > 0 ? upcomingBuses.map(bus => {
                      if (!bus || !bus.vehicle) return null;
                      const diffMinutes = Math.round((new Date(bus.departureTime) - new Date()) / 60000);
                      const departsInText = diffMinutes <= 0 ? 'Departing' : `In ${diffMinutes} min`;
                      return (
                          <div key={bus._id} className="bus-card">
                              <div className="bus-card-icon"><span className="material-icons-outlined">directions_bus</span></div>
                              <div className="bus-card-details">
                                  <h4>{bus.vehicle?.model} ({bus.vehicle?.vehicleId})</h4>
                                  <p>To: <strong>{bus.vehicle?.destination}</strong></p>
                              </div>
                              <div className="bus-card-timing">
                                  <span className="departs-in">{departsInText}</span>
                                  <span className={`status-badge ${bus.status.toLowerCase().replace(' ', '-')}`}>{bus.status}</span>
                              </div>
                          </div>
                      );
                  }) : (
                    <p className="no-buses-msg">No active buses found.</p>
                  )}
              </div>
          )}
        </section>

        <section className="quick-actions-section animate-fade-in" style={{ animationDelay: '300ms' }}>
          <h3 className="section-title">More Actions</h3>
          <div className="quick-actions">
            <div className="action-card" onClick={() => navigate('/timings')}><div className="action-icon book-icon"><span className="material-icons-outlined">schedule</span></div><h4>Schedules</h4><p>View all routes</p></div>
            <div className="action-card" onClick={() => navigate('/history')}><div className="action-icon book-icon"><span className="material-icons-outlined">history</span></div><h4>History</h4><p>See your trips</p></div>
          </div>
        </section>

        <Modal show={showScanner} onHide={closeScanner} centered>
          <Modal.Header closeButton><Modal.Title>Scan Bus QR Code</Modal.Title></Modal.Header>
          <Modal.Body className="scanner-modal-body">
                <QrScanner onScanSuccess={handleScanSuccess} />
                <p className="scanner-warning">
                  <span className="material-icons-outlined">center_focus_strong</span>
                  Position the QR code inside the frame to scan.
                </p>
          </Modal.Body>
        </Modal>

      </div>
    </PassengerLayout>
  );
}

export default HomePage;