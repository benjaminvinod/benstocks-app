// src/components/StockChart.js

import React, { useState, useEffect } from 'react';
import { getStockHistory } from '../api/stocks';
import { Line } from 'react-chartjs-2';
import { parseISO, isValid as isValidDate } from 'date-fns';

import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, TimeScale, Filler } from 'chart.js';
import 'chartjs-adapter-date-fns'; 

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, TimeScale, Filler); 

// --- START: MODIFIED CODE (Accepts currency prop) ---
function StockChart({ symbol, currency }) {
// --- END: MODIFIED CODE ---
  const [chartData, setChartData] = useState(null);
  const [period, setPeriod] = useState('1y');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let isMounted = true; 

    const fetchHistory = async () => {
      if (!isMounted) return; 
      setLoading(true);
      setError('');
      setChartData(null); 
      
      try {
        const history = await getStockHistory(symbol, period);
        
        if (!isMounted) return; 

        if (!history || !Array.isArray(history) || history.length === 0) {
          throw new Error(`No historical data found for ${symbol} for period ${period}.`);
        }
        
        const dataPoints = history
          .map(data => {
            const date = parseISO(data.Date); 
            const price = data.Close !== null ? Number(data.Close) : null;
            if (!isValidDate(date) || price === null || isNaN(price)) {
              console.warn("Skipping invalid data point:", data);
              return null; 
            }
            return { x: date, y: price };
          })
          .filter(point => point !== null) 
          .sort((a, b) => a.x - b.x); 

         if (dataPoints.length === 0) {
           throw new Error("Valid chart data could not be processed.");
         }
        
        if (isMounted) { 
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

    return () => {
      isMounted = false; 
    };

  }, [symbol, period]); 

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      x: {
        type: 'time',
        time: {
          unit: 'month',
          tooltipFormat: 'MMM dd, yyyy',
        },
        ticks: { color: 'var(--text-secondary)', maxRotation: 0, autoSkip: true, maxTicksLimit: 7 },
        grid: { color: 'rgba(74, 85, 104, 0.4)' }
      },
      y: {
        ticks: {
          color: 'var(--text-secondary)',
          // --- START: MODIFIED CODE (Uses currency prop for formatting) ---
          callback: function(value) {
            const locale = currency === 'INR' ? 'en-IN' : 'en-US';
            return new Intl.NumberFormat(locale, {
                style: 'currency',
                currency: currency,
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
            }).format(value);
          }
          // --- END: MODIFIED CODE ---
        },
        grid: { color: 'rgba(74, 85, 104, 0.4)' }
      }
    },
    plugins: {
      legend: { display: false },
      tooltip: {
        mode: 'index',
        intersect: false,
        callbacks: {
            // --- START: MODIFIED CODE (Uses currency prop for formatting) ---
            label: function(context) {
                let label = context.dataset.label || '';
                if (label) { label += ': '; }
                if (context.parsed.y !== null) {
                    const locale = currency === 'INR' ? 'en-IN' : 'en-US';
                    label += new Intl.NumberFormat(locale, {
                        style: 'currency',
                        currency: currency,
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                    }).format(context.parsed.y);
                }
                return label;
            }
            // --- END: MODIFIED CODE ---
        }
      }
    },
    interaction: {
        mode: 'index',
        intersect: false,
    },
  };
  
  const periodButtons = ['1mo', '3mo', '6mo', '1y', '5y', 'max'];

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
               backgroundColor: period === p ? 'var(--brand-primary)' : 'var(--bg-dark-primary)', 
               border: '1px solid var(--border-color)',
               color: period === p ? 'white' : 'var(--text-secondary)',
               cursor: 'pointer'
             }}
           >
             {p.toUpperCase()}
           </button>
        ))}
      </div>

      <div style={{ position: 'relative', height: 'calc(100% - 40px)' }}>
        {loading && <p>Loading chart for {period}...</p>}
        {error && <p style={{ color: 'var(--danger)' }}>Error: {error}</p>}
        {chartData && !loading && !error && (
            <Line options={chartOptions} data={chartData} />
        )}
      </div>
    </div>
  );
}

export default StockChart;