import React, { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import HomePage from './pages/HomePage';
import PersonalArea from './pages/PersonalArea';
import { MsalProvider } from '@azure/msal-react';
import { PublicClientApplication } from '@azure/msal-browser';

function App() {
  const [msalInstance, setMsalInstance] = useState(null);

  useEffect(() => {
    const loadConfig = async () => {
      try {
        const response = await fetch('/api/get_config');
        const config = await response.json();

        const instance = new PublicClientApplication({
          auth: {
            clientId: config.clientId,
            authority: config.authority,
            redirectUri: window.location.origin,
          },
          cache: {
            cacheLocation: 'localStorage',
            storeAuthStateInCookie: false,
          },
        });

        setMsalInstance(instance);
      } catch (error) {
        console.error("Errore nel caricamento della configurazione MSAL:", error);
      }
    };

    loadConfig();
  }, []);

  if (!msalInstance) {
    return <div>Caricamento...</div>;
  }

  return (
    <MsalProvider instance={msalInstance}>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/area-personale" element={<PersonalArea />} />
        </Routes>
      </BrowserRouter>
    </MsalProvider>
  );
}

export default App;