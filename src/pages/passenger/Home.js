import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { Modal, Spinner, Image } from 'react-bootstrap';
import jwtDecode from 'jwt-decode';
import QrScanner from '../../components/QrScanner';
import PassengerBottomNav from '../../components/PassengerBottomNav';
import '../../styles/home.css';

// --- NEW: Modern Header Component ---
const ModernPassengerHeader = ({ user, onLogout }) => (
  <div className="header-container">
    <header className="passenger-header">
      <div className="user-info">
        <Image src={`https://i.pravatar.cc/150?u=${user?.id}`} alt="User" className="profile-pic" roundedCircle />
        <div>
          <span>Welcome back,</span>
          <h3>{user?.name || 'Passenger'}</h3>
        </div>
      </div>
      <button onClick={onLogout} className="header-action-btn" title="Logout">
        <span className="material-icons">logout</span>
      </button>
    </header>
  </div>
);


function HomePage() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [origin, setOrigin] = useState("Getting Location...");
  const [originCoords, setOriginCoords] = useState(null);
  const [locationError, setLocationError] = useState('');
  const [destination, setDestination] = useState("");
  const [fareDetails, setFareDetails] = useState(null);
  const [loadingFare, setLoadingFare] = useState(false);
  const [recentTrips, setRecentTrips] = useState([]);
  const [showScanner, setShowScanner] = useState(false);

  const handleGetCurrentLocation = () => {
    setOrigin("Getting Location...");
    setLocationError('');
    if (!navigator.geolocation) {
      setLocationError("Geolocation is not supported by your browser.");
      setOrigin("Location Unavailable");
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setOriginCoords({ latitude: position.coords.latitude, longitude: position.coords.longitude });
        setOrigin("My Current Location");
      },
      () => {
        setLocationError("Unable to retrieve your location.");
        setOrigin("Location Denied");
      }
    );
  };

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      const decodedToken = jwtDecode(token);
      setUser({ name: decodedToken.user.fullName, id: decodedToken.user.id });
      handleGetCurrentLocation();
    } else {
      navigate('/login');
    }

    const fetchRecentTrips = async () => {
      if (!token) return;
      try {
        const res = await axios.get("http://localhost:5000/api/trips/my-trips", {
          headers: { Authorization: `Bearer ${token}` }
        });
        setRecentTrips(res.data);
      } catch (err) {
        console.error("Failed to fetch recent trips.", err);
      }
    };
    fetchRecentTrips();
  }, [navigate]);
  
  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/login');
  };

  const handleGetFare = async () => {
    // ... (Your existing fare logic is correct)
    if (!originCoords) { alert("Could not determine your starting location."); return; }
    if (!destination) { alert("Please enter a destination."); return; }
    setLoadingFare(true);
    setFareDetails(null);
    try {
      const token = localStorage.getItem("token");
      // Note: Make sure this backend route exists and works as expected.
      const res = await axios.post("http://localhost:5000/api/trips/calculate-fare", { destination }, { headers: { Authorization: `Bearer ${token}` } });
      setFareDetails(res.data);
    } catch (err) {
      alert(err.response?.data?.msg || "Could not calculate fare.");
    } finally {
      setLoadingFare(false);
    }
  };
  
  const handleScanSuccess = (decodedText) => {
    setShowScanner(false);
    // Assuming the QR code contains the destination name
    setDestination(decodedText);
  };

  const handleSwapLocations = () => {
    if (origin === "My Current Location") {
      alert("Cannot swap with current location. Please enter a manual origin first.");
      return;
    }
    setOrigin(destination);
    setDestination(origin);
  };

  return (
    <div className="passenger-home-page">
      <ModernPassengerHeader user={user} onLogout={handleLogout} />
      
      <main className="passenger-main-content">
        <section className="hero-section animate-fade-in" style={{ animationDelay: '100ms' }}>
          <h1>Where to next?</h1>
          <div className="fare-search-card">
            <div className="input-row">
              <div className="input-group-creative">
                <span className="material-icons icon-start">trip_origin</span>
                <input type="text" value={origin} onChange={(e) => setOrigin(e.target.value)} />
                <button className="location-btn" onClick={handleGetCurrentLocation} title="Refresh Location">
                  <span className="material-icons">my_location</span>
                </button>
              </div>
              <button className="swap-btn" onClick={handleSwapLocations}><span className="material-icons">swap_vert</span></button>
              <div className="input-group-creative">
                <span className="material-icons icon-end">location_on</span>
                <input type="text" value={destination} onChange={(e) => setDestination(e.target.value)} placeholder="Enter destination" />
              </div>
            </div>
            {locationError && <p className="location-error">{locationError}</p>}
            {fareDetails && (
              <div className="fare-result">
                Estimated Fare: <span>₹{fareDetails.amount}</span>
              </div>
            )}
            <button className="btn-fare" onClick={handleGetFare} disabled={loadingFare}>
              {loadingFare ? <Spinner as="span" size="sm" /> : "Get Fare"}
            </button>
          </div>
        </section>

        <section className="quick-actions animate-fade-in" style={{ animationDelay: '200ms' }}>
          <div className="action-card" onClick={() => setShowScanner(true)}>
            <div className="action-icon scan-icon"><span className="material-icons">qr_code_scanner</span></div>
            <h4>Scan & Go</h4>
            <p>Scan bus QR for quick entry</p>
          </div>
          <div className="action-card">
            <div className="action-icon book-icon"><span className="material-icons">book_online</span></div>
            <h4>Book Ticket</h4>
            <p>Pre-book your seat in advance</p>
          </div>
        </section>

        <section className="recent-trips-section animate-fade-in" style={{ animationDelay: '300ms' }}>
          <h2>Recent Trips</h2>
          {recentTrips.length > 0 ? (
            <div className="trips-list">
              {recentTrips.map(trip => (
                <div key={trip._id} className="trip-item">
                  <div className="trip-icon"><span className="material-icons">directions_bus</span></div>
                  <div className="trip-details">
                    <p className="trip-route">{trip.origin || 'Start'} to {trip.destination}</p>
                    <p className="trip-date">{new Date(trip.tripDate).toLocaleDateString()}</p>
                  </div>
                  <div className="trip-fare">₹{trip.fare}</div>
                </div>
              ))}
            </div>
          ) : (
            <p className="no-trips">Your recent trips will appear here.</p>
          )}
        </section>
      </main>

      <PassengerBottomNav />

      <Modal show={showScanner} onHide={() => setShowScanner(false)} centered>
        <Modal.Header closeButton><Modal.Title>Scan Bus QR Code</Modal.Title></Modal.Header>
        <Modal.Body>
          {showScanner && <QrScanner onScanSuccess={handleScanSuccess} />}
          <p className="text-center mt-3">Point your camera at the QR code</p>
        </Modal.Body>
      </Modal>
    </div>
  );
}

export default HomePage;