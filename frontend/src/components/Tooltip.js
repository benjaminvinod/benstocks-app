// Tooltip.js
import React, { useState } from "react";

function Tooltip({ text, children }) {
  const [visible, setVisible] = useState(false);

  return (
    <span style={{ position: "relative", display: "inline-block" }}
          onMouseEnter={() => setVisible(true)}
          onMouseLeave={() => setVisible(false)}>
      {children}
      {visible && (
        <span style={{
          position: "absolute",
          bottom: "125%",
          left: "50%",
          transform: "translateX(-50%)",
          backgroundColor: "#333",
          color: "#fff",
          padding: "0.5rem",
          borderRadius: "4px",
          whiteSpace: "nowrap",
          zIndex: 1000
        }}>
          {text}
        </span>
      )}
    </span>
  );
}

export default Tooltip;
