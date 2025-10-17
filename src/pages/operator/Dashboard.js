import React, { useState, useEffect } from "react";
import axios from "axios";
import { Card, Spinner, Form, Button, Alert } from "react-bootstrap"; 
import QRCode from "react-qr-code";
import { BsCheckCircleFill } from "react-icons/bs";
import OperatorLayout from "../../layouts/OperatorLayout"; // The layout must be imported
import { useTrip } from "../../context/TripContext"; 
import "../../styles/opdashboard.css";

const Dashboard = () => {
  const [assignment, setAssignment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [collectionAmount, setCollectionAmount] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState({ success: false, message: "" });
  
  // Get the shared state from the context. It's okay if this is unused for now.
  const { completedStops } = useTrip();
  
  // Using an extended schedule to ensure the page is scrollable for testing
  const schedule = [
    { time: "8:00 AM", location: "Start Point" },
    { time: "8:15 AM", location: "City Park" },
    { time: "8:30 AM", location: "Main Street" },
    { time: "8:45 AM", location: "Downtown Central" },
    { time: "9:00 AM", location: "Westside Mall" },
    { time: "9:15 AM", location: "North Bridge" },
    { time: "9:30 AM", location: "University Campus" },
    { time: "9:45 AM", location: "Hospital Junction" },
    { time: "10:00 AM", location: "Eastside Market" },
    { time: "10:15 AM", location: "Riverfront Plaza" },
    { time: "10:30 AM", location: "Green Valley" },
    { time: "10:45 AM", location: "Tech Park" },
    { time: "11:00 AM", location: "Airport Shuttle Stop" },
    { time: "11:15 AM", location: "Railway Station" },
    { time: "11:30 AM", location: "End Point" },
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
        console.error("Assignment fetch error:", err);
        if (err.response?.status === 404) {
            setError("You have not been assigned a vehicle yet. Please contact an administrator.");
        } else {
            setError("Could not fetch assignment details. The server might be down or the API endpoint is incorrect.");
        }
      } finally {
        setLoading(false);
      }
    };
    fetchMyAssignment();
  }, []);

  const handleSubmitCollection = async (e) => {
    e.preventDefault();
    if (!collectionAmount || collectionAmount <= 0) {
      setSubmitStatus({ success: false, message: "Please enter a valid amount." });
      return;
    }
    setIsSubmitting(true);
    try {
      const token = localStorage.getItem("token");
      await axios.post("http://localhost:5000/api/collections", 
        { amount: collectionAmount, collectionDate: new Date().toISOString() },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setSubmitStatus({ success: true, message: "Collection submitted successfully!" });
      setCollectionAmount("");
    } catch (err) {
      setSubmitStatus({ success: false, message: err.response?.data?.msg || "Submission failed." });
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderContent = () => {
    if (loading) {
      return <div className="status-container"><Spinner animation="border" variant="primary" /><p className="mt-2">Loading...</p></div>;
    }
    if (error) {
      return <div className="status-container"><Card className="shadow-sm p-4 text-center"><Card.Body className="error-text">{error}</Card.Body></Card></div>;
    }
    // This condition checks if the assignment exists AND if the vehicle within it exists.
    // This handles cases where an assignment might point to a deleted vehicle.
    if (assignment && assignment.vehicle) {
      return (
        <>
          <Card className="dashboard-card" style={{animationDelay: '100ms'}}>
            <Card.Body>
              <Card.Title>Assigned Vehicle</Card.Title>
              <div className="vehicle-details-grid">
                <div className="vehicle-info">
                    <p className="vehicle-id">{assignment.vehicle.vehicleId}</p>
                    <p className="vehicle-model">{assignment.vehicle.model}</p>
                </div>
                <div className="qr-code-container">
                  <div className="qr-code-wrapper">
                    <QRCode
                      value={`https://your-app-domain.com/pay?vehicle=${assignment.vehicle._id}`}
                      size={128}
                      viewBox={`0 0 128 128`}
                    />
                  </div>
                </div>
              </div>
            </Card.Body>
          </Card>
          
          <Card className="dashboard-card" style={{animationDelay: '200ms'}}>
            <Card.Body>
              <Card.Title>Submit Daily Collection</Card.Title>
              <Form onSubmit={handleSubmitCollection}>
                <Form.Group controlId="collectionAmount" className="mb-3">
                  <Form.Label>Today's Total Revenue</Form.Label>
                  <Form.Control 
                    type="number"
                    placeholder="Enter amount in ₹"
                    value={collectionAmount}
                    onChange={(e) => setCollectionAmount(e.target.value)}
                    disabled={isSubmitting}
                  />
                </Form.Group>
                <Button type="submit" className="btn-submit-modern" disabled={isSubmitting}>
                  {isSubmitting ? <Spinner as="span" size="sm" /> : "Submit Collection"}
                </Button>
              </Form>
              {submitStatus.message && (
                <Alert variant={submitStatus.success ? 'success' : 'danger'} className="mt-3 text-center">
                  {submitStatus.message}
                </Alert>
              )}
            </Card.Body>
          </Card>

          <Card className="dashboard-card" style={{animationDelay: '300ms'}}>
            <Card.Body>
              <Card.Title>Schedule Tracker</Card.Title>
              <div className="schedule-timeline">
                {schedule.map((item, index) => (
                  <div key={index} className={`schedule-item ${completedStops.has(index) ? 'completed' : ''}`}>
                    <div className="schedule-details">
                      <p className="schedule-time m-0">{item.time}</p>
                      <p className="schedule-location m-0">{item.location}</p>
                    </div>
                    {completedStops.has(index) && (
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
    // This case handles when the API call is successful but returns no assignment,
    // or if the assignment's vehicle is null.
    return (
        <div className="status-container">
          <Card className="shadow-sm p-4 text-center">
            <Card.Body className="error-text">
                Assignment details are missing or vehicle has been unassigned.
            </Card.Body>
          </Card>
        </div>
    );
  };

  // The main return now correctly wraps the content in the OperatorLayout
  return (
    <OperatorLayout>
      {renderContent()}
    </OperatorLayout>
  );
};

export default Dashboard;