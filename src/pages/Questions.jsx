import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Plus } from "lucide-react";
import Button from "../components/ui/Button";
import QuestionCard from "../components/features/QuestionCard";
import CreateQuestionModal from "../components/features/CreateQuestionModal";
import SearchBar from "../components/features/SearchBar";
import styles from "./Questions.module.css";

const Questions = () => {
  const navigate = useNavigate();
  const [questions, setQuestions] = useState([]);
  const [filteredQuestions, setFilteredQuestions] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const topicId = import.meta.env.VITE_TOPIC_ID;

  useEffect(() => {
    const fetchQuestions = async () => {
      try {
        const response = await fetch(
          `https://testnet.mirrornode.hedera.com/api/v1/topics/${topicId}/messages`
        );
        const data = await response.json();

        const messages = data.messages
          .map((message) => {
            try {
              const decodedMessage = atob(message.message);
              return JSON.parse(decodedMessage);
            } catch {
              return null;
            }
          })
          .filter((msg) => msg && msg.type === "question")
          .reverse();

        setQuestions(messages);
        setFilteredQuestions(messages);
      } catch (error) {
        console.error("Failed to fetch questions:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchQuestions();
  }, [topicId]);

  useEffect(() => {
    if (searchQuery.trim() === "") {
      setFilteredQuestions(questions);
    } else {
      const filtered = questions.filter(
        (q) =>
          q.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          q.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
          q.tags?.some((tag) =>
            tag.toLowerCase().includes(searchQuery.toLowerCase())
          )
      );
      setFilteredQuestions(filtered);
    }
  }, [searchQuery, questions]);

  const handleQuestionClick = (question, index) => {
    navigate(`/question/${index + 1}`, { state: { question } });
  };

  const handleSuccess = (newQuestion) => {
    setQuestions((prev) => [newQuestion, ...prev]);
  };

  if (isLoading) {
    return (
      <div className={styles.questions}>
        <div className={styles.loading}>Loading questions...</div>
      </div>
    );
  }

  return (
    <div className={styles.questions}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Questions & Answers</h1>
          <p className={styles.subtitle}>
            Ask questions, share knowledge, and help fellow developers
          </p>
        </div>
        <Button onClick={() => setShowModal(true)}>
          <Plus size={20} />
          Ask Question
        </Button>
      </div>

      <div className={styles.searchSection}>
        <SearchBar
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search questions..."
        />
      </div>

      {filteredQuestions.length === 0 && !isLoading ? (
        <div className={styles.empty}>
          <p>
            {searchQuery
              ? "No questions match your search"
              : "No questions yet. Be the first to ask!"}
          </p>
        </div>
      ) : (
        <div className={styles.grid}>
          {filteredQuestions.map((question, index) => (
            <QuestionCard
              key={index}
              question={question}
              onClick={() => handleQuestionClick(question, index)}
            />
          ))}
        </div>
      )}

      {showModal && (
        <CreateQuestionModal
          onClose={() => setShowModal(false)}
          onSuccess={handleSuccess}
        />
      )}
    </div>
  );
};

export default Questions;
