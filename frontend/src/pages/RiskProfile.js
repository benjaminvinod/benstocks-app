// src/pages/RiskProfile.js

import React, { useState } from 'react';
import BackButton from '../components/BackButton';
import { Link } from 'react-router-dom';

const questions = [
    // --- Section 1: Financial Situation & Goals ---
    {
        section: "Your Financial Situation & Goals",
        questionText: 'What is your age group?',
        answers: [ { answerText: 'Under 30', points: 3 }, { answerText: '30 - 50', points: 2 }, { answerText: 'Over 50', points: 1 } ],
    },
    {
        questionText: 'How would you describe your primary source of income?',
        answers: [ { answerText: 'Very stable (e.g., tenured government job, long-term contract)', points: 3 }, { answerText: 'Reasonably stable (e.g., regular salaried job in the private sector)', points: 2 }, { answerText: 'Unstable or variable (e.g., freelance, business owner, commission-based)', points: 1 } ],
    },
    {
        questionText: 'What is your primary investment goal?',
        answers: [ { answerText: 'Wealth Creation (long-term, high growth)', points: 3 }, { answerText: 'Major Purchase (e.g., house, education) in 5-10 years', points: 2 }, { answerText: 'Regular Income or Capital Preservation', points: 1 } ],
    },
    {
        questionText: 'How long do you plan to keep your money invested?',
        answers: [ { answerText: 'More than 10 years', points: 3 }, { answerText: '3 to 10 years', points: 2 }, { answerText: 'Less than 3 years', points: 1 } ],
    },
    {
        questionText: 'How many people are financially dependent on you?',
        answers: [ { answerText: 'None', points: 3 }, { answerText: '1 to 2', points: 2 }, { answerText: '3 or more', points: 1 } ],
    },
    {
        questionText: 'Do you have an emergency fund (covering 3-6 months of expenses)?',
        answers: [ { answerText: 'Yes, fully funded and separate from investments', points: 3 }, { answerText: 'Partially funded or mixed with investments', points: 2 }, { answerText: 'No, I don\'t have a dedicated emergency fund', points: 1 } ],
    },
    // --- Section 2: Investment Knowledge & Experience ---
    {
        section: "Your Investment Knowledge & Experience",
        questionText: 'How long have you been investing in markets (stocks, MFs, etc.)?',
        answers: [ { answerText: 'More than 5 years', points: 3 }, { answerText: '1 to 5 years', points: 2 }, { answerText: 'Less than 1 year or not yet started', points: 1 } ],
    },
    {
        questionText: 'Which of these have you invested in before?',
        answers: [ { answerText: 'Individual stocks, crypto, or other high-risk assets', points: 3 }, { answerText: 'Mutual Funds or ETFs', points: 2 }, { answerText: 'Only savings accounts, fixed deposits, or government bonds', points: 1 } ],
    },
    {
        questionText: 'How do you typically make investment decisions?',
        answers: [ { answerText: 'After detailed personal research of financial statements and market trends', points: 3 }, { answerText: 'Based on advice from financial news, experts, or a trusted advisor', points: 2 }, { answerText: 'Based on tips from friends, social media, or gut feeling', points: 1 } ],
    },
    {
        questionText: 'The term "diversification" in investing is about...',
        answers: [ { answerText: 'Reducing risk by spreading investments across various assets', points: 3 }, { answerText: 'Focusing on a single, high-performing stock', points: 1 }, { answerText: 'I\'m not sure', points: 1 } ],
    },
    {
        questionText: 'If an investment is described as "volatile," it means...',
        answers: [ { answerText: 'Its price can change dramatically in a short time', points: 3 }, { answerText: 'It is guaranteed to provide high returns', points: 1 }, { answerText: 'I\'m not sure', points: 1 } ],
    },
    {
        questionText: 'What percentage of your total savings do you currently invest in markets?',
        answers: [ { answerText: 'More than 50%', points: 3 }, { answerText: '10% to 50%', points: 2 }, { answerText: 'Less than 10%', points: 1 } ],
    },
    // --- Section 3: Risk Tolerance & Behavior ---
    {
        section: "Your Risk Tolerance & Behavior",
        questionText: 'Imagine your portfolio drops 20% in a month. What is your most likely reaction?',
        answers: [ { answerText: 'Invest more. It\'s a great buying opportunity!', points: 3 }, { answerText: 'Hold and do nothing, I trust my long-term plan', points: 2 }, { answerText: 'Sell some or all of my investments to prevent further loss', points: 1 } ],
    },
    {
        questionText: 'Which of these investment outcomes would you prefer?',
        answers: [ { answerText: 'A high potential return of 25%, but with a risk of losing 15%', points: 3 }, { answerText: 'A moderate potential return of 12%, with a risk of losing 5%', points: 2 }, { answerText: 'A guaranteed return of 6%, with no risk of loss', points: 1 } ],
    },
    {
        questionText: 'You are given a "hot stock tip" from a friend that promises quick returns. What do you do?',
        answers: [ { answerText: 'Ignore it completely as it\'s likely unreliable', points: 3 }, { answerText: 'Do my own thorough research before considering it', points: 2 }, { answerText: 'Invest a small amount quickly to not miss out', points: 1 } ],
    },
    {
        questionText: 'How comfortable are you with complex financial products?',
        answers: [ { answerText: 'Very comfortable, I enjoy learning about them', points: 3 }, { answerText: 'Somewhat comfortable, but I prefer simple investments', points: 2 }, { answerText: 'Not comfortable at all, I avoid them', points: 1 } ],
    },
    {
        questionText: 'Your long-term investments are performing well. What is your next move?',
        answers: [ { answerText: 'Look for new, potentially higher-growth opportunities to add', points: 3 }, { answerText: 'Continue investing as per my original plan (e.g., regular SIP)', points: 2 }, { answerText: 'Sell a portion to lock in profits', points: 1 } ],
    },
    {
        questionText: 'How important is it for you to be able to access your invested money immediately?',
        answers: [ { answerText: 'Not important for my long-term goals', points: 3 }, { answerText: 'Somewhat important, I might need some of it in 1-2 years', points: 2 }, { answerText: 'Very important, I need to be able to withdraw it anytime without loss', points: 1 } ],
    },
    {
        questionText: 'When it comes to investing, I prioritize...',
        answers: [ { answerText: 'Maximizing returns, even if it means taking on significant risk', points: 3 }, { answerText: 'A healthy balance of risk and return', points: 2 }, { answerText: 'Protecting my money from any potential loss', points: 1 } ],
    },
    {
        questionText: 'How often would you ideally check your investment portfolio?',
        answers: [ { answerText: 'Quarterly or even less frequently', points: 3 }, { answerText: 'Monthly or weekly', points: 2 }, { answerText: 'Daily or multiple times a day', points: 1 } ],
    },
];

const recommendations = {
    Conservative: {
        description: "You prioritize protecting your capital and are not comfortable with significant market fluctuations. Your goal is steady, albeit slow, growth. You prefer safe and reliable investments.",
        assets: [ { symbol: "LIQUIDBEES.NS", name: "Liquid ETF", reason: "Extremely low risk, provides stability and is better than a savings account." }, { symbol: "GOLDBEES.NS", name: "Gold ETF", reason: "A traditional safe-haven asset that performs well during uncertainty." }, { symbol: "SBI-BLUE", name: "Large-Cap Mutual Fund", reason: "Invests in India's largest and most stable companies, offering moderate growth." }, ]
    },
    Moderate: {
        description: "You seek a balance between growth and safety. You're willing to accept some market volatility for potentially higher returns over the medium to long term.",
        assets: [ { symbol: "NIFTYBEES.NS", name: "Nifty 50 ETF", reason: "Diversified exposure to India's top 50 companies, the cornerstone of any portfolio." }, { symbol: "PARA-FLEXI", name: "Flexi-Cap Mutual Fund", reason: "Professionally managed fund that invests across market caps for balanced growth." }, { symbol: "HDFC-MID", name: "Mid-Cap Mutual Fund", reason: "Adds a growth kick by investing in promising mid-sized companies." }, ]
    },
    Growth: {
        description: "You are focused on growing your capital and are willing to take on substantial risk for higher-than-average returns. You have a long-term view and can withstand market downturns.",
        assets: [ { symbol: "JUNIORBEES.NS", name: "Nifty Next 50 ETF", reason: "Higher growth potential than Nifty 50, focusing on the next wave of large caps." }, { symbol: "MON100.NS", name: "Nasdaq 100 ETF", reason: "Exposure to high-growth US technology stocks, offering international diversification." }, { symbol: "QUAN-SMALL", name: "Small-Cap Mutual Fund", reason: "High risk, high return potential by investing in emerging small companies." }, ]
    },
    Aggressive: {
        description: "You are comfortable with high risk and significant market volatility in pursuit of the highest possible returns. You are an experienced investor with a very long-term perspective.",
        assets: [ { symbol: "TATA-DIGITAL", name: "Thematic/Sectoral Fund", reason: "A concentrated bet on the high-growth technology sector for maximum returns." }, { symbol: "RELIANCE.NS", name: "Individual Large-Cap Stock", reason: "Direct exposure to a market leader. Higher risk than a fund." }, { symbol: "Small Cap Stock (e.g., RVNL.NS)", name: "Individual Small-Cap Stock", reason: "Extremely high risk and volatility, but with potential for explosive growth." }, ]
    }
};

function RiskProfile() {
    const [answers, setAnswers] = useState({});
    const [result, setResult] = useState(null);

    const handleAnswerChange = (questionIndex, points) => {
        setAnswers({ ...answers, [questionIndex]: points });
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        if (Object.keys(answers).length < questions.length) {
            alert("Please answer all questions.");
            return;
        }

        const totalScore = Object.values(answers).reduce((sum, points) => sum + points, 0);

        let profile = '';
        if (totalScore <= 28)      profile = 'Conservative';
        else if (totalScore <= 40) profile = 'Moderate';
        else if (totalScore <= 52) profile = 'Growth';
        else                       profile = 'Aggressive';
        
        setResult({ score: totalScore, profile: profile });
    };

    let currentSection = "";

    return (
        <div className="container" style={{ maxWidth: '800px' }}>
            <BackButton />
            <div className="page-header">
                <h1>Investor Risk Profile</h1>
                <p>This comprehensive questionnaire will help you understand your risk tolerance and receive tailored investment suggestions.</p>
            </div>

            {!result ? (
                <form onSubmit={handleSubmit}>
                    {questions.map((q, index) => {
                        const showSectionHeader = q.section && q.section !== currentSection;
                        if (showSectionHeader) currentSection = q.section;
                        return (
                            <React.Fragment key={index}>
                                {showSectionHeader && (
                                    <h2 style={{ marginTop: '3rem', borderBottom: '2px solid var(--brand-primary)', paddingBottom: '0.5rem' }}>
                                        {q.section}
                                    </h2>
                                )}
                                <div style={{ marginBottom: '1.5rem', background: 'var(--bg-dark-primary)', padding: '1.5rem', borderRadius: '8px' }}>
                                    <h3 style={{ marginTop: 0, color: 'var(--text-primary)' }}>{index + 1}. {q.questionText}</h3>
                                    {q.answers.map((answer, ansIndex) => (
                                        <div key={ansIndex} style={{ margin: '0.5rem 0' }}>
                                            <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer', color: 'var(--text-secondary)' }}>
                                                <input
                                                    type="radio"
                                                    name={`question-${index}`}
                                                    required
                                                    onChange={() => handleAnswerChange(index, answer.points)}
                                                    style={{ width: 'auto', marginRight: '1rem', accentColor: 'var(--brand-primary)' }}
                                                />
                                                {answer.answerText}
                                            </label>
                                        </div>
                                    ))}
                                </div>
                            </React.Fragment>
                        );
                    })}
                    <button type="submit" style={{ width: '100%', fontSize: '1.2rem', padding: '1rem' }}>Calculate My Profile</button>
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
                            <Link to={asset.symbol.includes('.') ? `/stock/${asset.symbol}` : `/mutual-funds`} key={asset.symbol} className="recommendation-card" style={{
                                background: 'var(--bg-dark-secondary)', padding: '1rem', borderRadius: '8px', textDecoration: 'none', border: '1px solid var(--border-color)', transition: 'all 0.2s ease'
                            }}>
                                <h4 style={{ margin: 0, color: 'var(--text-primary)' }}>{asset.name} ({asset.symbol})</h4>
                                <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>{asset.reason}</p>
                            </Link>
                        ))}
                    </div>
                    <button onClick={() => { setResult(null); setAnswers({}); }} style={{ marginTop: '2rem' }}>Retake Questionnaire</button>
                </div>
            )}
        </div>
    );
}

export default RiskProfile;