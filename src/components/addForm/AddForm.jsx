import { Form, useActionData } from "react-router-dom";
import Button from "../button/Button";
import styles from "./AddForm.module.css";
import PropTypes from "prop-types";
import { useContext } from "react";
import { userWalletContext } from "../../context/userWalletContext";

const AddForm = () => {
  const { accountId } = useContext(userWalletContext);
  const submitAction = useActionData();

  const handleSubmit = () => {
    if (submitAction.success) {
      console.log(submitAction.data, accountId);
    }
  };

  return (
    <div className={styles.bg}>
      <Form method="post" className={styles.form}>
        <fieldset>
          <legend>Ask your Question</legend>
          <label>
            Title:
            <input
              type="text"
              name="title"
              placeholder="Give your discussion a title"
              required
            />
          </label>
          <label>
            Description:
            <textarea
              name="description"
              placeholder="Describe your question"
              rows={8}
              cols={10}
              required
            />
          </label>

          <Button text="Submit" handleClick={handleSubmit} />
        </fieldset>
      </Form>
    </div>
  );
};

AddForm.propTypes = {
  handleClick: PropTypes.func,
};

export default AddForm;
