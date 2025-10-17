import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { Modal, Spinner } from 'react-bootstrap';
import QrScanner from '../../components/QrScanner';
import PassengerLayout from '../../layouts/PassengerLayout'; // Use the new layout
import '../../styles/home.css';

// Helper to generate dynamic, realistic schedules for the UI
const generateSchedules = (routes) => {
  const now = new Date();
  let lastDeparture = new Date(now.getTime() + (Math.random() * 5 + 2) * 60000); // First bus in 2-7 mins

  return routes.slice(0, 4).map(() => { // Show max 4 upcoming buses
    const statuses = ['On Time', 'On Time', 'On Time', 'Scheduled', 'Delayed'];
    const currentDeparture = new Date(lastDeparture.getTime());
    const interval = (Math.random() * 15 + 10) * 60000; // Next bus in 10-25 mins
    lastDeparture = new Date(lastDeparture.getTime() + interval);
    
    return {
      departureTime: currentDeparture,
      status: statuses[Math.floor(Math.random() * statuses.length)],
    };
  });
};


function HomePage() {
  const navigate = useNavigate();
  const [balance, setBalance] = useState(0);
  const [loadingBalance, setLoadingBalance] = useState(true);
  const [balanceError, setBalanceError] = useState('');
  const [upcomingBuses, setUpcomingBuses] = useState([]);
  const [busesError, setBusesError] = useState('');
  const [destination, setDestination] = useState("");
  const [fareDetails, setFareDetails] = useState(null);
  const [loadingFare, setLoadingFare] = useState(false);
  const [showScanner, setShowScanner] = useState(false);
  const [suggestions] = useState(["City Center", "Tech Park", "Old Town", "Airport", "University"]);
  const [recentSearches, setRecentSearches] = useState(() => {
    try {
      const saved = localStorage.getItem('recentDestinations');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    const token = localStorage.getItem("token");

    const fetchWalletBalance = async () => {
      setLoadingBalance(true);
      setBalanceError('');
      try {
        const res = await axios.get("http://localhost:5000/api/payments/balance", {
          headers: { Authorization: `Bearer ${token}` }
        });
        setBalance(res.data.balance);
      } catch (err) {
        console.error("Failed to fetch balance.", err);
        setBalanceError('Unable to load wallet balance right now.');
      } finally {
        setLoadingBalance(false);
      }
    };

    const fetchUpcomingBuses = async () => {
        setBusesError('');
        try {
            const res = await axios.get("http://localhost:5000/api/fares", {
                headers: { Authorization: `Bearer ${token}` }
            });
            const schedules = generateSchedules(res.data);
            const buses = res.data.slice(0, 4).map((route, index) => ({
                ...route,
                schedule: schedules[index]
            }));
            setUpcomingBuses(buses);
        } catch (err) {
            console.error("Failed to fetch upcoming buses/routes.", err);
            setBusesError('Unable to load upcoming buses.');
        }
    };

    fetchWalletBalance();
    fetchUpcomingBuses();
  }, []);
  
  const handleGetFare = async () => {
    if (!destination) { alert("Please enter a destination."); return; }
    setLoadingFare(true);
    setFareDetails(null);
    try {
      const token = localStorage.getItem("token");
      const res = await axios.post("http://localhost:5000/api/trips/calculate-fare", 
        { destination }, 
        { headers: { Authorization: `Bearer ${token}` } }
      );
      // Simulate creating a pending trip and navigating
      const pendingTrip = { destination, amount: res.data.amount };
      localStorage.setItem('pendingTrip', JSON.stringify(pendingTrip));
      // Save destination to recent searches (dedup, max 5)
      try {
        const updated = [destination, ...recentSearches.filter(d => d.toLowerCase() !== destination.toLowerCase())].slice(0, 5);
        setRecentSearches(updated);
        localStorage.setItem('recentDestinations', JSON.stringify(updated));
      } catch {}
      navigate('/payment');
    } catch (err) {
      alert(err.response?.data?.msg || "Could not calculate fare.");
    } finally {
      setLoadingFare(false);
    }
  };
  
  const handleScanSuccess = (decodedText) => {
    setShowScanner(false);
    // The QR code should ideally contain a vehicle ID or route ID.
    // For this demo, we'll assume it's a destination name.
    setDestination(decodedText);
  };

  return (
    <PassengerLayout>
      {/* The content inside is the 'children' for the layout */}
      <div className="passenger-home-page">
        {/* --- Greeting Banner --- */}
        <section className="greeting-banner animate-fade-in">
          <div className="greeting-text">
            <span className="material-icons-outlined">waving_hand</span>
            <h2>
              {(() => {
                const hour = new Date().getHours();
                if (hour < 12) return 'Good morning';
                if (hour < 18) return 'Good afternoon';
                return 'Good evening';
              })()} 👋
            </h2>
            <p>Plan your trip and pay seamlessly.</p>
          </div>
        </section>

        {/* --- Wallet Balance Card --- */}
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

        {/* --- Fare Search Card --- */}
        <section className="hero-section animate-fade-in" style={{ animationDelay: '100ms' }}>
          <h1 className="section-title">Where to next?</h1>
          <div className="fare-search-card">
            <div className="input-group-creative">
              <span className="material-icons icon-end">location_on</span>
              <input type="text" value={destination} onChange={(e) => setDestination(e.target.value)} placeholder="Enter your destination" />
            </div>
            {(recentSearches.length > 0 || suggestions.length > 0) && (
              <div className="destination-chips">
                {recentSearches.map((d) => (
                  <button key={`r-${d}`} type="button" className="chip recent" onClick={() => setDestination(d)} title="Recent">
                    <span className="material-icons">history</span>
                    {d}
                  </button>
                ))}
                {suggestions.map((d) => (
                  <button key={`s-${d}`} type="button" className="chip" onClick={() => setDestination(d)}>
                    {d}
                  </button>
                ))}
              </div>
            )}
            {fareDetails && (
              <div className="fare-result">
                Estimated Fare: <span>₹{fareDetails.amount}</span>
              </div>
            )}
            <button className="btn-fare" onClick={handleGetFare} disabled={loadingFare}>
              {loadingFare ? <Spinner as="span" size="sm" /> : "Find Bus & Pay"}
            </button>
          </div>
        </section>
        
        {/* --- Upcoming Buses Section --- */}
        <section className="upcoming-buses-section animate-fade-in" style={{ animationDelay: '200ms' }}>
            <h2 className="section-title">Upcoming Buses</h2>
            <div className="bus-list">
                {upcomingBuses.length > 0 ? upcomingBuses.map(bus => {
                    const diffMinutes = Math.round((bus.schedule.departureTime - new Date()) / 60000);
                    const departsInText = diffMinutes <= 0 ? 'Departed' : `In ${diffMinutes} min`;
                    return (
                        <div key={bus._id} className="bus-card">
                            <div className="bus-card-details">
                                <h4>{bus.routeName}</h4>
                                <p>To: <strong>{bus.endPoint}</strong></p>
                            </div>
                            <div className="bus-card-timing">
                                <span className="departs-in">{departsInText}</span>
                                <span className={`status-badge ${bus.schedule.status.toLowerCase().replace(' ', '-')}`}>{bus.schedule.status}</span>
                            </div>
                        </div>
                    );
                }) : (
                  busesError ? (
                    <p className="no-buses-msg">{busesError}</p>
                  ) : (
                    <p className="no-buses-msg">No upcoming buses found.</p>
                  )
                )}
            </div>
        </section>

        {/* --- Quick Actions Section --- */}
        <section className="quick-actions animate-fade-in" style={{ animationDelay: '300ms' }}>
          <div className="action-card" onClick={() => setShowScanner(true)}>
            <div className="action-icon scan-icon"><span className="material-icons">qr_code_scanner</span></div>
            <h4>Scan & Go</h4>
            <p>Scan bus QR for quick entry</p>
          </div>
          <div className="action-card" onClick={() => navigate('/timings')}>
            <div className="action-icon book-icon"><span className="material-icons">schedule</span></div>
            <h4>Schedules</h4>
            <p>View all routes and timings</p>
          </div>
          <div className="action-card" onClick={() => navigate('/history')}>
            <div className="action-icon book-icon"><span className="material-icons">history</span></div>
            <h4>History</h4>
            <p>See your recent trips</p>
          </div>
        </section>

        <Modal show={showScanner} onHide={() => setShowScanner(false)} centered>
          <Modal.Header closeButton><Modal.Title>Scan Bus QR Code</Modal.Title></Modal.Header>
          <Modal.Body>
            {showScanner && <QrScanner onScanSuccess={handleScanSuccess} />}
            <p className="text-center mt-3">Point your camera at the QR code</p>
          </Modal.Body>
        </Modal>
      </div>
    </PassengerLayout>
  );
}

export default HomePage;