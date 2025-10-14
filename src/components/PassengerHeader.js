import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Image } from 'react-bootstrap'; // Keep this for the rounded profile picture

const PassengerHeader = ({ user }) => {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/');
  };

  return (
    <header className="passenger-header-creative">
      <div className="user-greeting">
        <Image src="https://i.pravatar.cc/150?img=1" alt="User" className="profile-pic" roundedCircle />
        <div>
          <span>Welcome back,</span>
          <h3>{user?.name || 'Passenger'}</h3>
        </div>
      </div>
      <button onClick={handleLogout} className="header-icon-btn" title="Logout">
        <span className="material-icons">logout</span>
      </button>
    </header>
  );
};

export default PassengerHeader;