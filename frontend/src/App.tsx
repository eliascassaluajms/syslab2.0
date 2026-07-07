// frontend/src/App.jsx
import React from 'react';

function App() {
  return (
    <div style={{
      fontFamily: 'system-ui, -apple-system, sans-serif',
      color: '#e1e1e6',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '100vh',
      textAlign: 'center',
      padding: '20px'
    }}>
      <div style={{ background: '#202024', padding: '40px', borderRadius: '12px', boxShadow: '0 8px 32px rgba(0,0,0,0.3)' }}>
        <h1 style={{ color: '#00b37e', marginBottom: '10px' }}>🔬 SysLab 2.0</h1>
        <p style={{ color: '#a8a8b3', fontSize: '18px' }}>¡Ecosistema Frontend Virtualizado con Éxito!</p>
        <hr style={{ borderColor: '#29292e', margin: '20px 0' }} />
        <p style={{ fontSize: '14px', color: '#8d8d99' }}>
          Vite está escuchando cambios locales de forma reactiva en tu OptiPlex.
        </p>
      </div>
    </div>
  );
}

export default App;
