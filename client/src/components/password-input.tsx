import React, { useState } from 'react';
import './password-input.css';

export const PasswordInput: React.FC = () => {
  const [isVisible, setIsVisible] = useState(false);

  const toggleVisibility = () => {
    setIsVisible(!isVisible);
  };

  return (
    <div className="password-container">
      <input
        type={isVisible ? "text" : "password"}
        placeholder="Enter your password"
        className="password-input"
      />
      <svg
        className={`eye-icon ${!isVisible ? 'close' : ''}`}
        viewBox="0 0 100 100"
        onClick={toggleVisibility}
      >
        <path
          id="top-eye-part"
          d="M10,50 Q50,-10 90,50"
          fill="none"
          strokeWidth="5"
        />
        <path
          id="bottom-eye-part"
          d="M10,50 Q50,110 90,50"
          fill="none"
          strokeWidth="5"
        />
        <circle cx="50" cy="50" r="10" />
      </svg>
    </div>
  );
};