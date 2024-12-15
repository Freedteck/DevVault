import { useEffect, useState } from "react";
import styles from "./Updates.module.css";
import Button from "../../components/button/Button";
import UpdateCard from "../../components/updateCard/UpdateCard";
import UpdateForm from "../../components/addForm/UpdateForm";
import { useOutletContext } from "react-router-dom";

const Updates = () => {
  const [showForm, setShowForm] = useState(false);
  const { allDiscussions, setAllDiscussions } = useOutletContext();
  const [updates, setUpdates] = useState([]);

  const handleAdd = () => {
    setShowForm(true);
  };

  const addNewDiscussion = (newDiscussion) => {
    const updatedDiscussions = [...allDiscussions, newDiscussion];
    setAllDiscussions(updatedDiscussions);
    setUpdates(updatedDiscussions);
  };

  const closeForm = () => {
    setShowForm(false);
  };

  useEffect(() => {
    if (allDiscussions?.length) {
      setUpdates(allDiscussions.filter((d) => d.type === "update").reverse());
    }
  }, [allDiscussions]);

  return (
    <section className={styles.updates}>
      <header className={styles.header}>
        <p>
          Discover the latest tips, best practices, and updates from the
          community.
        </p>
      </header>

      <div className={styles["top-row"]}>
        <h2>Developer Updates</h2>
        <Button text="Create Update" handleClick={handleAdd} />
      </div>

      <section className={styles.updateList}>
        {updates.map((update, index) => (
          <UpdateCard key={index} update={update} />
        ))}
      </section>
      {showForm && (
        <UpdateForm closeForm={closeForm} onAddDiscussion={addNewDiscussion} />
      )}
    </section>
  );
};

export default Updates;
