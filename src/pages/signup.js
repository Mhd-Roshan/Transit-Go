import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import AuthLayout from "../layouts/AuthLayout"; // Import the new layout
import "../styles/signup.css";

function SignupPage() {
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    phoneNumber: "",
    password: "",
    confirmPassword: "",
    role: "Passenger",
  });

  const [errors, setErrors] = useState({});
  const [apiError, setApiError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };
  const handleRoleChange = (role) => {
    setFormData({ ...formData, role });
  };

  const validateForm = () => {
    const { fullName, email, phoneNumber, password, confirmPassword } = formData;
    const newErrors = {};
    if (!fullName.trim()) newErrors.fullName = "Full Name is required";
    if (!email) newErrors.email = "Email is required";
    else if (!/\S+@\S+\.\S+/.test(email)) newErrors.email = "Email address is invalid";
    if (!phoneNumber) newErrors.phoneNumber = "Phone number is required";
    else if (!/^\d{10}$/.test(phoneNumber)) newErrors.phoneNumber = "Must be a 10-digit number";
    if (!password) newErrors.password = "Password is required";
    else if (password.length < 6) newErrors.password = "Password must be at least 6 characters";
    if (password !== confirmPassword) newErrors.confirmPassword = "Passwords do not match";
    return newErrors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setApiError("");
    setSuccessMessage("");
    const formErrors = validateForm();
    if (Object.keys(formErrors).length > 0) {
      setErrors(formErrors);
      return;
    }
    setErrors({});
    setIsSubmitting(true);
    try {
      const res = await axios.post("http://localhost:5000/api/auth/signup", {
        fullName: formData.fullName,
        email: formData.email,
        phoneNumber: `+91${formData.phoneNumber}`,
        role: formData.role,
        password: formData.password,
      });
      setSuccessMessage(res.data.msg);
      setTimeout(() => navigate("/login"), 2500);
    } catch (err) {
      setApiError(err.response?.data?.msg || "Failed to sign up. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AuthLayout>
      <div className="signup-card text-center">
        <div className="signup-header">
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
            <span className="material-icons app-icon">directions_bus</span>
            <h2 className="app-title">TransitGo</h2>
          </div>
          <h3 className="page-title">Create an Account</h3>
          <p className="page-subtitle">Choose your role to get started.</p>
        </div>

        {apiError && <div className="banner error-box">{apiError}</div>}
        {successMessage && <div className="banner success-box">{successMessage}</div>}

        <div className="role-selector">
          <button type="button" className={`role-btn ${formData.role === "Passenger" ? "active" : ""}`} onClick={() => handleRoleChange("Passenger")}>
            <span className="material-icons">person</span>Passenger
          </button>
          <button type="button" className={`role-btn ${formData.role === "Operator" ? "active" : ""}`} onClick={() => handleRoleChange("Operator")}>
            <span className="material-icons">engineering</span>Operator
          </button>
        </div>

        <form onSubmit={handleSubmit} noValidate>
          <div className="form-group">
            <div className={`input-wrapper ${errors.fullName ? 'input-error' : ''}`}>
              <input type="text" name="fullName" placeholder="Full Name" className="form-control" value={formData.fullName} onChange={handleInputChange} />
            </div>
            {errors.fullName && <p className="input-error-message">{errors.fullName}</p>}
          </div>
          <div className="form-group">
            <div className={`input-wrapper ${errors.email ? 'input-error' : ''}`}>
              <input type="email" name="email" placeholder="Email Address" className="form-control" value={formData.email} onChange={handleInputChange} />
            </div>
            {errors.email && <p className="input-error-message">{errors.email}</p>}
          </div>
          <div className="form-group">
            <div className={`phone-input-group ${errors.phoneNumber ? 'input-error' : ''}`}>
              <span className="country-code">+91</span>
              <input type="tel" name="phoneNumber" placeholder="10-Digit Phone Number" className="form-control" value={formData.phoneNumber} onChange={handleInputChange} maxLength="10" />
            </div>
            {errors.phoneNumber && <p className="input-error-message">{errors.phoneNumber}</p>}
          </div>
          <div className="form-group">
            <div className={`input-wrapper ${errors.password ? 'input-error' : ''}`}>
              <input type="password" name="password" placeholder="Password (min. 6 characters)" className="form-control" value={formData.password} onChange={handleInputChange} />
            </div>
            {errors.password && <p className="input-error-message">{errors.password}</p>}
          </div>
          <div className="form-group">
            <div className={`input-wrapper ${errors.confirmPassword ? 'input-error' : ''}`}>
              <input type="password" name="confirmPassword" placeholder="Confirm Password" className="form-control" value={formData.confirmPassword} onChange={handleInputChange} />
            </div>
            {errors.confirmPassword && <p className="input-error-message">{errors.confirmPassword}</p>}
          </div>
          <button type="submit" className="submit-btn" disabled={isSubmitting}>
            {isSubmitting ? 'Creating Account...' : 'Sign Up'}
          </button>
        </form>

        <p className="login-link">
          Already have an account? <Link to="/login">Log In</Link>
        </p>
      </div>
    </AuthLayout>
  );
}

export default SignupPage;