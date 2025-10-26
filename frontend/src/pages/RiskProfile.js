// src/pages/RiskProfile.js

import React, { useState } from 'react';
import BackButton from '../components/BackButton';
import { Link } from 'react-router-dom';

const questions = [
    {
        questionText: 'What is your age group?',
        answers: [
            { answerText: 'Under 30', points: 3 },
            { answerText: '30 - 50', points: 2 },
            { answerText: 'Over 50', points: 1 },
        ],
    },
    {
        questionText: 'What is your primary investment goal?',
        answers: [
            { answerText: 'Aggressive Growth (Maximize returns, comfortable with high risk)', points: 3 },
            { answerText: 'Balanced Growth (A mix of safety and returns)', points: 2 },
            { answerText: 'Capital Preservation (Protect my initial investment)', points: 1 },
        ],
    },
    {
        questionText: 'How long do you plan to keep your money invested?',
        answers: [
            { answerText: 'More than 10 years', points: 3 },
            { answerText: '3 to 10 years', points: 2 },
            { answerText: 'Less than 3 years', points: 1 },
        ],
    },
    {
        questionText: 'Imagine the market drops 20% in a month. What is your reaction?',
        answers: [
            { answerText: 'Buy more. It\'s a great opportunity!', points: 3 },
            { answerText: 'Hold and do nothing, I trust my long-term plan', points: 2 },
            { answerText: 'Sell some or all of my investments to avoid further loss', points: 1 },
        ],
    },
    {
        questionText: 'How would you describe your investment knowledge?',
        answers: [
            { answerText: 'Expert (I have significant experience and understand complex instruments)', points: 3 },
            { answerText: 'Intermediate (I understand the basics of stocks, MFs, and risk)', points: 2 },
            { answerText: 'Novice (I am new to investing)', points: 1 },
        ],
    },
];

const recommendations = {
    Conservative: {
        description: "You prioritize protecting your capital and are not comfortable with significant market fluctuations. Your goal is steady, albeit slow, growth.",
        assets: [
            { symbol: "LIQUIDBEES.NS", name: "Liquid ETF", reason: "Extremely low risk, provides stability." },
            { symbol: "GOLDBEES.NS", name: "Gold ETF", reason: "A traditional safe-haven asset." },
            { symbol: "SBI-BLUE", name: "Large-Cap Mutual Fund", reason: "Invests in large, stable companies." },
        ]
    },
    Moderate: {
        description: "You seek a balance between growth and risk. You're willing to accept some market volatility for potentially higher returns over the medium to long term.",
        assets: [
            { symbol: "NIFTYBEES.NS", name: "Nifty 50 ETF", reason: "Diversified exposure to India's top 50 companies." },
            { symbol: "JUNIORBEES.NS", name: "Nifty Next 50 ETF", reason: "Slightly higher growth potential than Nifty 50." },
            { symbol: "PARA-FLEXI", name: "Flexi-Cap Mutual Fund", reason: "Professionally managed fund that invests across market caps." },
        ]
    },
    Aggressive: {
        description: "You are comfortable with high risk and significant market volatility in pursuit of the highest possible returns. You have a long-term perspective.",
        assets: [
            { symbol: "MON100.NS", name: "Nasdaq 100 ETF", reason: "High-growth US technology stocks." },
            { symbol: "QUAN-SMALL", name: "Small-Cap Mutual Fund", reason: "High risk, high return potential from small companies." },
            { symbol: "TATA-DIGITAL", name: "Thematic/Sectoral Fund", reason: "Concentrated bet on the high-growth technology sector." },
        ]
    }
};


function RiskProfile() {
    const [answers, setAnswers] = useState({});
    const [result, setResult] = useState(null);

    const handleAnswerChange = (questionIndex, points) => {
        setAnswers({
            ...answers,
            [questionIndex]: points
        });
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        if (Object.keys(answers).length < questions.length) {
            alert("Please answer all questions.");
            return;
        }

        const totalScore = Object.values(answers).reduce((sum, points) => sum + points, 0);

        let profile = '';
        if (totalScore <= 7) {
            profile = 'Conservative';
        } else if (totalScore <= 12) {
            profile = 'Moderate';
        } else {
            profile = 'Aggressive';
        }
        setResult({ score: totalScore, profile: profile });
    };

    return (
        <div className="container" style={{ maxWidth: '800px' }}>
            <BackButton />
            <div className="page-header">
                <h1>Investor Risk Profile</h1>
                <p>Answer these questions to understand your risk tolerance and get tailored investment suggestions.</p>
            </div>

            {!result ? (
                <form onSubmit={handleSubmit}>
                    {questions.map((q, index) => (
                        <div key={index} style={{ marginBottom: '2rem', background: 'var(--bg-dark-primary)', padding: '1.5rem', borderRadius: '8px' }}>
                            <h3 style={{ marginTop: 0 }}>{index + 1}. {q.questionText}</h3>
                            {q.answers.map((answer, ansIndex) => (
                                <div key={ansIndex} style={{ margin: '0.5rem 0' }}>
                                    <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
                                        <input
                                            type="radio"
                                            name={`question-${index}`}
                                            required
                                            onChange={() => handleAnswerChange(index, answer.points)}
                                            style={{ width: 'auto', marginRight: '1rem' }}
                                        />
                                        {answer.answerText}
                                    </label>
                                </div>
                            ))}
                        </div>
                    ))}
                    <button type="submit" style={{ width: '100%', fontSize: '1.2rem' }}>Calculate My Profile</button>
                </form>
            ) : (
                <div style={{ textAlign: 'center', background: 'var(--bg-dark-primary)', padding: '2rem', borderRadius: '12px' }}>
                    <h2 style={{ color: 'var(--brand-primary)' }}>Your Profile is: {result.profile}</h2>
                    <p style={{ color: 'var(--text-secondary)', maxWidth: '600px', margin: '0 auto 2rem auto' }}>
                        {recommendations[result.profile].description}
                    </p>

                    <h3>Suggested Investments for You:</h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', textAlign: 'left' }}>
                        {recommendations[result.profile].assets.map(asset => (
                            <Link to={`/stock/${asset.symbol}`} key={asset.symbol} className="recommendation-card" style={{
                                background: 'var(--bg-dark-secondary)',
                                padding: '1rem',
                                borderRadius: '8px',
                                textDecoration: 'none',
                                border: '1px solid var(--border-color)',
                                transition: 'all 0.2s ease'
                            }}>
                                <h4 style={{ margin: 0, color: 'var(--text-primary)' }}>{asset.name} ({asset.symbol})</h4>
                                <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>{asset.reason}</p>
                            </Link>
                        ))}
                    </div>

                    <button onClick={() => { setResult(null); setAnswers({}); }} style={{ marginTop: '2rem' }}>
                        Retake Questionnaire
                    </button>
                </div>
            )}
        </div>
    );
}

export default RiskProfile;