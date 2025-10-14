import React from "react";
import { Link, useLocation } from "react-router-dom";
import { Navbar, Container, Nav } from "react-bootstrap";
import { BsSignpostSplit } from "react-icons/bs";

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

export default OperatorBottomNav;