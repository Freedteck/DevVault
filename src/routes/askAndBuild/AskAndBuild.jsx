// import styles from "./AskAndBuild.module.css";
import QnAList from "./QnAList";
import "./QandA.css";
import Button from "../../components/button/Button";
import { useState } from "react";
import AddForm from "../../components/addForm/AddForm";

const AskAndBuild = () => {
  const [showForm, setShowForm] = useState(false);

  const handleAdd = () => {
    setShowForm(true);
  };

  const qnaData = [
    {
      id: 1,
      title: "What is React?",
      description:
        "React is a JavaScript library for building user interfaces.",
      date: "2024-11-30",
      owner: "Jane Doe",
    },
    {
      id: 2,
      title: "How does useState work?",
      description:
        "useState is a React hook for managing state in functional components.",
      date: "2024-11-28",
      owner: "John Smith",
    },
  ];

  return (
    <section className="QandA-box">
      <div className="app">
        <div className="top-row">
          <h2> Debugger&lsquo;s Den</h2>
          <Button text="Ask a Question" handleClick={handleAdd} />
        </div>
        <QnAList data={qnaData} />
      </div>
      {showForm && <AddForm />}
    </section>
  );
};

export default AskAndBuild;
