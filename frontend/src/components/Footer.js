// Footer.js
import React from "react";

function Footer() {
  return (
    <footer style={{
      textAlign: "center",
      padding: "1rem",
      marginTop: "2rem",
      borderTop: "1px solid #ccc"
    }}>
      <p>&copy; {new Date().getFullYear()} BenStocks. All rights reserved.</p>
    </footer>
  );
}

export default Footer;
