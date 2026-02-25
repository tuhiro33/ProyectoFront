import React from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar'; // Importamos tu barra lateral
import styles from './AppLayout.module.css';

const AppLayout: React.FC = () => {
  return (
    <div className={styles.layoutContainer}>
      
      {/* 1. La Barra Lateral (Siempre fija a la izquierda) */}
      <Sidebar />

      {/* 2. El Área Principal (Lo que cambia) */}
      <main className={styles.mainContent}>
        {/* Aquí React inyectará el Dashboard, o el Mercado, etc. */}
        <Outlet /> 
      </main>

    </div>
  );
};

export default AppLayout;