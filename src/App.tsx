import React from 'react';
// Necesitarás instalar: npm install react-router-dom
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';

// Importamos las pantallas completas (Pages)
import LoginPage from './pages/Auth/Login';
import HomePage from './pages/Home/Home';
// import DashboardPage from './pages/Dashboard/Dashboard';
// import MarketplacePage from './pages/Marketplace/Marketplace';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        
        {/* Rutas Públicas */}
        <Route path="/Home" element={<HomePage />} />
        
        {/* Rutas Privadas (Donde el usuario gestiona sus TCGs) */}
        {/* <Route path="/mi-boveda" element={<DashboardPage />} />
        <Route path="/mercado" element={<MarketplacePage />} /> */}

        {/* Si el usuario entra a la raíz (/), lo mandamos al login por defecto */}
        <Route path="/" element={<Navigate to="/Home" replace />} />
        
        {/* Ruta 404 (Si escribe algo que no existe) */}
        <Route path="*" element={<h1>404 - Carta no encontrada</h1>} />

      </Routes>
      <Routes>
  {/* Rutas Públicas (No tienen barra lateral) */}
  <Route path="/" element={<HomePage />} />
  <Route path="/login" element={<LoginPage />} />

  {/* Rutas Privadas (SÍ tienen barra lateral gracias al Layout) */}
    {/* <Route element={<AppLayout />}>
    <Route path="/mi-boveda" element={<DashboardPage />} />
    <Route path="/coleccion" element={<ColeccionPage />} />
    <Route path="/mercado" element={<MarketplacePage />} /> */}
  {/* </Route> */}
</Routes>
    </BrowserRouter>
    
  );
}

export default App;