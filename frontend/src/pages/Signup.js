import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';

function Signup() {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { signup } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await signup(username, email, password);
      navigate('/dashboard'); // Redirect to dashboard on success
    } catch (err) {
      setError(err.message || 'Failed to sign up. Please try again.');
    }
    setLoading(false);
  };

  return (
    <div className="container" style={{ maxWidth: '500px', marginTop: '5rem' }}>
      <h1 style={{ textAlign: 'center' }}>Create Account</h1>
      <p style={{ textAlign: 'center', color: 'var(--text-secondary)' }}>
        Start your simulated investment journey.
      </p>

      {error && <p style={{ color: 'var(--danger)', textAlign: 'center' }}>{error}</p>}

      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="username">Username</label>
          <input
            type="text"
            id="username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
          />
        </div>
        <div className="form-group">
          <label htmlFor="email">Email</label>
          <input
            type="email"
            id="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>
        <div className="form-group">
          <label htmlFor="password">Password</label>
          <input
            type="password"
            id="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={6}
          />
        </div>
        <button type="submit" disabled={loading} style={{ width: '100%' }}>
          {loading ? 'Creating Account...' : 'Sign Up'}
        </button>
      </form>
      <p style={{ textAlign: 'center', marginTop: '1.5rem', color: 'var(--text-secondary)' }}>
        Already have an account? <Link to="/login">Log In</Link>
      </p>
    </div>
  );
}

export default Signup;