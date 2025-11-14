import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Plus } from "lucide-react";
import Button from "../../components/ui/Button";
import QuestionCard from "../../components/features/QuestionCard";
import CreateQuestionModal from "../../components/features/CreateQuestionModal";
import SearchBar from "../../components/features/SearchBar";
import { useQuestions } from "../../hooks/useHCSData";
import styles from "./Questions.module.css";

const Questions = () => {
  const navigate = useNavigate();
  const {
    data: questions,
    isLoading,
    refetch,
    hasMore,
    loadMore,
  } = useQuestions();
  const [filteredQuestions, setFilteredQuestions] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  useEffect(() => {
    setFilteredQuestions(questions);
  }, [questions]);

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

  const handleQuestionClick = (question) => {
    navigate(`/question/${question.sequence_number}`, { state: { question } });
  };

  const handleSuccess = async () => {
    await refetch();
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
        <>
          <div className={styles.grid}>
            {filteredQuestions.map((question) => (
              <QuestionCard
                key={question.sequence_number}
                question={question}
                onClick={() => handleQuestionClick(question)}
              />
            ))}
          </div>
          {hasMore && !searchQuery && (
            <div className={styles.loadMore}>
              <Button
                variant="outline"
                onClick={async () => {
                  setIsLoadingMore(true);
                  await loadMore();
                  setIsLoadingMore(false);
                }}
                disabled={isLoadingMore}
              >
                {isLoadingMore ? "Loading..." : "Load More"}
              </Button>
            </div>
          )}
        </>
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
