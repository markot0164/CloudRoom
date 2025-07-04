import React, { useEffect, useState } from 'react';
import { useMsal } from '@azure/msal-react';
import { useNavigate } from 'react-router-dom';
import { Container, Form, Card, Button, ListGroup } from 'react-bootstrap';
import Header from '../component/Header';
import Footer from '../component/Footer';
import { Home, Trash } from 'lucide-react';
import '../App.css';

const Checklist = () => {
  const [checklists, setChecklists] = useState([]);
  const [title, setTitle] = useState('');
  const [items, setItems] = useState(['']);
  const { accounts, instance } = useMsal();
  const [userName, setUserName] = useState(null);
  const navigate = useNavigate();

  const userId = localStorage.getItem("userOid");

  useEffect(() => {
    if (accounts.length === 0) {
      navigate("/");
    } else {
      setUserName(accounts[0]?.name || "Utente");
    }
  }, [accounts, navigate]);

  useEffect(() => {
    const fetchChecklists = async () => {
      if (!userId) return;

      try {
        const response = await fetch(`${process.env.REACT_APP_API_BASE_URL}/get_checklists`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ userId }),
      });
        if (response.ok) {
          const data = await response.json();
          setChecklists(data);
        } else {
          console.error("Errore nel recupero checklist:", await response.text());
        }
      } catch (err) {
        console.error("Errore di rete:", err);
      }
    };

    fetchChecklists();
  }, [userId]);

  const handleAddItemField = () => {
    setItems([...items, '']);
  };

  const handleRemoveItemField = () => {
    if (items.length > 1) {
      setItems(items.slice(0, -1));
    }
  };

  const handleItemChange = (index, value) => {
    const updated = [...items];
    updated[index] = value;
    setItems(updated);
  };

  const handleCreateChecklist = async () => {
    if (!title.trim() || items.every(item => !item.trim())) return;

    const newChecklist = {
      title: title.trim(),
      items: items.map(item => ({
        text: item.trim(),
        done: false,
      })),
      userId,
    };

    try {
      const response = await fetch(`${process.env.REACT_APP_API_BASE_URL}/create_checklist`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(newChecklist),
      });

      if (response.ok) {
        const createdChecklist = await response.json(); 
        setChecklists([...checklists, createdChecklist]);
        setTitle('');
        setItems(['']);
      } else {
        console.error("Errore durante la creazione della checklist:", await response.text());
      }
    } catch (err) {
      console.error("Errore di rete:", err);
    }
  };

  const toggleItemDone = async (checklistId, itemIndex) => {
    const checklist = checklists.find(cl => cl._id === checklistId);
    if (!checklist) return;

    const updatedItems = checklist.items.map((item, idx) =>
      idx === itemIndex ? { ...item, done: !item.done } : item
    );

    try {
      const response = await fetch(`${process.env.REACT_APP_API_BASE_URL}/update_checklist_item`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          checklistId,
          items: updatedItems,
        }),
      });

      if (response.ok) {
        const updatedChecklist = await response.json();
        setChecklists(prev =>
          prev.map(cl => (cl._id === checklistId ? updatedChecklist : cl))
        );
      } else {
        console.error("Errore nel salvataggio:", await response.text());
      }
    } catch (err) {
      console.error("Errore di rete:", err);
    }
  };

  const handleDeleteChecklist = async (checklistId) => {
    if (!window.confirm("Sei sicuro di voler eliminare questa checklist?")) return;

    try {
      const response = await fetch(`${process.env.REACT_APP_API_BASE_URL}/delete_checklist`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ checklistId }),
      });

      if (response.ok) {
        setChecklists(prev => prev.filter(cl => cl._id !== checklistId));
      } else {
        console.error("Errore durante l'eliminazione:", await response.text());
      }
    } catch (err) {
      console.error("Errore di rete:", err);
    }
  };

  const handleLogout = () => {
    instance.logoutPopup();
    navigate("/");
  };

  const handleGoToPersonalArea = () => {
    navigate("/area-personale");
  };

  return (
    <div className="d-flex flex-column min-vh-100 bg-light">
      <Header userName={userName} centerText="Checklist di " onLogout={handleLogout} />

      <Container className="my-5">
        <h2 className="mb-4 text-primary-custom">Le tue checklist</h2>

        <Card className="mb-4 shadow-sm">
          <Card.Body>
            <Form.Group className="mb-3">
              <Form.Label>Titolo Checklist</Form.Label>
              <Form.Control
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Esame Cloud Computing"
              />
            </Form.Group>

            {items.map((item, index) => (
              <Form.Group key={index} className="mb-2">
                <Form.Control
                  type="text"
                  value={item}
                  onChange={(e) => handleItemChange(index, e.target.value)}
                  placeholder={`Elemento ${index + 1}`}
                />
              </Form.Group>
            ))}

            <Button variant="secondary" className="me-2" onClick={handleAddItemField}>
              Aggiungi item
            </Button>
            <Button variant="secondary" className="me-2" onClick={handleRemoveItemField}>
              Rimuovi ultimo item
            </Button>
            <Button variant="primary" onClick={handleCreateChecklist}>
              Crea Checklist
            </Button>
          </Card.Body>
        </Card>

        {checklists.map((cl) => (
          <Card key={cl._id} className="mb-3 shadow-sm">
            <Card.Header className="fw-semibold d-flex justify-content-between align-items-center">
              <span>{cl.title}</span>
              <Button variant="outline-danger" size="sm" onClick={() => handleDeleteChecklist(cl._id)}>
                <Trash size={16} />
              </Button>
            </Card.Header>
            <ListGroup variant="flush">
              {cl.items.map((item, index) => (
                <ListGroup.Item
                  key={index}
                  onClick={() => toggleItemDone(cl._id, index)}
                  style={{
                    cursor: 'pointer',
                    textDecoration: item.done ? 'line-through' : 'none',
                    color: item.done ? '#6c757d' : '#000',
                  }}
                >
                  {item.text}
                </ListGroup.Item>
              ))}
            </ListGroup>
          </Card>
        ))}

        <Button
          variant="primary" 
          className="floating-home-button"
          onClick={handleGoToPersonalArea}>
          <Home size={24} /> 
        </Button>

        <Footer />
      </Container>
    </div>
  );
};

export default Checklist;