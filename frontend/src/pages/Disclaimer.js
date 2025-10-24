// Disclaimer.js
import React from "react";
import { useNavigate } from "react-router-dom";

function Disclaimer() {
  const navigate = useNavigate();

  const handleAccept = () => {
    navigate("/learn");
  };

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', textAlign: 'left', padding: '1rem' }}>
      <p style={{ textAlign: 'center', fontSize: '1.1rem', marginBottom: '2rem' }}>
        Welcome To BenStocks!
        
        Before you begin, please read and accept the following:
      </p>
        
      <ul style={{ listStyleType: 'disc', paddingLeft: '2rem', color: 'var(--text-secondary)' }}>
        <li style={{ marginBottom: '1rem' }}>
          <strong>Educational Purposes Only:</strong> BenStocks is a simulation and for educational use only. It is designed to help you learn about investing in a risk-free environment.
        </li>
        <li style={{ marginBottom: '1rem' }}>
          <strong>No Real Money:</strong> All money used in this application is <strong>fake and simulated</strong>. You cannot deposit or withdraw real currency. Any "gains" or "losses" have no real-world value.
        </li>
        <li style={{ marginBottom: '1rem' }}>
          <strong>Not Financial Advice:</strong> This application does not, and will not, provide any form of financial, investment, or legal advice. All data, calculations, and information are provided on an "as-is" basis and may not be accurate.
        </li>
        <li style={{ marginBottom: '1rem' }}>
          <strong>No Liability:</strong> We are not responsible for any real-world investment decisions you make based on information or experiences from using this simulator. Always consult with a qualified financial professional before making any real investments.
        </li>
      </ul>
    </div>
  );
}

export default Disclaimer;
