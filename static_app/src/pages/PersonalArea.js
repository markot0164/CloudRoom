import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMsal } from '@azure/msal-react';
import { useRef } from 'react';
import { Container, Nav, Button } from 'react-bootstrap';
import '../App.css';
import '../styles/PersonalArea.css';
import Notifiche from '../component/Notifiche';
import Header from '../component/Header';
import Footer from '../component/Footer';
import Documenti from '../component/Documenti';

const PersonalArea = () => {
  const calledRef = useRef(false);
  const { instance, accounts } = useMsal();
  const [userName, setUserName] = useState(null);
  const [activeSection, setActiveSection] = useState("documents");
  // eslint-disable-next-line no-unused-vars
  const [userId, setUserId] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (accounts.length > 0 && !calledRef.current) {
      const name = accounts[0].name;
      const email = accounts[0].username;
      const userOid = accounts[0]?.idTokenClaims?.oid;

      if (userOid) {
        setUserName(name);
        setUserId(userOid);
        localStorage.setItem("userOid", userOid);

        const userAlreadySaved = localStorage.getItem("userRegistered") === "true";

        if (!userAlreadySaved) {
          fetch(`${process.env.REACT_APP_API_BASE_URL}/ensure_user_registered`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ userId: userOid, name, email }),
          })
            .then(res => res.json())
            .then(data => {
              if (data.status === "registered" || data.status === "already_exists") {
                localStorage.setItem("userRegistered", "true");
              } else {
                console.warn("Errore registrazione utente:", data);
              }
            })
            .catch(err => console.error("Errore invio utente:", err));
        }
      }

      calledRef.current = true;
    } else if (accounts.length === 0) {
      navigate("/");
    }
  }, [accounts, navigate]);

  const handleLogout = () => {
    localStorage.removeItem("userRegistered");
    localStorage.removeItem("userOid");
    instance.logoutPopup();
    navigate("/");
  };

  return (
    <div className="d-flex flex-column min-vh-100 bg-light">
      <Header userName={userName} centerText="Benvenuto," onLogout={handleLogout} />

      <Container className="my-4 flex-grow-1 d-flex flex-column">
        <div className="flex-grow-1 rounded d-flex flex-column height-main-content">  
          <Nav className="light-blue border-bottom nav-grid p-2">
            <Button variant="link" onClick={() => setActiveSection("documents")} className="text-center text-decoration-none p-0 flex-grow-1 border-end text-white">
              Cerca documenti
            </Button>
            <Button variant="link" onClick={() => setActiveSection("notifications")} className="text-center text-decoration-none p-0 flex-grow-1 border-end text-white">
              Notifiche
            </Button>
            <Button variant="link" onClick={() => navigate("/calendario")} className="text-center text-decoration-none p-0 flex-grow-1 border-end text-white">
              Calendario
            </Button>
            <Button variant="link" onClick={() => navigate("/checklist")} className="text-center text-decoration-none p-0 flex-grow-1 text-white">
              Gestisci checklist
            </Button>
          </Nav>

          <div className="flex-grow-1 bg-secondary-custom d-flex align-items-start justify-content-start mt-3 p-3">
            {activeSection === "notifications" && <Notifiche />}
            {activeSection === "documents" && <Documenti />}
          </div>
        </div>
      </Container>

      <Footer />
    </div>
  );
};

export default PersonalArea;