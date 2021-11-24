import React, { useState, useEffect } from 'react';
import './styles.css';

const Modal = ({ showModal: show, setShowModal: setShow, query, result }) => {
    const handleClose = () => {
        setShow(false);
    }

    return (
        <div className="modal" style={{ "display": (show ? "block" : "none") }}>
            <button onClick={handleClose}>&times;</button>
            <p>{query}</p>
            <p>{result}</p>
        </div>
    );
}

export default Modal;