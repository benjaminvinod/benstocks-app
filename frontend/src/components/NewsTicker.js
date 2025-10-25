// src/components/NewsTicker.js

import React, { useState, useEffect } from 'react';
import { getFinancialNews } from '../api/newsApi';

// Helper component for the sentiment tag
const SentimentTag = ({ sentiment }) => {
    const style = {
        padding: '2px 8px',
        borderRadius: '12px',
        fontSize: '0.75rem',
        fontWeight: 'bold',
        color: '#fff',
        marginRight: '8px',
    };

    if (sentiment === 'POSITIVE') {
        style.backgroundColor = 'var(--brand-primary)'; // Blue for positive
    } else if (sentiment === 'NEGATIVE') {
        style.backgroundColor = 'var(--danger)'; // Red for negative
    } else {
        style.backgroundColor = 'var(--border-color)'; // Gray for neutral
    }

    return <span style={style}>{sentiment}</span>;
};


function NewsTicker() {
    const [news, setNews] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        const fetchNews = async () => {
            try {
                const data = await getFinancialNews();
                setNews(data);
            } catch (err) {
                setError('Could not load news feed.');
            }
            setLoading(false);
        };
        fetchNews();
    }, []);

    const containerStyle = {
        background: 'var(--bg-dark-primary)',
        padding: '1rem 1.5rem',
        borderRadius: '8px',
        marginBottom: '2rem',
        border: '1px solid var(--border-color)',
    };

    const newsItemStyle = {
        display: 'flex',
        alignItems: 'center',
        marginBottom: '0.5rem',
        paddingBottom: '0.5rem',
        borderBottom: '1px solid var(--border-color)',
    };
    
    if (loading) {
        return <div style={containerStyle}>Loading market news...</div>
    }

    if (error) {
        return <div style={containerStyle}><p style={{color: 'var(--danger)'}}>{error}</p></div>
    }

    return (
        <div style={containerStyle}>
            <h3 style={{ marginTop: 0, marginBottom: '1rem' }}>Latest Financial News</h3>
            {news.length > 0 ? (
                news.map((item, index) => (
                    <div key={index} style={newsItemStyle}>
                        <SentimentTag sentiment={item.sentiment} />
                        <a href={item.link} target="_blank" rel="noopener noreferrer">
                            {item.title}
                        </a>
                    </div>
                ))
            ) : (
                <p>No news available at the moment.</p>
            )}
        </div>
    );
}

export default NewsTicker;