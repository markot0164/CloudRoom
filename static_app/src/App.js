import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import HomePage from './pages/HomePage';
import PersonalArea from './pages/PersonalArea.js';
import { PublicClientApplication } from '@azure/msal-browser';
import { MsalProvider } from '@azure/msal-react';

const clientId = process.env.REACT_APP_AAD_CLIENT_ID;
const authority = process.env.REACT_APP_AAD_AUTHORITY;

const msalConfig = {
  auth: {
    clientId: clientId,
    authority: authority,
    redirectUri: window.location.origin,
  },
  cache: {
    cacheLocation: 'localStorage',
    storeAuthStateInCookie: false,
  },
};

const msalInstance = new PublicClientApplication(msalConfig);

function App() {
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