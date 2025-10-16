import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './app';
// our frontend application is here
const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
    <React.StrictMode>
        <App />
    </React.StrictMode>
);