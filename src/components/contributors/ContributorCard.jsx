import React from 'react'
import { Gift, LucideMessageCircleMore } from "lucide-react";

import './Contributor.css';

const ContributorCard = ({ data}) => {
  return (
    <li className="contributor-container">
      <div className="icon">{data.icon}</div>
      <h3 className="">{data.username}</h3>
      <div className="tips">
        <div className="tip">
          <Gift size={24} absoluteStrokeWidth />
          <p>{data.tips}</p>
        </div>

        <div className="tip">
          <LucideMessageCircleMore size={24} absoluteStrokeWidth />
          <p>{data.posts}</p>
        </div>
      </div>
    </li>
  );
};

export default ContributorCard