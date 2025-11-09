import { Search as SearchIcon } from "lucide-react";
import PropTypes from "prop-types";
import Input from "../ui/Input";
import styles from "./SearchBar.module.css";

const SearchBar = ({ value, onChange, placeholder = "Search..." }) => {
  return (
    <div className={styles.searchBar}>
      <Input
        type="text"
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        fullWidth
      />
      <SearchIcon size={20} className={styles.searchIcon} />
    </div>
  );
};

SearchBar.propTypes = {
  value: PropTypes.string.isRequired,
  onChange: PropTypes.func.isRequired,
  placeholder: PropTypes.string,
};

export default SearchBar;
