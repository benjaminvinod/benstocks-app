// src/pages/Disclaimer.js
import React from "react";
import { useNavigate } from "react-router-dom";

function Disclaimer() {
  const navigate = useNavigate();

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', textAlign: 'left', padding: '1rem' }}>
      <div className="page-header">
          <h1 style={{ textAlign: 'center' }}>Disclaimer & Important Information</h1>
      </div>
        
      <p style={{ textAlign: 'center', fontSize: '1.1rem', marginBottom: '2rem' }}>
        Welcome to BenStocks! Before you begin, you must read and understand the following points:
      </p>
        
      <ul style={{ listStyleType: 'disc', paddingLeft: '2rem', color: 'var(--text-secondary)' }}>
        
        <li style={{ marginBottom: '1.5rem' }}>
          <strong>Educational Purposes Only:</strong> BenStocks is a simulation and for educational use only. It is designed to help you learn about investing in a risk-free environment. It is not a real trading platform.
        </li>

        <li style={{ marginBottom: '1.5rem' }}>
          <strong>No Real Money:</strong> All money, balances, and values shown in this application are **entirely fake and simulated**. You cannot deposit or withdraw real currency. Any "gains" or "losses" have no real-world value.
        </li>

        <li style={{ marginBottom: '1.5rem' }}>
          <strong>Data Simulation and Delays:</strong> Please be aware of the following data limitations:
          <ul>
              <li style={{ marginTop: '0.5rem' }}>Mutual Fund data is simulated : The Net Asset Values (NAVs) shown are for illustrative purposes and do not reflect real-time, official prices.</li>
              <li style={{ marginTop: '0.5rem' }}>Stock market data may be delayed : All stock prices, charts, and metrics are retrieved from third-party APIs and may be delayed by 15 minutes or more.</li>
          </ul>
        </li>

        <li style={{ marginBottom: '1.5rem' }}>
          <strong>No Guarantee of Accuracy:</strong> While we strive to provide informative data, we do not guarantee the accuracy, completeness, or timeliness of any information on this site, including prices, charts, financial metrics, or news. You should not rely on this data for making real financial decisions.
        </li>

        <li style={{ marginBottom: '1.5rem' }}>
          <strong>Not Financial Advice:</strong> This application and all its content do not constitute financial, investment, legal, or tax advice. We are not financial advisors. The features, tools, and data are provided for educational context only.
        </li>

        <li style={{ marginBottom: '1.5rem' }}>
          <strong>No Guarantee of Future Results:</strong> Success within this simulator is not an indicator of future results in real-world investing. Simulated performance does not predict actual market returns, which can result in the loss of capital.
        </li>

        <li style={{ marginBottom: '1.5rem' }}>
          <strong>Limitation of Liability:</strong> By using BenStocks, you agree that its creators and affiliates are not liable for any real-world financial decisions you make, nor for any losses or damages you may incur as a result of interpreting or using the information provided herein. You are solely responsible for your actions.
        </li>

      </ul>
    </div>
  );
}

export default Disclaimer;