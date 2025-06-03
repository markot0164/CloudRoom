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
        let clientId, authority;

        if (process.env.NODE_ENV === 'development') {
          clientId = process.env.REACT_APP_AAD_CLIENT_ID;
          authority = process.env.REACT_APP_AAD_AUTHORITY;
        } else {
          const response = await fetch('/api/get_microsoft_entra_id_key');
          const config = await response.json();
          clientId = config.clientId;
          authority = config.authority;
        }

        const instance = new PublicClientApplication({
          auth: {
            clientId,
            authority,
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