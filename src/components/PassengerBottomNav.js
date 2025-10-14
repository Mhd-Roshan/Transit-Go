import React from 'react';
import { Link, useLocation } from 'react-router-dom';

const PassengerBottomNav = () => {
    const location = useLocation();
    const isActive = (path) => location.pathname === path;

    return (
        <nav className="passenger-bottom-nav">
            <Link to="/home" className={`nav-item ${isActive('/home') ? 'active' : ''}`}>
                <span className="material-icons">home</span>
                <span className="nav-label">Home</span>
            </Link>
            <Link to="/timings" className={`nav-item ${isActive('/timings') ? 'active' : ''}`}>
                <span className="material-icons">schedule</span>
                <span className="nav-label">Timing</span>
            </Link>
            <Link to="/payment" className={`nav-item ${isActive('/payment') ? 'active' : ''}`}>
                <span className="material-icons">payment</span>
                <span className="nav-label">Payment</span>
            </Link>
            <Link to="/history" className={`nav-item ${isActive('/history') ? 'active' : ''}`}>
                <span className="material-icons">history</span>
                <span className="nav-label">History</span>
            </Link>
            <Link to="/report" className={`nav-item ${isActive('/report') ? 'active' : ''}`}>
                <span className="material-icons">report</span>
                <span className="nav-label">Report</span>
            </Link>
        </nav>
    );
};

export default PassengerBottomNav;