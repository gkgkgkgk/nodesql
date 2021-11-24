import React, { useState, useEffect } from 'react';

const Button = (props) => {
    return (
        <button onClick={props.callBack}>
        Generate SQL
        </button>
    );
}

export default Button;