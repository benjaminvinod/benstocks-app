// src/pages/PrivacyPolicy.js

import React from 'react';
import BackButton from '../components/BackButton';

function PrivacyPolicy() {
  return (
    <div className="container">
      <BackButton />
      <div className="page-header">
        <h1>Privacy Policy</h1>
        <p>Last Updated: October 25, 2025</p>
      </div>

      <h2>1. Information We Collect</h2>
      <p>
        We collect information you provide directly to us when you create an account, specifically:
        <ul>
          <li><strong>Username:</strong> To identify you within the Service.</li>
          <li><strong>Email Address:</strong> To allow for account login and communication.</li>
          <li><strong>Hashed Password:</strong> We store a secure, hashed version of your password. We never store your plain-text password.</li>
        </ul>
      </p>

      <h2>2. How We Use Your Information</h2>
      <p>
        We use the information we collect to operate, maintain, and provide you with the features and functionality of the Service. Your email address is used solely for authentication and will not be shared with third parties for marketing purposes.
      </p>

      <h2>3. Data Storage</h2>
      <p>
        All user data, including simulated portfolio and transaction history, is stored securely. We take reasonable measures to protect your information from unauthorized access or disclosure.
      </p>
      
      <h2>4. Cookies and Local Storage</h2>
      <p>
        We use local storage in your browser to maintain your login session. This is essential for the functionality of the application. We do not use third-party tracking cookies.
      </p>

      <h2>5. Data Deletion</h2>
      <p>
        You may request the deletion of your account and all associated data at any time by contacting us. Upon request, we will permanently delete all your personal and simulated financial data.
      </p>
      
      <h2>6. Changes to This Policy</h2>
      <p>
        We may update this Privacy Policy from time to time. We will notify you of any changes by posting the new Privacy Policy on this page.
      </p>
    </div>
  );
}

export default PrivacyPolicy;