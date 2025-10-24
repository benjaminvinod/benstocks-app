// format.js

// Format number as currency (e.g., ₹1,00,000 or $150.00)
export const formatCurrency = (amount, currencyCode = 'INR') => {
  if (typeof amount !== 'number') {
    amount = 0;
  }
  
  const options = {
    style: 'currency',
    currency: currencyCode,
    maximumFractionDigits: 2,
    minimumFractionDigits: 2,
  };
  
  // Use 'en-IN' for Indian Rupees to get lakhs/crores formatting
  // Use 'en-US' for all other currencies
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