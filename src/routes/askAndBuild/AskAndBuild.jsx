import Button from "../../components/button/Button";
import { useEffect, useState } from "react";
import AskForm from "../../components/addForm/AskForm";
import { useOutletContext } from "react-router-dom";
import QuestionList from "../../components/question/QuestionList";
import styles from "./AskAndBuild.module.css";

const AskAndBuild = () => {
  const [showForm, setShowForm] = useState(false);
  const { allDiscussions, setAllDiscussions } = useOutletContext();
  const [questions, setQuestions] = useState([]);

  const handleAdd = () => {
    setShowForm(true);
  };

  const addNewDiscussion = (newDiscussion) => {
    const updatedDiscussions = [...allDiscussions, newDiscussion];
    setAllDiscussions(updatedDiscussions);
    setQuestions(updatedDiscussions);
  };

  const closeForm = () => {
    setShowForm(false);
  };

  useEffect(() => {
    if (allDiscussions?.length) {
      setQuestions(
        allDiscussions.filter((d) => d.type === "question").reverse()
      );
    }
  }, [allDiscussions]);

  return (
    <section className={styles.askAndBuild}>
      <div className={styles.app}>
        <div className={styles["top-row"]}>
          <h2>Debugger&lsquo;s Den</h2>
          <Button text="Ask a Question" handleClick={handleAdd} />
        </div>
        <QuestionList questions={questions} />
      </div>
      {showForm && (
        <AskForm closeForm={closeForm} onAddDiscussion={addNewDiscussion} />
      )}
    </section>
  );
};

export default AskAndBuild;
