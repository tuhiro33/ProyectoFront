import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';

import LoginPage from './pages/Auth/Login';
import HomePage from './pages/Home/Home';
import MarketplacePage from './pages/Marketplace/Marketplace';

import AppLayout from './componentes/layout/AppLayout';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        
        {/* =========================================
            1. RUTAS PÚBLICAS (Ocupan toda la pantalla, SIN Sidebar)
            ========================================= */}
        {/* Si entran a la raíz (/), los mandamos al Home */}
        <Route path="/" element={<Navigate to="/Home" replace />} />
        
        <Route path="/Home" element={<HomePage />} />
        <Route path="/login" element={<LoginPage />} />
        
        {/* =========================================
            2. RUTAS PRIVADAS (El AppLayout "abraza" a estas pantallas CON Sidebar)
            ========================================= */}
        <Route element={<AppLayout />}>
          
          {/* Como /mercado está aquí adentro, forzosamente dibujará el Sidebar */}
          <Route path="/mercado" element={<MarketplacePage />} />
          
          {/* Aquí puedes ir descomentando tus futuras pantallas */}
          {/* <Route path="/mi-boveda" element={<DashboardPage />} /> */}
          {/* <Route path="/coleccion" element={<ColeccionPage />} /> */}
          
        </Route>

        {/* =========================================
            3. RUTA DE ERROR (404)
            ========================================= */}
        <Route path="*" element={<h1 style={{ color: 'white', textAlign: 'center', marginTop: '2rem' }}>404 - Carta no encontrada</h1>} />

      </Routes>
    </BrowserRouter>
  );
}

export default App;