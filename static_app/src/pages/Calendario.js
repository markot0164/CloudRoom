import React, { useEffect, useState, useCallback} from 'react';
import { useMsal } from '@azure/msal-react';
import { useNavigate } from 'react-router-dom';
import { Button, Spinner, Modal, Form } from 'react-bootstrap';
import { Calendar, dateFnsLocalizer } from 'react-big-calendar';
import { format, parse, startOfWeek, getDay, isSameDay } from 'date-fns';
import it from 'date-fns/locale/it';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import { InteractionRequiredAuthError } from "@azure/msal-browser";
import { FaTrash } from 'react-icons/fa';
import { Home } from 'lucide-react';
import Header from '../component/Header';
import Footer from '../component/Footer'
import '../App.css';

const locales = { 'it': it };
const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek: (date) => startOfWeek(date, { locale: it }),
  getDay,
  locales,
});

const convertGraphEventsToCalendarFormat = (graphEvents) => {
  return graphEvents.map(event => ({
    id: event.id,
    title: event.subject,
    start: new Date(event.start.dateTime),
    end: new Date(event.end.dateTime),
  }));
};

const Calendario = () => {
  const { accounts, instance } = useMsal();
  const [userName, setUserName] = useState(null);
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({ title: '', startTime: '' });
  const [interactionInProgress, setInteractionInProgress] = useState(false);
  const navigate = useNavigate();

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

  const fetchCalendarEvents = useCallback(async () => {
    const start = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
    const end = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
    end.setHours(23, 59, 59, 999);

    const startISO = start.toISOString();
    const endISO = end.toISOString();

    try {
      const accessToken = await getAccessTokenWithFallback();
      if (!accessToken) return;

      const graphResponse = await fetch(
        `https://graph.microsoft.com/v1.0/me/calendarView?startDateTime=${startISO}&endDateTime=${endISO}&$orderby=start/dateTime`,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );

      if (!graphResponse.ok) {
        const errorText = await graphResponse.text();
        console.error("Errore Graph API:", graphResponse.status, errorText);
        return;
      }

      const data = await graphResponse.json();
      
      setEvents(data.value || []);
    } catch (error) {
      console.error("Errore recupero eventi:", error);
    } finally {
      setLoading(false);
    }
  }, [currentDate, getAccessTokenWithFallback]);

  const handleSelectSlot = ({ start }) => {
    setSelectedDate(start);
    setShowModal(true);
  };

  const handleFormChange = (e) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleCreateEvent = async () => {
    if (!formData.title || !formData.startTime || !selectedDate) {
      alert("Compila tutti i campi.");
      return;
    }

    const dateString = format(selectedDate, 'yyyy-MM-dd');
    const startDateTime = new Date(`${dateString}T${formData.startTime}`);
    const endDateTime = new Date(startDateTime.getTime() + 60 * 60 * 1000);

    try {
      const accessToken = await getAccessTokenWithFallback();
      if (!accessToken) return;

      const newEvent = {
        subject: formData.title,
        start: {
          dateTime: startDateTime.toISOString(),
          timeZone: "Europe/Rome",
        },
        end: {
          dateTime: endDateTime.toISOString(),
          timeZone: "Europe/Rome",
        },
      };

      const response = await fetch("https://graph.microsoft.com/v1.0/me/events", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(newEvent),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error("Errore creazione evento:", response.status, errorText);
        return;
      }

      setShowModal(false);
      setFormData({ title: '', startTime: '' });
      fetchCalendarEvents();
    } catch (error) {
      console.error("Errore creazione evento:", error);
    }
  };
  const handleDeleteEvent = async (eventId) => {
    if (!window.confirm("Sicuro di voler eliminare l'evento selezionato?")) return;

    try {
      const accessToken = await getAccessTokenWithFallback();
      if (!accessToken) return;

      const response = await fetch(`https://graph.microsoft.com/v1.0/me/events/${eventId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      if (response.ok) {
        fetchCalendarEvents();
      } else {
        const errorText = await response.text();
        console.error("Errore eliminazione evento:", response.status, errorText);
      }
    } catch (error) {
      console.error("Errore nella richiesta di eliminazione:", error);
    }
  };

  useEffect(() => {
    if (accounts.length === 0) {
      navigate("/");
    } else {
      setUserName(accounts[0]?.name || "Utente");
    }
  }, [accounts, navigate]);

  useEffect(() => {
    if (accounts.length > 0) {
      setLoading(true);
      fetchCalendarEvents();
    }
  }, [accounts, currentDate, fetchCalendarEvents]);

  const handleLogout = () => {
    instance.logoutPopup();
    navigate("/");
  };

  const handleGoToPersonalArea = () => {
    navigate("/area-personale");
  };

  const CustomToolbar = ({ label }) => {
    const handleNavigate = (action) => {
      const newDate = new Date(currentDate);
      if (action === 'NEXT') {
        newDate.setMonth(newDate.getMonth() + 1);
      } else if (action === 'PREV') {
        newDate.setMonth(newDate.getMonth() - 1);
      }
      setCurrentDate(newDate);
    };

    return (
      <div className="d-flex justify-content-between align-items-center mb-2">
        <Button variant="secondary" onClick={() => handleNavigate('PREV')}>Indietro</Button>
        <div className="fw-bold text-black fs-5">{label}</div>
        <Button variant="secondary" onClick={() => handleNavigate('NEXT')}>Avanti</Button>
      </div>
    );
  };

  const eventsForSelectedDate = events
    .filter(e => isSameDay(new Date(e.start.dateTime || e.start), selectedDate))
    .sort((a, b) => new Date(a.start.dateTime || a.start) - new Date(b.start.dateTime || b.start));

  return (
    <div className="d-flex flex-column min-vh-100 bg-light">
      <Header userName={userName} centerText="Calendario di" onLogout={handleLogout} />

      <div className="flex-grow-1 p-4 rounded text-white">
        {loading ? (
          <div className="d-flex justify-content-center align-items-center h-100">
            <Spinner animation="border" variant="light" />
          </div>
        ) : (
          <Calendar
            localizer={localizer}
            events={convertGraphEventsToCalendarFormat(events)}
            startAccessor="start"
            endAccessor="end"
            date={currentDate}
            onNavigate={setCurrentDate}
            defaultView="month"
            views={['month']}
            selectable
            onSelectSlot={handleSelectSlot}
            components={{ toolbar: CustomToolbar }}
            style={{
              height: 600,
              backgroundColor: 'white',
              color: 'black',
              borderRadius: 10,
              padding: 10,
            }}
            messages={{
              next: 'Avanti',
              previous: 'Indietro',
            }}
          />
        )}
      </div>

      <Modal show={showModal} onHide={() => setShowModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Eventi per il {selectedDate ? format(selectedDate, "dd/MM/yyyy") : ''}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {eventsForSelectedDate.length > 0 ? (
            <ul>
              {eventsForSelectedDate.map((event) => (
                <li key={event.id || event.title} className="d-flex justify-content-between align-items-center mb-2">
                  <div>
                    <strong>{event.subject || event.title}</strong> –{" "}
                    {format(new Date(event.start.dateTime || event.start), 'HH:mm')}
                  </div>
                  <Button
                    variant="outline-danger"
                    size="sm"
                    onClick={() => handleDeleteEvent(event.id)}
                    title="Elimina evento"
                  >
                    <FaTrash />
                  </Button>
                </li>
              ))}
            </ul>
          ) : (
            <p>Nessun evento presente.</p>
          )}
          <Form className="mt-3">
            <Form.Group>
              <Form.Label>Titolo evento</Form.Label>
              <Form.Control
                type="text"
                name="title"
                value={formData.title}
                onChange={handleFormChange}
              />
            </Form.Group>
            <Form.Group>
              <Form.Label>Ora di inizio</Form.Label>
              <Form.Control
                type="time"
                name="startTime"
                value={formData.startTime}
                onChange={handleFormChange}
              />
            </Form.Group>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowModal(false)}>Chiudi</Button>
          <Button variant="primary" onClick={handleCreateEvent}>Aggiungi evento</Button>
        </Modal.Footer>
      </Modal>

      <Button
        variant="primary" 
        className="floating-home-button"
        onClick={handleGoToPersonalArea}
      >
        <Home size={24} /> 
      </Button>

      <Footer />
    </div>
  );
};

export default Calendario;