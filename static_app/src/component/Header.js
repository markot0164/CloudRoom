import React from 'react';
import { Container, Navbar, Nav, Button } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import { useMsal } from '@azure/msal-react';

const Header = ({ userName, centerText }) => {
  const { instance } = useMsal();
  const navigate = useNavigate();

  const handleLogout = () => {
    instance.logoutPopup();
    navigate("/");
  };

  return (
    <Navbar bg="white" className="shadow-sm py-3">
      <Container>
        <Navbar.Brand className="fs-3 fw-bold text-primary-custom" onClick={() => navigate("/")}>
          CloudRoom
        </Navbar.Brand>

        <Nav className="justify-content-center flex-grow-1">
          {userName && centerText && (
            <Navbar.Text className="fs-4 text-black">
              {centerText} <span className="fw-semibold text-black">{userName}</span>
            </Navbar.Text>
          )}
        </Nav>

        <Nav>
          <Button variant="danger" onClick={handleLogout}>Logout</Button>
        </Nav>
      </Container>
    </Navbar>
  );
};

export default Header;