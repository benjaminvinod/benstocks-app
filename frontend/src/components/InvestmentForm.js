// InvestmentForm.js
import React, { useState } from "react";

function InvestmentForm({ onSubmit }) {
  const [symbol, setSymbol] = useState("");
  const [quantity, setQuantity] = useState(0);
  const [price, setPrice] = useState(0);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!symbol || quantity <= 0 || price <= 0) return;
    onSubmit({ symbol, quantity, buy_price: price, buy_date: new Date() });
    setSymbol("");
    setQuantity(0);
    setPrice(0);
  };

  return (
    <form onSubmit={handleSubmit} style={{ margin: "1rem 0" }}>
      <input
        type="text"
        placeholder="Symbol"
        value={symbol}
        onChange={(e) => setSymbol(e.target.value.toUpperCase())}
        style={{ marginRight: "0.5rem", padding: "0.3rem" }}
      />
      <input
        type="number"
        placeholder="Quantity"
        value={quantity}
        onChange={(e) => setQuantity(Number(e.target.value))}
        style={{ marginRight: "0.5rem", padding: "0.3rem" }}
      />
      <input
        type="number"
        placeholder="Price"
        value={price}
        onChange={(e) => setPrice(Number(e.target.value))}
        style={{ marginRight: "0.5rem", padding: "0.3rem" }}
      />
      <button type="submit" style={{ padding: "0.3rem 0.5rem" }}>Submit</button>
    </form>
  );
}

export default InvestmentForm;
