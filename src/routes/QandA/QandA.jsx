import styles from "./QandA.module.css";
import QnAList from './QnAList'
import './QandA.css';

const QandA = () => {
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
    <section className='QandA-box'>
      <div className="app">
        <h1>Q & A Section</h1>
        <QnAList data={qnaData} />
      </div>
    </section>
  );
};

export default QandA;
