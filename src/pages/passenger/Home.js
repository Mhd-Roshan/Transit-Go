import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { Modal, Spinner } from 'react-bootstrap';
import QrScanner from '../../components/QrScanner';
import PassengerLayout from '../../layouts/PassengerLayout';
import '../../styles/home.css';

function HomePage() {
  const navigate = useNavigate();
  const [balance, setBalance] = useState(0);
  const [loadingBalance, setLoadingBalance] = useState(true);
  const [balanceError, setBalanceError] = useState('');
  const [upcomingBuses, setUpcomingBuses] = useState([]);
  const [busesError, setBusesError] = useState('');
  const [destination, setDestination] = useState("");
  const [loadingFare, setLoadingFare] = useState(false);
  const [showScanner, setShowScanner] = useState(false);
  const [activeTab, setActiveTab] = useState('search');

  // State for the post-scan payment modal
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [scannedVehicleId, setScannedVehicleId] = useState(null);
  const [destinationInModal, setDestinationInModal] = useState("");
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [paymentResult, setPaymentResult] = useState({ status: '', message: '' });

  useEffect(() => {
    const token = localStorage.getItem("token");

    const fetchWalletBalance = async () => {
      setLoadingBalance(true);
      setBalanceError('');
      try {
        const res = await axios.get("http://localhost:5000/api/payments/balance", { headers: { Authorization: `Bearer ${token}` } });
        setBalance(res.data.balance);
      } catch (err) {
        setBalanceError('Unable to load wallet.');
      } finally {
        setLoadingBalance(false);
      }
    };

    const fetchUpcomingBuses = async () => {
        setBusesError('');
        try {
            const res = await axios.get("http://localhost:5000/api/assignments/active", {
                headers: { Authorization: `Bearer ${token}` }
            });
            setUpcomingBuses(res.data.slice(0, 4));
        } catch (err) {
            console.error("Failed to fetch upcoming buses.", err);
            setBusesError('Unable to load upcoming buses.');
        }
    };

    fetchWalletBalance();
    fetchUpcomingBuses();
  }, []);
  
  const handleGetFare = async () => {
    if (!destination) { alert("Please enter a destination."); return; }
    setLoadingFare(true);
    try {
      const token = localStorage.getItem("token");
      const res = await axios.post("http://localhost:5000/api/trips/calculate-fare", { destination }, { headers: { Authorization: `Bearer ${token}` } });
      const pendingTrip = { destination, amount: res.data.amount };
      localStorage.setItem('pendingTrip', JSON.stringify(pendingTrip));
      navigate('/payment');
    } catch (err) {
      alert(err.response?.data?.msg || "Could not calculate fare.");
    } finally {
      setLoadingFare(false);
    }
  };
  
  const handleScanSuccess = (decodedText) => {
    setShowScanner(false);
    try {
      let vehicleId = null;
      if (decodedText.includes('vehicle=')) {
        const urlParams = new URLSearchParams(decodedText.split('?')[1]);
        vehicleId = urlParams.get('vehicle');
      }

      if (vehicleId) {
        setScannedVehicleId(vehicleId);
        setShowPaymentModal(true);
        setDestinationInModal("");
        setPaymentResult({ status: '', message: '' });
      } else {
        setDestination(decodedText);
        setActiveTab('search');
        alert(`Scanned destination: ${decodedText}`);
      }
    } catch (error) {
      console.error("Error processing QR Code:", error);
      alert("Could not process the scanned QR Code.");
    }
  };

  const handleConfirmPayment = async () => {
    if (!destinationInModal) {
      setPaymentResult({ status: 'error', message: 'Please enter a destination.' });
      return;
    }
    setIsProcessingPayment(true);
    setPaymentResult({ status: '', message: '' });
    const token = localStorage.getItem("token");
    
    try {
      // Step 1: Calculate Fare
      const fareRes = await axios.post(
        "http://localhost:5000/api/trips/calculate-fare",
        { destination: destinationInModal },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const fareAmount = fareRes.data.amount;

      // Step 2: Charge the wallet
      const chargeRes = await axios.post(
        "http://localhost:5000/api/payments/charge",
        {
          amount: fareAmount,
          description: `Trip to ${destinationInModal} (Vehicle ID: ...${scannedVehicleId.slice(-6)})`
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      // --- THIS IS THE RESTORED/CRITICAL FIX ---
      // Step 3: Save the trip to history AFTER payment is successful
      await axios.post(
        "http://localhost:5000/api/trips",
        {
          destination: destinationInModal,
          fare: fareAmount
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      // Step 4: Handle UI success (only if all steps above succeeded)
      setPaymentResult({ status: 'success', message: `${chargeRes.data.message} Fare: ₹${fareAmount}` });
      setBalance(chargeRes.data.newBalance);

    } catch (err) {
      // Step 5: Catch ANY error from the process and show it to the user
      const errorMessage = err.response?.data?.msg || "An unexpected error occurred. Your trip was not recorded.";
      console.error("Payment or Trip Save Error:", err);
      alert(`Error: ${errorMessage}`);
      
      setPaymentResult({ status: 'error', message: errorMessage });
    } finally {
      setIsProcessingPayment(false);
    }
  };

  const closeModalAndReset = () => {
    setShowPaymentModal(false);
    setScannedVehicleId(null);
  };

  return (
    <PassengerLayout>
      <div>
        {/* The Greeting Banner has been removed */}

        <section className="balance-overview-section animate-fade-in">
          <div className="balance-card">
            <div className="balance-info">
              <span className="balance-label">Your Wallet</span>
              <h2 className="balance-amount">
                {loadingBalance ? <Spinner animation="border" size="sm" /> : `₹${balance.toLocaleString('en-IN')}`}
              </h2>
              {balanceError && <small className="text-muted">{balanceError}</small>}
            </div>
            <button className="btn-add-money" onClick={() => navigate('/payment')}>
              <span className="material-icons">add_circle</span> Add Money
            </button>
          </div>
        </section>

        <section className="trip-starter-section animate-fade-in" style={{ animationDelay: '100ms' }}>
          <div className="trip-starter-card">
            <div className="tab-nav">
              <button className={`tab-btn ${activeTab === 'search' ? 'active' : ''}`} onClick={() => setActiveTab('search')}>
                  <span className="material-icons-outlined">search</span> Search Destination
              </button>
              <button className={`tab-btn ${activeTab === 'scan' ? 'active' : ''}`} onClick={() => { setActiveTab('scan'); setShowScanner(true); }}>
                  <span className="material-icons-outlined">qr_code_scanner</span> Scan & Pay
              </button>
            </div>
            <div className="tab-content">
              {activeTab === 'search' && (
                <div className="search-tab-content animate-fade-in">
                  <div className="input-group-creative">
                    <span className="material-icons-outlined">location_on</span>
                    <input type="text" value={destination} onChange={(e) => setDestination(e.target.value)} placeholder="Enter your destination" />
                  </div>
                  <button className="btn-fare" onClick={handleGetFare} disabled={loadingFare}>
                    {loadingFare ? <Spinner as="span" size="sm" /> : "Find Bus & Pay"}
                  </button>
                </div>
              )}
              {activeTab === 'scan' && (
                <div className="scan-tab-content animate-fade-in">
                    <div className="scan-tab-icon">
                        <span className="material-icons-outlined">qr_code_2</span>
                    </div>
                    <h4>Ready to Scan</h4>
                    <p>Click the 'Scan & Pay' tab again to open your camera and scan a bus QR code.</p>
                </div>
              )}
            </div>
          </div>
        </section>
        
        <section className="upcoming-buses-section animate-fade-in" style={{ animationDelay: '200ms' }}>
            <h2 className="section-title">Upcoming Buses</h2>
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
                  busesError ? <p className="no-buses-msg">{busesError}</p> : <p className="no-buses-msg">No active buses found. Check back later.</p>
                )}
            </div>
        </section>

        <section className="quick-actions-section animate-fade-in" style={{ animationDelay: '300ms' }}>
          <h2 className="section-title">More Actions</h2>
          <div className="quick-actions">
            <div className="action-card" onClick={() => navigate('/timings')}><div className="action-icon book-icon"><span className="material-icons-outlined">schedule</span></div><h4>Schedules</h4><p>View all routes</p></div>
            <div className="action-card" onClick={() => navigate('/history')}><div className="action-icon book-icon"><span className="material-icons-outlined">history</span></div><h4>History</h4><p>See your trips</p></div>
          </div>
        </section>

        <Modal show={showScanner} onHide={() => setShowScanner(false)} centered>
          <Modal.Header closeButton><Modal.Title>Scan Bus QR Code</Modal.Title></Modal.Header>
          <Modal.Body>
            {showScanner && <QrScanner onScanSuccess={handleScanSuccess} />}
            <p className="text-center mt-3">Point your camera at the QR code on the bus.</p>
          </Modal.Body>
        </Modal>

        <Modal show={showPaymentModal} onHide={closeModalAndReset} centered backdrop="static">
          <Modal.Header closeButton>
            <Modal.Title>Confirm Your Trip</Modal.Title>
          </Modal.Header>
          <Modal.Body className="payment-modal-body">
            {paymentResult.status ? (
              <div className={`payment-result ${paymentResult.status}`}>
                <span className="material-icons-outlined result-icon">
                  {paymentResult.status === 'success' ? 'check_circle' : 'error'}
                </span>
                <h4>{paymentResult.status === 'success' ? 'Payment Successful!' : 'Payment Failed'}</h4>
                <p>{paymentResult.message}</p>
                <button className="btn-fare" onClick={closeModalAndReset}>Close</button>
              </div>
            ) : (
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
                    disabled={isProcessingPayment}
                  />
                </div>

                <button className="btn-fare" onClick={handleConfirmPayment} disabled={isProcessingPayment}>
                  {isProcessingPayment ? <Spinner as="span" size="sm" /> : "Calculate Fare & Auto-Pay"}
                </button>
              </>
            )}
          </Modal.Body>
        </Modal>
      </div>
    </PassengerLayout>
  );
}

export default HomePage;