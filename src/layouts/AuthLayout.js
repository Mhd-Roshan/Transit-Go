import React from 'react';
import '../styles/authLayout.css'; // We will create this new CSS file

// This component renders the consistent background and overlay.
// The 'children' prop will be either the LoginPage or SignupPage card.
const AuthLayout = ({ children }) => {
  return (
    // We use '/t5.jpg' from the login page for a consistent background
    <div className="auth-wrapper" style={{ backgroundImage: `url('/t5.jpg')` }}>
      <div className="auth-overlay"></div>
      {/* This renders the actual login or signup card */}
      {children}
    </div>
  );
};

export default AuthLayout;