import React, { useState, useEffect } from 'react';
import { getStockHistory } from '../api/stocks';
import { Line } from 'react-chartjs-2';
import { parseISO, isValid as isValidDate } from 'date-fns'; // Import isValid

import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, TimeScale, Filler } from 'chart.js';
import 'chartjs-adapter-date-fns'; 

// Register Filler for background color
ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, TimeScale, Filler); 

function StockChart({ symbol }) {
  const [chartData, setChartData] = useState(null);
  const [period, setPeriod] = useState('1y');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let isMounted = true; // Prevent state updates if component unmounts

    const fetchHistory = async () => {
      if (!isMounted) return; // Exit if component unmounted
      setLoading(true);
      setError('');
      setChartData(null); 
      
      try {
        const history = await getStockHistory(symbol, period);
        
        if (!isMounted) return; // Exit if component unmounted after fetch

        if (!history || !Array.isArray(history) || history.length === 0) {
          throw new Error(`No historical data found for ${symbol} for period ${period}.`);
        }
        
        // --- Data Processing with Validation ---
        const dataPoints = history
          .map(data => {
            const date = parseISO(data.Date); // Parse ISO string (now expects UTC 'Z')
            const price = data.Close !== null ? Number(data.Close) : null;
            // Validate both date and price
            if (!isValidDate(date) || price === null || isNaN(price)) {
              console.warn("Skipping invalid data point:", data);
              return null; // Skip invalid points
            }
            return { x: date, y: price };
          })
          .filter(point => point !== null) // Remove skipped points
          // Optional: Sort points just in case API returns unsorted data
          .sort((a, b) => a.x - b.x); 

         if (dataPoints.length === 0) {
           throw new Error("Valid chart data could not be processed.");
         }
        
        if (isMounted) { // Check again before setting state
          setChartData({
            datasets: [{
                label: `${symbol} Price`,
                data: dataPoints,
                borderColor: 'var(--brand-primary)',
                backgroundColor: 'rgba(66, 153, 225, 0.2)',
                fill: true,
                tension: 0.1,
                pointRadius: 0, 
            }],
          });
        }
      } catch (err) {
         console.error("Chart loading error:", err); 
         if (isMounted) {
            setError(err.message || "Failed to load chart data.");
         }
      } finally {
         if (isMounted) {
            setLoading(false);
         }
      }
    };

    fetchHistory();

    // Cleanup function
    return () => {
      isMounted = false; 
    };

  }, [symbol, period]); // Refetch when symbol or period changes

  const chartOptions = { /* ... (options remain the same as previous step, ensure TimeScale is configured) ... */ };
  
  const periodButtons = ['1mo', '3mo', '6mo', '1y', '5y', 'max']; // Added 3mo

  return (
    <div style={{ marginTop: '2rem', height: '400px' }}>
      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
        {periodButtons.map(p => (
           <button 
             key={p} 
             onClick={() => setPeriod(p)}
             style={{
               padding: '0.5rem 1rem',
               fontSize: '0.8rem',
               // Highlight active button
               backgroundColor: period === p ? 'var(--brand-primary)' : 'var(--bg-dark-primary)', 
               border: '1px solid var(--border-color)',
               color: period === p ? 'white' : 'var(--text-secondary)', // Change text color too
               cursor: 'pointer'
             }}
           >
             {p.toUpperCase()}
           </button>
        ))}
      </div>

      <div style={{ position: 'relative', height: 'calc(100% - 40px)' }}> {/* Adjust height */}
        {loading && <p>Loading chart for {period}...</p>}
        {error && <p style={{ color: 'var(--danger)' }}>Error: {error}</p>}
        {/* Only render chart if data exists and not loading/error */}
        {chartData && !loading && !error && (
            <Line options={chartOptions} data={chartData} />
        )}
      </div>
    </div>
  );
}

export default StockChart;