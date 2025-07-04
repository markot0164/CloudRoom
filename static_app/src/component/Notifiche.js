import React, { useCallback, useEffect, useState } from 'react';
import { useMsal } from '@azure/msal-react';
import { InteractionRequiredAuthError } from '@azure/msal-browser';

const Notifiche = () => {
  const [notifications, setNotifications] = useState([]);
  const [interactionInProgress, setInteractionInProgress] = useState(false);
  const { instance, accounts } = useMsal();

  const getAccessTokenWithFallback = useCallback(async () => {
    try {
      const response = await instance.acquireTokenSilent({
        scopes: ["Calendars.ReadWrite"],
        account: accounts[0],
      });
      return response.accessToken;
    } catch (error) {
      if (error instanceof InteractionRequiredAuthError && !interactionInProgress) {
        try {
          setInteractionInProgress(true);
          const response = await instance.acquireTokenPopup({
            scopes: ["Calendars.ReadWrite"],
          });
          return response.accessToken;
        } catch (popupError) {
          console.error("Errore durante il consenso:", popupError);
        } finally {
          setInteractionInProgress(false);
        }
      } else {
        console.error("Errore nel recupero del token:", error);
      }
      return null;
    }
  }, [accounts, instance, interactionInProgress]);

  useEffect(() => {
    const fetchNotifications = async () => {
      const userOid = localStorage.getItem("userOid");
      if (!userOid) return;

      const accessToken = await getAccessTokenWithFallback();
      if (!accessToken) return;

      try {
        const response = await fetch(
          `${process.env.REACT_APP_API_BASE_URL}/get_notifications?userId=${userOid}`,
          {
            headers: {
              Authorization: `Bearer ${accessToken}`,
            },
          }
        );
        const data = await response.json();
        setNotifications(data);
      } catch (error) {
        console.error("Errore nel recupero notifiche:", error);
      }
    };

    fetchNotifications();
  }, [getAccessTokenWithFallback]);

  if (notifications.length === 0) {
    return <p className="text-white">Nessuna notifica disponibile.</p>;
  }

  return (
    <div className="w-100">
      <h4 className="text-white mb-3">Notifiche</h4>
      <ul className="list-unstyled">
        {notifications.map((n, i) => (
          <li key={i} className="bg-white p-3 mb-2 rounded shadow-sm">
            <strong>{n.title}</strong>
            <p>{n.message}</p>
            <small className="text-muted">{new Date(n.date).toLocaleString()}</small>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default Notifiche;