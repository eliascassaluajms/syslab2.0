import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App'; // 👈 Importa el componente raíz App en lugar de AppRoutes directamente[cite: 11, 12]
import './index.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);