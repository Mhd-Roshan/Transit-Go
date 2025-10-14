import React from "react";
import { useNavigate } from "react-router-dom";
import { Navbar, Container, Nav, Image, Button } from "react-bootstrap";

const OperatorHeader = () => {
  const navigate = useNavigate();
  const handleLogout = () => {
    localStorage.removeItem("token");
    navigate("/");
  };

  return (
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
  );
};

export default OperatorHeader;