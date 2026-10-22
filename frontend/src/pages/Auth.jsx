import { useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { login, register } from '../utils/api';
import { AuthContext } from '../utils/AuthContext';
import './Auth.css';

const Auth = () => {
    const [isLogin, setIsLogin] = useState(true);
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const { loginUser } = useContext(AuthContext);
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            if (isLogin) {
                const { data } = await login(username, password);
                loginUser(data.token, data.role, data.userId);
                navigate('/');
            } else {
                await register(username, password);
                setIsLogin(true);
                setError('Registration successful! Please login.');
                setPassword('');
            }
        } catch (err) {
            setError(err.response?.data?.message || 'An error occurred');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="auth-container">
            <div className="auth-card">
                <div className="auth-header">
                    <h1>🏛️ PulseCity</h1>
                    <p>Report and track civic issues in your community</p>
                </div>

                <div className="auth-tabs">
                    <button
                        className={isLogin ? 'active' : ''}
                        onClick={() => { setIsLogin(true); setError(''); }}
                    >
                        Login
                    </button>
                    <button
                        className={!isLogin ? 'active' : ''}
                        onClick={() => { setIsLogin(false); setError(''); }}
                    >
                        Register
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="auth-form">
                    <div className="form-group">
                        <label>Username</label>
                        <input
                            type="text"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            required
                            placeholder="Enter your username"
                        />
                    </div>

                    <div className="form-group">
                        <label>Password</label>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            placeholder="Enter your password"
                        />
                    </div>

                    {error && (
                        <div className={`error-message ${error.includes('successful') ? 'success' : ''}`}>
                            {error}
                        </div>
                    )}

                    <button type="submit" className="submit-btn" disabled={loading}>
                        {loading ? 'Please wait...' : (isLogin ? 'Login' : 'Register')}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default Auth;
