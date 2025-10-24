import React from 'react';
import { useNavigate } from 'react-router-dom';

function BackButton() {
  const navigate = useNavigate();

  // Simple style for the back button
  const buttonStyle = {
    background: 'none',
    border: '1px solid var(--border-color)',
    color: 'var(--text-secondary)',
    padding: '0.5rem 1rem',
    borderRadius: '8px',
    cursor: 'pointer',
    marginBottom: '1.5rem',
    fontSize: '0.9rem',
    transition: 'all 0.2s ease',
  };

  const hoverStyle = {
    borderColor: 'var(--brand-primary)',
    color: 'var(--brand-primary)',
  };

  // State to handle hover
  const [isHovered, setIsHovered] = React.useState(false);

  return (
    <button 
      style={{ ...buttonStyle, ...(isHovered ? hoverStyle : null) }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={() => navigate(-1)} // This is the magic: it goes back one page
    >
      &larr; Back
    </button>
  );
}

export default BackButton;