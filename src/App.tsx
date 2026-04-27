import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';

import LoginPage from './pages/Auth/Login';
import HomePage from './pages/Home/Home';
import MarketplacePage from './pages/Marketplace/Marketplace';
import RegisterPage from './pages/Auth/Register';
import ColeccionPage from './pages/Coleccion/Coleccion';
import AgregarCPage from './pages/Coleccion/AgregarCarta';
import PerfilPage from './pages/Perfil/Perfil';
import AppLayout from './componentes/layout/AppLayout';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        

        <Route path="/" element={<Navigate to="/Home" replace />} />
        <Route path="/Home" element={<HomePage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/registro" element={<RegisterPage />} />

        <Route element={<AppLayout />}>
          
          <Route path="/mercado" element={<MarketplacePage />} />
          <Route path="/coleccion" element={<ColeccionPage />} />
          <Route path="/AgregarC" element={<AgregarCPage />} /> 
          <Route path="/Perfil" element={<PerfilPage />} />           
        </Route>
        <Route path="*" element={<h1 style={{ color: 'white', textAlign: 'center', marginTop: '2rem' }}>404 - Carta no encontrada</h1>} />

      </Routes>
    </BrowserRouter>
  );
}

export default App;