import React, { useState, useEffect } from 'react';
import DataTable from '../DataTable';
import './styles.css';

const Modal = ({ showModal: show, setShowModal: setShow, query, result, keys }) => {
    const handleClose = () => {
        setShow(false);
    }

    return (
        <div className="modal" style={{ "display": (show ? "block" : "none") }}>
            <button onClick={handleClose}>&times;</button>
            <p><DataTable keys={keys} result={result}></DataTable></p>
        </div>
    );
}

export default Modal;