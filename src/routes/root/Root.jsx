import { Outlet } from "react-router-dom";
import Navbar from "../../components/navbar/Navbar";
import styles from "./Root.module.css";
import { Buffer } from "buffer";

window.Buffer = window.Buffer || Buffer;

const Root = () => {
  return (
    <div className="root">
      <Navbar />
      <div className={styles.container}>
        <Outlet />
      </div>
    </div>
  );
};

export default Root;
