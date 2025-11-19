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

// --- UPDATED: Handles both International (M/B) and Indian (L/Cr) systems ---
export const formatLargeNumber = (num, system = 'INTL') => {
    if (num === null || num === undefined || isNaN(num)) {
      return 'N/A';
    }

    // Handle negative numbers
    const sign = num < 0 ? "-" : "";
    num = Math.abs(num);

    if (system === 'IN') {
        // Indian System: Lakhs (1e5) and Crores (1e7)
        if (num >= 1e7) { // 1 Crore = 10,000,000
            return sign + (num / 1e7).toFixed(2) + ' Cr';
        }
        if (num >= 1e5) { // 1 Lakh = 100,000
            return sign + (num / 1e5).toFixed(2) + ' L';
        }
        if (num >= 1e3) {
            return sign + (num / 1e3).toFixed(2) + ' K';
        }
        return sign + num.toString();
    } else {
        // International System: Millions (1e6), Billions (1e9), Trillions (1e12)
        if (num >= 1e12) {
            return sign + (num / 1e12).toFixed(2) + ' T';
        }
        if (num >= 1e9) {
            return sign + (num / 1e9).toFixed(2) + ' B';
        }
        if (num >= 1e6) {
            return sign + (num / 1e6).toFixed(2) + ' M';
        }
        if (num >= 1e3) {
            return sign + (num / 1e3).toFixed(2) + ' K';
        }
        return sign + num.toString();
    }
};