import React from 'react';
import { Navbar, Container, Button } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import '../styles/landing.css';

const LandingHeader = () => {
  const navigate = useNavigate();
  const goToLogin = () => navigate('/login');

  return (
    <Navbar expand="md" fixed="top" className="landing-header">
      <Container className="d-flex justify-content-between align-items-center">

        {/* Logo */}
        <div className="header-brand d-flex align-items-center">
          <span className="material-icons me-2" style={{ color: 'white' }}>directions_bus</span>
          <h1 className="m-0 text-white">TransitGo</h1>
        </div>

        {/* Center nav links */}
        <div className="d-none d-md-flex gap-4">
          <a href="#about" className="nav-link-custom">About</a>
          <a href="#contact" className="nav-link-custom">Contact</a>
        </div>

        {/* Login button */}
        <Button variant="primary" className="btn-sm" onClick={() => navigate('/login')}>
            Login
        </Button>

      </Container>
    </Navbar>
  );
};

function LandingPage() {
  const navigate = useNavigate();
  const goToSignup = () => navigate('/signup');

  return (
    <div className="landing-page">
      <LandingHeader />

      <main className="hero-section">
        {/* --- Background Video --- */}
        <video autoPlay muted loop playsInline className="background-video">
          <source src="/t7.mp4" type="video/mp4" />
          Your browser does not support the video tag.
        </video>

        <div className="hero-overlay"></div>

        <Container className="hero-content">
          <h1 className="hero-title" style={{ color: 'white' }}>Your Next Adventure Awaits</h1>
          <p className="hero-subtitle">Effortless Bus Travel Starts Here</p>
          <Button
            variant="primary"
            className="btn-get-started btn-sm mt-4"
            onClick={goToSignup}
          >
            Get Started
          </Button>
        </Container>
      </main>
    </div>
  );
}

export default LandingPage;
