import React, { useState, useEffect } from 'react';

const Button = () => {
    const [count, setCount] = useState(0);
    
    useEffect(() => {
        document.title = `You clicked ${count} times`;
    });
    
    return (
        <button onClick={() => setCount(count + 1)}>
        Click me
        </button>
    );
    }

    export default Button;