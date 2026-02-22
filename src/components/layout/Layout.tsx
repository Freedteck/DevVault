import type { ReactNode } from "react";
import Navbar from "./Navbar";
import styles from "./Layout.module.css";

const Layout = ({ children }: { children: ReactNode }) => {
  return (
    <div className={styles.layout}>
      <div className="apex-mesh-bg" />
      <Navbar />
      <main className={styles.main}>{children}</main>
      <footer className={styles.footer}>
        <p className={styles.copyright}>
          © 2024 DevVault Apex. Built for the Hedera Hackathon.
        </p>
      </footer>
    </div>
  );
};

export default Layout;
