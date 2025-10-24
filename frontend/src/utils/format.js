// src/utils/format.js

// Format number as currency (e.g., ₹1,00,000 or $150.00)
export const formatCurrency = (amount, currencyCode = 'INR') => {
  if (typeof amount !== 'number' || isNaN(amount)) {
    amount = 0;
  }
  
  const options = {
    style: 'currency',
    currency: currencyCode,
    maximumFractionDigits: 2,
    minimumFractionDigits: 2,
  };
  
  const locale = currencyCode.toUpperCase() === 'INR' ? 'en-IN' : 'en-US';

  return new Intl.NumberFormat(locale, options).format(amount);
};

// Format date as DD/MM/YYYY
export const formatDate = (dateString) => {
  try {
    const date = new Date(dateString);
    if (isNaN(date)) return "Invalid Date";
    
    return `${date.getDate().toString().padStart(2, '0')}/${
      (date.getMonth() + 1).toString().padStart(2, '0')}/${
      date.getFullYear()}`;
  } catch (error) {
    return "Invalid Date";
  }
};

// This new function formats very large numbers into a short format (B for billion, T for trillion)
export const formatLargeNumber = (num) => {
    if (num === null || num === undefined || isNaN(num)) {
      return 'N/A';
    }
    if (num >= 1e12) {
      return (num / 1e12).toFixed(2) + 'T';
    }
    if (num >= 1e9) {
      return (num / 1e9).toFixed(2) + 'B';
    }
    if (num >= 1e6) {
      return (num / 1e6).toFixed(2) + 'M';
    }
    if (num >= 1e3) {
      return (num / 1e3).toFixed(2) + 'K';
    }
    return num.toString();
};
