import React, { useEffect } from 'react';
import { Container, Nav, Navbar, Button } from 'react-bootstrap';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useMsal } from '@azure/msal-react';

const HomePage = () => {
  const navigate = useNavigate();
  const { instance, accounts } = useMsal();

  useEffect(() => {
    if (accounts.length > 0) {
      navigate('/area-personale');
    }
  }, [accounts, navigate]);

  const handleLogin = async () => {
    try {
      const loginResponse = await instance.loginPopup({
        scopes: ['openid', 'profile', 'email'],
        prompt: 'select_account',
      });

      if (loginResponse && loginResponse.account) {
        navigate('/area-personale');
      }
    } catch (error) {
      console.error('Errore durante il login:', error);
    }
  };

  return (
    <div className="min-vh-100 bg-light text-dark d-flex flex-column">
      <Navbar bg="white" expand="lg" className="shadow-sm">
        <Container>
          <Navbar.Brand className="fs-3 fw-bold text-primary-custom" href="#home">
            CloudRoom
          </Navbar.Brand>

          <Navbar id="basic-navbar-nav" className="justify-content-end">
            <Nav className="gap-3">
              <Button variant="primary-custom" onClick={handleLogin}>
                Accedi con Microsoft
              </Button>
            </Nav>
          </Navbar>
        </Container>
      </Navbar>

      <div className="flex-grow-1 d-flex flex-column justify-content-center bg-primary-custom">
        <div className="py-5 text-center text-white light-blue">
          <motion.section
            initial={{ opacity: 0, y: -50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="py-5"
          >
            <h2 className="display-4 fw-bold mb-4 text-info-custom">
              Organizza e Gestisci i Tuoi Documenti con Facilità
            </h2>
            <p className="lead mb-5 text-white">
              CloudRoom ti aiuta a tenere tutto sotto controllo in un unico posto.
            </p>
          </motion.section>
        </div>

        <Container className="py-5">
          <div className="row row-cols-1 row-cols-md-3 g-4">
            <motion.div className="col">
              <div className="card h-100 shadow-sm rounded border-primary-custom">
                <div className="card-body text-center">
                  <h5 className="card-title fw-semibold text-primary-custom">Archiviazione Sicura</h5>
                  <p className="card-text text-muted text-secondary-custom">
                    I tuoi documenti sempre accessibili e protetti nel cloud.
                  </p>
                </div>
              </div>
            </motion.div>
            <motion.div className="col">
              <div className="card h-100 shadow-sm rounded border-primary-custom">
                <div className="card-body text-center">
                  <h5 className="card-title fw-semibold text-primary-custom">Gestione Checklist</h5>
                  <p className="card-text text-muted text-secondary-custom">
                    Crea e organizza le tue attività senza problemi.
                  </p>
                </div>
              </div>
            </motion.div>
            <motion.div className="col">
              <div className="card h-100 shadow-sm rounded border-primary-custom">
                <div className="card-body text-center">
                  <h5 className="card-title fw-semibold text-primary-custom">Notifiche Smart</h5>
                  <p className="card-text text-muted text-secondary-custom">
                    Ricevi aggiornamenti in tempo reale per non perdere nulla.
                  </p>
                </div>
              </div>
            </motion.div>
          </div>
        </Container>
      </div>

      <footer className="dark-purple text-white text-center py-3 mt-4">
        <Container>
          <p className="mb-0">&copy; 2025 CloudRoom - Tutti i diritti riservati.</p>
        </Container>
      </footer>
    </div>
  );
};

export default HomePage;