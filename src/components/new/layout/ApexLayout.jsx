import React from 'react';
import { Outlet } from 'react-router-dom';
import ApexNavbar from './ApexNavbar';
import styles from './ApexLayout.module.css';

const ApexLayout = ({ children }) => {
  return (
    <div className={styles.layout}>
      <div className="apex-mesh-bg" /> {/* Global mesh gradient */}
      <ApexNavbar />
      <main className={styles.main}>
        {children || <Outlet />}
      </main>
      <footer className={styles.footer}>
        <p className={styles.copyright}>© 2024 DevVault Apex. Built for the Hedera Hackathon.</p>
      </footer>
    </div>
  );
};

export default ApexLayout;
