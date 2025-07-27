import React from 'react';
import { useNavigate } from 'react-router-dom';
import './calltoaction.css'

const CallToAction = () => {
  const navigate = useNavigate();

  const handleStartContributing = () => {
    navigate('/discussions');
  };

  return (
    <div className='action'>
      <h2>
         Join a community of developers making a
        difference!.
      </h2>
      <button className='btn-action' onClick={handleStartContributing}>
        Start Contributing Today!
      </button>
    </div>
  );
};
