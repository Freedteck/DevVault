import { useState, useContext } from "react";
import PropTypes from "prop-types";
import { userWalletContext } from "../../context/userWalletContext";
import topicMessageFnc from "../../client/topicMessage";
import Button from "../button/Button";
import styles from "./UpdateForm.module.css";

const topicId = import.meta.env.VITE_TOPIC_ID;

const UpdateForm = ({ closeForm, onAddDiscussion }) => {
  const { accountId, walletData } = useContext(userWalletContext);
  const [formState, setFormState] = useState({
    title: "",
    description: "",
  });

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormState((prev) => ({ ...prev, [name]: value }));
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();

    const { title, description } = formState;

    if (title && description) {
      if (accountId) {
        const metaData = {
          title,
          description,
          date: new Date().toISOString(),
          accountId,
          type: "update",
        };

        try {
          const [newMessage] = await topicMessageFnc(
            walletData,
            accountId,
            topicId,
            metaData
          );

          console.log(`New Message ${newMessage}! ✅`);

          onAddDiscussion(metaData);
          closeForm?.();
        } catch (error) {
          console.error("Failed to submit question:", error);
          alert("Failed to submit the question. Please try again.");
        }
      } else {
        alert("Please connect to HashPack wallet");
      }
    } else {
      alert("Please fill in all fields.");
    }
  };

  return (
    <div
      className={styles.bg}
      onClick={(e) => {
        if (e.target.className === styles.bg) closeForm?.();
      }}
    >
      <form method="post" className={styles.form} onSubmit={handleFormSubmit}>
        <fieldset>
          <legend>Add New Update </legend>
          <label>
            Title:
            <input
              type="text"
              name="title"
              placeholder="Give your discussion a title"
              required
              value={formState.title}
              onChange={handleInputChange}
            />
          </label>
          <label>
            Description:
            <textarea
              name="description"
              placeholder="Write your update here..."
              rows={8}
              cols={10}
              required
              value={formState.description}
              onChange={handleInputChange}
            />
          </label>

          <Button text="Submit" />
        </fieldset>
      </form>
    </div>
  );
};

UpdateForm.propTypes = {
  closeForm: PropTypes.func,
  onAddDiscussion: PropTypes.func,
};

export default UpdateForm;
