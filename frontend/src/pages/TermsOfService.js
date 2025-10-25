// src/pages/TermsOfService.js

import React from 'react';
import BackButton from '../components/BackButton';

function TermsOfService() {
  return (
    <div className="container">
      <BackButton />
      <div className="page-header">
        <h1>Terms of Service</h1>
        <p>Last Updated: October 25, 2025</p>
      </div>

      <h2>1. Acceptance of Terms</h2>
      <p>
        By accessing and using BenStocks ("the Service"), you accept and agree to be bound by the terms and provision of this agreement. This Service is provided for educational and simulation purposes only.
      </p>

      <h2>2. Description of Service</h2>
      <p>
        BenStocks is a virtual stock market simulator. All currency, stocks, transactions, and data are simulated and do not represent real-world value or assets. The Service is intended to provide a risk-free environment for learning about financial markets.
      </p>

      <h2>3. User Conduct</h2>
      <p>
        You are responsible for all activity that occurs under your account. You agree not to use the Service for any illegal or unauthorized purpose. You must not, in the use of the Service, violate any laws in your jurisdiction.
      </p>

      <h2>4. No Financial Advice</h2>
      <p>
        The information provided by BenStocks is for informational and educational purposes only. It is not intended as, and should not be understood or construed as, financial advice. We are not financial advisors, and you should consult with a professional before making any real-world investment decisions.
      </p>
      
      <h2>5. Disclaimer of Warranties</h2>
      <p>
        The Service is provided "as is" and "as available" without any warranties of any kind. We do not guarantee the accuracy, completeness, or timeliness of the simulated market data.
      </p>

      <h2>6. Limitation of Liability</h2>
      <p>
        In no event shall BenStocks or its owners be liable for any direct, indirect, incidental, special, consequential or exemplary damages, including but not limited to, damages for loss of profits, goodwill, use, data or other intangible losses resulting from the use of or inability to use the service.
      </p>

      <h2>7. Changes to Terms</h2>
      <p>
        We reserve the right to update and change the Terms of Service from time to time without notice. Continued use of the Service after any such changes shall constitute your consent to such changes.
      </p>
    </div>
  );
}

export default TermsOfService;