import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import jwtDecode from "jwt-decode";
import { Spinner } from "react-bootstrap";
import AuthLayout from "../layouts/AuthLayout";
import "../styles/login.css";

function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [passwordVisible, setPasswordVisible] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await axios.post("http://localhost:5000/api/auth/login", {
        email,
        password,
      });
      const { token } = res.data;
      localStorage.setItem("token", token);
      const decodedToken = jwtDecode(token);
      const userRole = decodedToken.user.role;

      if (userRole === "Admin") navigate("/admin/dashboard");
      else if (userRole === "Operator") navigate("/operator/dashboard");
      else if (userRole === "Passenger") navigate("/home");
      else setError("Login successful, but role is unrecognized.");
    } catch (err) {
      const message = err.response?.data?.msg || "An unexpected error occurred.";
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const togglePasswordVisibility = () => {
    setPasswordVisible(!passwordVisible);
  };

  return (
    <AuthLayout>
      <div className="login-card glass-effect">
        <div className="brand">
          <span className="material-icons">directions_bus</span> TransitGo
        </div>
        <h2 className="welcome">Welcome Back</h2>
        <p className="subtitle">Log in to your account</p>

        <form onSubmit={handleLogin}>
          {error && <p className="error-message">{error}</p>}

          <label htmlFor="email">Email Address</label>
          {/* --- CHANGE: Wrap the email input for consistent styling --- */}
          <div className="input-wrapper">
            <input
              type="email"
              id="email"
              className="form-control"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={loading}
            />
          </div>

          <div className="password-group">
            <label htmlFor="password">Password</label>
            <a href="/forgot-password" className="forgot">Forgot Password?</a>
          </div>

          {/* This wrapper now shares styles with the email wrapper */}
          <div className="input-wrapper password-wrapper">
            <input
              type={passwordVisible ? "text" : "password"}
              id="password"
              className="form-control"
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              disabled={loading}
            />
            <span className="password-toggle-icon" onClick={togglePasswordVisibility}>
              <span className="material-icons">
                {passwordVisible ? "visibility_off" : "visibility"}
              </span>
            </span>
          </div>

          <button type="submit" className="btn-primary" disabled={loading}>
            {loading ? <Spinner as="span" animation="border" size="sm" /> : "Login"}
          </button>
        </form>

        <p className="signup">
          Don't have an account? <Link to="/signup">Sign Up</Link>
        </p>
      </div>
    </AuthLayout>
  );
}

export default LoginPage;