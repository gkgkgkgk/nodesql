import React, { useState, useEffect } from 'react';
import './styles.css';

const Modal = ({ showModal: show, setShowModal: setShow }) => {
    const handleClose = () => {
        setShow(false);
    }

    return (
        <div className="modal" style={{ "display": (show ? "block" : "none") }}>
            <button onClick={handleClose}>&times;</button>
        </div>
    );
}

export default Modal;