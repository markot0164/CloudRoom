import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMsal } from '@azure/msal-react';
import { Container, Navbar, Nav, Button } from 'react-bootstrap';
import '../App.css';

const PersonalArea = () => {
  const { instance, accounts } = useMsal();
  const [userName, setUserName] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (accounts.length > 0) {
      setUserName(accounts[0]?.name || "Utente");
    } else {
      navigate("/");
    }
  }, [accounts, navigate]);

  const handleLogout = () => {
    instance.logoutPopup();
    navigate("/");
  };

  return (
    <div className="d-flex flex-column min-vh-100 bg-light">
 
      <Navbar bg="white" className="shadow-sm py-3">
        <Container>
          <Navbar.Brand className="fs-3 fw-bold text-primary-custom">
            CloudRoom
          </Navbar.Brand>
          <Nav className="justify-content-center flex-grow-1">
            {userName && (
              <Navbar.Text className="fs-4 text-black">
                Benvenuto, <span className="fw-semibold text-black">{userName}</span>!
              </Navbar.Text>
            )}
          </Nav>
          <Nav>
            <Button variant="danger" onClick={handleLogout}>
              Logout
            </Button>
          </Nav>
        </Container>
      </Navbar>

      <Container className="my-4 flex-grow-1 d-flex flex-column">
        <div className="flex-grow-1 rounded d-flex flex-column height-main-content">
         
          <Nav className="light-blue border-bottom d-flex flex-row justify-content-around p-2">
            <Button variant="link" className="text-center text-decoration-none p-0 flex-grow-1 border-end text-white">
              Cerca documenti
            </Button>
            <Button variant="link" className="text-center text-decoration-none p-0 flex-grow-1 border-end text-white">
              Notifiche
            </Button>
            <Button variant="link" className="text-center text-decoration-none p-0 flex-grow-1 border-end text-white">
              Calendario
            </Button>
            <Button variant="link" className="text-center text-decoration-none p-0 flex-grow-1 text-white">
              Gestisci checklist
            </Button>
          </Nav>

          <div className="flex-grow-1 bg-secondary-custom d-flex align-items-center justify-content-center mt-3 p-3">
            <p className="text-white m-0">Area Contenuti</p>
          </div>
        </div>
      </Container>

      <footer className="dark-purple text-white text-center py-3 mt-auto">
        <Container>
          <p className="mb-0">&copy; 2025 CloudRoom - Tutti i diritti riservati.</p>
        </Container>
      </footer>
    </div>
  );
};

export default PersonalArea;