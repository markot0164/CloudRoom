import React, { useState, useEffect } from "react";
import { Form, InputGroup, Button, Modal, Alert } from "react-bootstrap";
import { useDropzone } from "react-dropzone";
import "../styles/Documenti.css";

const MAX_FILE_SIZE_MB = 100;

const Documenti = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [errorMessage, setErrorMessage] = useState("");
  const [documents, setDocuments] = useState([]);

  useEffect(() => {
    const fetchDocuments = async () => {
      try {
        const res = await fetch(`${process.env.REACT_APP_API_URL}/get_documents`, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
          },
        });

        if (!res.ok) throw new Error("Errore nel recupero dei documenti");

        const docs = await res.json();
        setDocuments(docs);
      } catch (err) {
        setErrorMessage("Errore nel caricamento documenti: " + err.message);
      }
    };

    fetchDocuments();
  }, []);

  const filteredDocs = documents.filter((doc) =>
    doc.title.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const onDrop = (acceptedFiles, fileRejections) => {
    setErrorMessage("");
    if (fileRejections.length > 0) {
      const reason = fileRejections[0].errors[0].message;
      setErrorMessage(`Errore: ${reason}`);
      setSelectedFile(null);
    } else if (acceptedFiles.length > 0) {
      setSelectedFile(acceptedFiles[0]);
    }
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { "application/pdf": [".pdf"] },
    maxSize: MAX_FILE_SIZE_MB * 1024 * 1024,
    multiple: false,
  });

  const handleUploadClick = () => {
    setShowModal(true);
    setSelectedFile(null);
    setErrorMessage("");
  };

  const handleCloseModal = () => {
    setShowModal(false);
  };

  const handleFileUpload = async () => {
    if (!selectedFile) {
      setErrorMessage("Nessun file selezionato.");
      return;
    }

    try {
      const filename = encodeURIComponent(selectedFile.name);

      const res = await fetch(`${process.env.REACT_APP_API_URL}/upload_document?filename=${filename}`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
        },
      });

      if (!res.ok) throw new Error("Errore nel recupero del SAS token");
      const sasUrl = await res.text();

      const uploadRes = await fetch(sasUrl, {
        method: "PUT",
        headers: {
          "x-ms-blob-type": "BlockBlob",
          "Content-Type": selectedFile.type,
        },
        body: selectedFile,
      });

      if (!uploadRes.ok) throw new Error("Errore durante l'upload");

      alert("Upload completato con successo!");
      handleCloseModal();

      const resDocs = await fetch(`${process.env.REACT_APP_API_URL}/get_documents`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
        },
      });
      const docs = await resDocs.json();
      setDocuments(docs);

    } catch (err) {
      setErrorMessage("Errore durante l'upload: " + err.message);
    }
  };

  return (
    <div className="w-100 position-relative">
      <InputGroup className="mb-3">
        <Form.Control
          placeholder="Cerca documenti per titolo..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </InputGroup>

      <div className="document-list">
        {filteredDocs.length > 0 ? (
          filteredDocs.map((doc, index) => (
            <div key={index} className="document-card p-3 mb-3 rounded bg-white shadow-sm">
              <h5>
                <a href={doc.url} target="_blank" rel="noopener noreferrer">
                  {doc.title}
                </a>
              </h5>
              <p className="text-muted"><em>{doc.summary}</em></p>
            </div>
          ))
        ) : (
          <p className="text-white">Nessun documento trovato.</p>
        )}
      </div>

      <Button
        variant="primary"
        className="floating-upload-btn"
        onClick={handleUploadClick}
      >
        + Carica documento
      </Button>

      <Modal show={showModal} onHide={handleCloseModal} centered>
        <Modal.Header closeButton>
          <Modal.Title>Carica un documento PDF</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <div
            {...getRootProps()}
            className={`dropzone p-4 border rounded text-center ${
              isDragActive ? "bg-light" : "bg-white"
            }`}
          >
            <input {...getInputProps()} />
            <p className="mb-0">
              {isDragActive
                ? "Rilascia il file qui..."
                : "Trascina un file PDF qui o clicca per selezionarlo"}
            </p>
          </div>

          {selectedFile && (
            <p className="mt-3">
              <strong>File selezionato:</strong> {selectedFile.name}
            </p>
          )}

          {errorMessage && (
            <Alert variant="danger" className="mt-3">
              {errorMessage}
            </Alert>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={handleCloseModal}>
            Annulla
          </Button>
          <Button variant="primary" onClick={handleFileUpload}>
            Carica
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default Documenti;