// src/components/Footer.js

import React from "react";
import { Link } from "react-router-dom"; // Import Link

function Footer() {
  return (
    <footer style={{
      textAlign: "center",
      padding: "1rem",
      marginTop: "auto", // Pushes footer to the bottom
      borderTop: "1px solid var(--border-color)",
      backgroundColor: 'var(--bg-dark-secondary)'
    }}>
      <div style={{ marginBottom: '0.5rem' }}>
        {/* --- START: ADDED CODE --- */}
        <Link to="/terms" style={{ margin: '0 1rem', color: 'var(--text-secondary)' }}>Terms of Service</Link>
        <Link to="/privacy" style={{ margin: '0 1rem', color: 'var(--text-secondary)' }}>Privacy Policy</Link>
        {/* --- END: ADDED CODE --- */}
      </div>
      <p style={{ margin: 0, color: 'var(--text-secondary)' }}>&copy; {new Date().getFullYear()} BenStocks. All rights reserved. Educational Simulator.</p>
    </footer>
  );
}

export default Footer;