import { Outlet } from "react-router-dom";
import { Buffer } from "buffer";
import Navbar from "../../components/layout/Navbar";
import styles from "./Root.module.css";

window.Buffer = window.Buffer || Buffer;

const Root = () => {
  return (
    <div className={styles.root}>
      <Navbar />
      <main className={styles.main}>
        <Outlet />
      </main>
    </div>
  );
};

export default Root;
