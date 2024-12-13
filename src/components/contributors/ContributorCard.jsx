import { Podcast, UserCircle2 } from "lucide-react";
import PropTypes from "prop-types";
import styles from "./ContributorCard.module.css";

const ContributorCard = ({ data }) => {
  return (
    <li className={styles.contributor}>
      <div className={styles.icon}>
        <UserCircle2 size={50} />
      </div>
      <div className={styles.details}>
        <h3 className="">{data.accountId}</h3>
        <p>
          <Podcast size={20} /> {data.contributions} contributions
        </p>
      </div>
    </li>
  );
};

ContributorCard.propTypes = {
  data: PropTypes.object,
};

export default ContributorCard;
