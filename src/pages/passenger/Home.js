import React from 'react';
import { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { Modal, Spinner, Alert } from 'react-bootstrap';
import QrScanner from '../../components/QrScanner';
import PassengerLayout from '../../layouts/PassengerLayout';
import '../../styles/home.css';

// A centralized API instance for making requests with the auth token
const API = axios.create({ baseURL: 'http://localhost:5000' });
API.interceptors.request.use((req) => {
  if (localStorage.getItem('token')) {
    req.headers.Authorization = `Bearer ${localStorage.getItem('token')}`;
  }
  return req;
});

// Helper function to check if the pending trip has expired
const isTripExpired = (createdAt) => {
    if (!createdAt) return false;
    const deadline = new Date(createdAt).getTime() + 24 * 60 * 60 * 1000; // 24 hours
    return new Date().getTime() > deadline;
};

function HomePage() {
  const navigate = useNavigate();
  const [balance, setBalance] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(''); // For general page errors
  const [upcomingBuses, setUpcomingBuses] = useState([]);
  const [showScanner, setShowScanner] = useState(false);
  const [hasExpiredDue, setHasExpiredDue] = useState(false);

  // --- CHANGE: New states for scanner modal UI ---
  const [scanStatus, setScanStatus] = useState('idle'); // 'idle', 'scanning', 'success'

  // State specifically for the payment modal
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [scannedVehicleId, setScannedVehicleId] = useState(null);
  const [destinationInModal, setDestinationInModal] = useState("");
  const [fareAmount, setFareAmount] = useState(null); 
  const [calculatedFareAmount, setCalculatedFareAmount] = useState(null); 
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentResult, setPaymentResult] = useState({ status: null, message: '' });
  const [modalError, setModalError] = useState('');

  useEffect(() => {
    const storedTripJSON = localStorage.getItem('pendingTrip');
    if (storedTripJSON) {
        const storedTrip = JSON.parse(storedTripJSON);
        if (isTripExpired(storedTrip.createdAt)) {
            setHasExpiredDue(true);
        }
    }

    const fetchAllData = async () => {
        setLoading(true);
        setError('');
        try {
            const [balanceRes, busesRes] = await Promise.all([
                API.get("/api/payments/balance"),
                API.get("/api/assignments/active")
            ]);
            setBalance(balanceRes.data.balance);
            setUpcomingBuses(busesRes.data.slice(0, 4));
        } catch (err) {
            console.error("Failed to fetch home page data.", err);
            setError('Could not load page data. Please try refreshing.');
        } finally {
            setLoading(false);
        }
    };
    fetchAllData();
  }, []);
  
  // --- CHANGE: Updated scan handler to manage UI state instead of using alert() ---
  const handleScanSuccess = (decodedText) => {
    // Show a success state inside the modal
    setScanStatus('success');

    // After a short delay, close the scanner and open the payment modal
    setTimeout(() => {
        setShowScanner(false);
        setScanStatus('idle'); // Reset for next time

        // Process the QR code data
        try {
            const params = new URLSearchParams(
              decodedText.includes('?') ? decodedText.substring(decodedText.indexOf('?')) : decodedText
            );
            const vehicleId = params.get('vehicle');
      
            if (vehicleId) {
              const MINIMUM_FARE = 20;
              const placeholderTrip = {
                  vehicleId: vehicleId,
                  destination: "Not Set",
                  amount: MINIMUM_FARE,
                  calculatedFare: MINIMUM_FARE,
                  createdAt: new Date().toISOString()
              };
              localStorage.setItem('pendingTrip', JSON.stringify(placeholderTrip));
      
              setScannedVehicleId(vehicleId);
              setShowPaymentModal(true);
            } else {
              setError(`Scanned QR code is not valid.`);
            }
          } catch (error) {
            console.error("Error processing QR Code:", error);
            setError("Could not process the scanned QR Code. Please try again.");
          }
    }, 2000); // 2-second delay to show the success message
  };

  const handleCalculateFare = async () => {
    if (!destinationInModal) {
      setModalError('Please enter a destination.');
      return;
    }
    setIsProcessing(true);
    setModalError('');
    try {
      const { data } = await API.post("/api/trips/calculate-fare", { destination: destinationInModal });
      
      setCalculatedFareAmount(data.amount); 
      setFareAmount(data.amount); 

      const updatedPendingTrip = {
          vehicleId: scannedVehicleId,
          destination: destinationInModal,
          amount: data.amount,
          calculatedFare: data.amount,
          createdAt: JSON.parse(localStorage.getItem('pendingTrip')).createdAt
      };
      localStorage.setItem('pendingTrip', JSON.stringify(updatedPendingTrip));

    } catch (err) {
      setModalError(err.response?.data?.msg || "Could not calculate fare.");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleConfirmPayment = async () => {
    setIsProcessing(true);
    setModalError('');
    try {
      const { data: chargeData } = await API.post("/api/payments/charge", { 
          amount: fareAmount, 
          description: `Trip to ${destinationInModal}` 
      });

      await API.post("/api/trips", { 
          destination: destinationInModal, 
          amountPaid: fareAmount,
          calculatedFare: calculatedFareAmount
      });
      
      setPaymentResult({ status: 'success', message: chargeData.message });
      setBalance(chargeData.newBalance);
      localStorage.removeItem('pendingTrip');
      setHasExpiredDue(false);

    } catch (err) {
      const errorMessage = err.response?.data?.msg || "An unexpected error occurred.";
      setPaymentResult({ status: 'error', message: errorMessage });
    } finally {
      setIsProcessing(false);
    }
  };

  const closeModalAndReset = () => {
    setShowPaymentModal(false);
    setScannedVehicleId(null);
    setDestinationInModal("");
    setFareAmount(null);
    setCalculatedFareAmount(null); 
    setPaymentResult({ status: null, message: '' });
    setModalError('');
  };

  // --- CHANGE: New helper functions to manage scanner modal state ---
  const openScanner = () => {
    setScanStatus('scanning');
    setShowScanner(true);
  }
  const closeScanner = () => {
    setShowScanner(false);
    setScanStatus('idle');
  }

  const renderModalContent = () => {
    if (paymentResult.status) {
      return (
        <div className={`payment-result ${paymentResult.status}`}>
          <span className="material-icons-outlined result-icon">
            {paymentResult.status === 'success' ? 'check_circle' : 'error'}
          </span>
          <h4>{paymentResult.status === 'success' ? 'Payment Successful!' : 'Payment Failed'}</h4>
          <p>{paymentResult.message}</p>
          <button className="btn-fare" onClick={closeModalAndReset}>Close</button>
        </div>
      );
    }

    if (fareAmount !== null) {
      return (
        <div className="text-center">
          <h4>Trip Fare: ₹{fareAmount.toFixed(2)}</h4>
          <p>Your wallet balance is ₹{balance.toFixed(2)}</p>
          {balance < fareAmount && <Alert variant="warning" className="mt-3">Insufficient balance. Please add money to your wallet.</Alert>}
          <button className="btn-fare mt-3" onClick={handleConfirmPayment} disabled={isProcessing || balance < fareAmount}>
            {isProcessing ? <Spinner as="span" size="sm" /> : "Confirm & Pay"}
          </button>
        </div>
      );
    }

    return (
      <>
        <div className="vehicle-info-display">
          <span className="material-icons-outlined">directions_bus</span>
          <div>
            <span>Vehicle Scanned</span>
            <strong>ID: ...{scannedVehicleId?.slice(-6)}</strong>
          </div>
        </div>
        <div className="input-group-creative">
          <span className="material-icons-outlined">flag</span>
          <input 
            type="text" 
            placeholder="Enter your destination" 
            value={destinationInModal}
            onChange={(e) => setDestinationInModal(e.target.value)}
            disabled={isProcessing}
          />
        </div>
        {modalError && <Alert variant="danger" className="mt-3">{modalError}</Alert>}
        <button className="btn-fare" onClick={handleCalculateFare} disabled={isProcessing || !destinationInModal}>
          {isProcessing ? <Spinner as="span" size="sm" /> : "Calculate Fare"}
        </button>
      </>
    );
  };


  return (
    <PassengerLayout>
      <div>
        {error && <Alert variant="danger" onClose={() => setError('')} dismissible>{error}</Alert>}
        
        <section className="home-hero-grid animate-fade-in">
            <div className="balance-card">
              <span className="balance-label">Wallet Balance</span>
              {loading ? <Spinner animation="border" variant="light" size="sm" /> : <h2 className="balance-amount">₹{balance.toLocaleString('en-IN', {minimumFractionDigits: 2})}</h2>}
              <button className="btn-add-money" onClick={() => navigate('/payment')}><span className="material-icons-outlined">add_circle</span> Add Money</button>
            </div>

            {hasExpiredDue ? (
              <div className="due-card">
                <div className="due-icon"><span className="material-icons-outlined">error</span></div>
                <div className="due-text">
                    <h4>Payment Due</h4>
                    <p>Your account is blocked. Please clear the due amount.</p>
                </div>
                <button className="btn btn-danger" onClick={() => navigate('/payment')}>Clear Due</button>
              </div>
            ) : (
              <div className="scan-pay-card" onClick={openScanner}>
                <div className="scan-pay-icon"><span className="material-icons-outlined">qr_code_scanner</span></div>
                <div className="scan-pay-text">
                    <h4>Scan & Pay</h4>
                    <p>Tap to scan the QR code and start your trip.</p>
                </div>
              </div>
            )}
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

        {/* --- CHANGE: Modal content is now dynamic based on scanStatus --- */}
        <Modal show={showScanner} onHide={closeScanner} centered>
          <Modal.Header closeButton><Modal.Title>Scan Bus QR Code</Modal.Title></Modal.Header>
          <Modal.Body className="scanner-modal-body">
            {scanStatus === 'scanning' && (
              <>
                <QrScanner onScanSuccess={handleScanSuccess} />
                <p className="scanner-warning">
                  <span className="material-icons-outlined">smart_toy</span>
                  AI-powered scanner is active. Please hold steady.
                </p>
              </>
            )}
            {scanStatus === 'success' && (
              <div className="scan-success-view">
                <span className="material-icons-outlined success-icon">check_circle</span>
                <h4>Scan Successful!</h4>
                <p>Please enter your destination to finalize the fare and complete your payment.</p>
              </div>
            )}
          </Modal.Body>
        </Modal>

        <Modal show={showPaymentModal} onHide={closeModalAndReset} centered backdrop="static">
          <Modal.Header closeButton>
            <Modal.Title>{paymentResult.status ? 'Payment Status' : 'Confirm Your Trip'}</Modal.Title>
          </Modal.Header>
          <Modal.Body className="payment-modal-body">
            {renderModalContent()}
          </Modal.Body>
        </Modal>
      </div>
    </PassengerLayout>
  );
}

export default HomePage;