import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import HomePage from './pages/HomePage';
import PersonalArea from './pages/PersonalArea';
import { MsalProvider } from '@azure/msal-react';
import { PublicClientApplication } from '@azure/msal-browser';

function App() {
  const [msalInstance, setMsalInstance] = useState(null);

  useEffect(() => {
    try {
      const clientId = process.env.REACT_APP_AAD_CLIENT_ID;
      const authority = process.env.REACT_APP_AAD_AUTHORITY;

      if (!clientId || !authority) {
        throw new Error("clientId o authority non definiti nelle variabili ambiente.");
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
      console.log("MSAL instance creata con successo");
    } catch (error) {
      console.error("Errore nella configurazione MSAL:", error);
    }
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