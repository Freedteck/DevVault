import React from 'react'
import QnACard from './QnACard'

const QnAList = ({data}) => {
  return (
    <div className="qna-list">
      {data.map((qna) => (
        <QnACard
          key={qna.id}
          title={qna.title}
          description={qna.description}
          date={qna.date}
          owner={qna.owner}
        />
      ))}
    </div>
  );
}

export default QnAList