import React from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from '../layout/Sidebar';
import styles from '../../assets/styles/AppLayout.module.css';

const AppLayout = () => {
  return (
    <div className={styles.layoutContainer}>
      {/* 1. Tu barra lateral fija a la izquierda */}
      <Sidebar />

      {/* 2. El hueco donde aparecerá el Mercado o la Bóveda */}
      <main className={styles.mainContent}>
        <Outlet /> 
      </main>
    </div>
  );
};

export default AppLayout;