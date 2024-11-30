import React from 'react'

const QnACard = ({ title, description, date, owner }) => {
    
  return (
    <div className="qna-card">
      <h2 className="qna-title">{title}</h2>
      <p className="qna-description">{description}</p>
      <div className="qna-meta">
        <span className="qna-date">{date}</span>
        <span className="qna-owner">By: {owner}</span>
      </div>
    </div>
  );
};

export default QnACard