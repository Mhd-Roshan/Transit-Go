import React, { useState, useEffect, useCallback } from "react";
import axios from "axios";
import { Container, Card, Navbar, Spinner, Form, Button, Alert, Nav, Image } from "react-bootstrap";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { BsCheckCircleFill, BsSignpostSplit } from "react-icons/bs";
import "../../styles/opdashboard.css";

// Reusable bottom navigation component
const OperatorBottomNav = () => {
  const location = useLocation();
  const isActive = (path) => location.pathname === path;

  return (
    <Navbar bg="white" className="shadow-sm mt-auto dashboard-footer">
      <Container className="justify-content-around">
        <Nav fill className="w-100">
          <Nav.Link as={Link} to="/operator/dashboard" className={`d-flex flex-column align-items-center ${isActive('/operator/dashboard') ? 'text-primary' : 'text-secondary'}`}>
            <span className="material-icons">dashboard</span>
            <small>Dashboard</small>
          </Nav.Link>
          <Nav.Link as={Link} to="/operator/routes" className={`d-flex flex-column align-items-center ${isActive('/operator/routes') ? 'text-primary' : 'text-secondary'}`}>
            <BsSignpostSplit size={20} />
            <small>Routes</small>
          </Nav.Link>
        </Nav>
      </Container>
    </Navbar>
  );
};

const Dashboard = () => {
  const navigate = useNavigate();
  const [assignment, setAssignment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [completedStops, setCompletedStops] = useState(new Set());
  const [collectionAmount, setCollectionAmount] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState({ success: false, message: "" });

  const schedule = [
    { time: "8:00 AM", location: "Start Point" },
    { time: "8:15 AM", location: "City Park" },
    { time: "8:30 AM", location: "Main Street" },
    { time: "8:45 AM", location: "End Point" },
  ];

  useEffect(() => {
    const fetchMyAssignment = async () => {
      setLoading(true);
      setError("");
      try {
        const token = localStorage.getItem("token");
        const res = await axios.get("http://localhost:5000/api/assignments/my-assignment", {
          headers: { Authorization: `Bearer ${token}` },
        });
        setAssignment(res.data);
      } catch (err) {
        setError(err.response?.status === 404
          ? "You have not been assigned a vehicle yet."
          : "Could not fetch your assignment details."
        );
      } finally {
        setLoading(false);
      }
    };
    fetchMyAssignment();
  }, []);

  const handleCompleteStop = useCallback((index) => {
    setCompletedStops(prev => new Set(prev).add(index));
  }, []);

  const handleSubmitCollection = async (e) => {
    e.preventDefault();
    if (!collectionAmount || collectionAmount <= 0) {
      setSubmitStatus({ success: false, message: "Please enter a valid amount." });
      return;
    }
    setIsSubmitting(true);
    setSubmitStatus({ success: false, message: "" });
    try {
      const token = localStorage.getItem("token");
      await axios.post("http://localhost:5000/api/collections", 
        { amount: collectionAmount, collectionDate: new Date().toISOString() },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setSubmitStatus({ success: true, message: "Collection submitted successfully!" });
      setCollectionAmount("");
    } catch (err) {
      setSubmitStatus({ success: false, message: err.response?.data?.msg || "Submission failed. Please try again." });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    navigate("/");
  };

  const renderContent = () => {
    if (loading) {
      return (
        <div className="status-container">
          <Spinner animation="border" variant="primary" />
          <p className="mt-2 text-muted">Loading your assignment...</p>
        </div>
      );
    }
    if (error) {
      return (
        <div className="status-container">
          <Card className="shadow-sm p-4 text-center">
            <Card.Body className="error-text">{error}</Card.Body>
          </Card>
        </div>
      );
    }

    // --- THE CRITICAL FIX IS HERE ---
    // We must check that 'assignment' exists AND that 'assignment.vehicle' exists.
    if (assignment && assignment.vehicle) {
      return (
        <>
          <Card className="mb-4 dashboard-card">
            <Card.Body>
              <Card.Title>Assigned Vehicle</Card.Title>
              <p className="vehicle-id">{assignment.vehicle.vehicleId}</p>
              <p className="vehicle-model text-muted">{assignment.vehicle.model}</p>
            </Card.Body>
          </Card>
          <Card className="mb-4 dashboard-card">
            <Card.Body>
              <Card.Title>Submit Daily Collection</Card.Title>
              <Form onSubmit={handleSubmitCollection}>
                <Form.Group controlId="collectionAmount">
                  <Form.Label>Today's Total Revenue</Form.Label>
                  <Form.Control 
                    type="number"
                    placeholder="Enter amount in ₹"
                    value={collectionAmount}
                    onChange={(e) => setCollectionAmount(e.target.value)}
                    disabled={isSubmitting}
                  />
                </Form.Group>
                <Button variant="primary" type="submit" className="w-100 mt-3" disabled={isSubmitting}>
                  {isSubmitting ? <Spinner as="span" size="sm" /> : "Submit Collection"}
                </Button>
              </Form>
              {submitStatus.message && (
                <Alert variant={submitStatus.success ? 'success' : 'danger'} className="mt-3">
                  {submitStatus.message}
                </Alert>
              )}
            </Card.Body>
          </Card>
          <Card className="dashboard-card">
            <Card.Body>
              <Card.Title>Schedule Tracker</Card.Title>
              <div className="mt-3">
                {schedule.map((item, index) => (
                  <div key={index} className={`schedule-item ${completedStops.has(index) ? 'completed' : ''}`}>
                    <div className="schedule-details">
                      <div className="fw-bold">{item.time}</div>
                      <div className="text-secondary">{item.location}</div>
                    </div>
                    {!completedStops.has(index) ? (
                      <Button size="sm" variant="outline-primary" onClick={() => handleCompleteStop(index)}>Complete</Button>
                    ) : (
                      <BsCheckCircleFill className="completed-icon" />
                    )}
                  </div>
                ))}
              </div>
            </Card.Body>
          </Card>
        </>
      );
    }
    
    // Handle the edge case where the assignment is "broken" (vehicle was deleted)
    if (assignment && !assignment.vehicle) {
        return (
            <div className="status-container">
                <Card className="shadow-sm p-4 text-center">
                    <Card.Body className="error-text">
                        Your assigned vehicle may have been removed by an administrator. Please contact support.
                    </Card.Body>
                </Card>
            </div>
        );
    }

    return null; // Return null if there's no assignment or it's broken
  };

  return (
    <div className="dashboard">
      <Navbar bg="white" className="shadow-sm sticky-top dashboard-header">
        <Container>
          <Navbar.Brand className="fw-bold d-flex align-items-center">
            <span className="material-icons text-primary me-2">directions_bus</span>
            TransitGo
          </Navbar.Brand>
          <Nav className="ms-auto d-flex flex-row align-items-center">
            <Image src="https://i.pravatar.cc/150?img=5" roundedCircle width={32} height={32} className="me-3" />
            <Button variant="outline-danger" size="sm" onClick={handleLogout}>Logout</Button>
          </Nav>
        </Container>
      </Navbar>

      <Container className="flex-grow-1 my-4">{renderContent()}</Container>
      
      <OperatorBottomNav />
    </div>
  );
};

export default Dashboard;