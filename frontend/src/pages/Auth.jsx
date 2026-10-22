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
                setError('Registration successful! Please sign in with your credentials.');
                setPassword('');
            }
        } catch (err) {
            setError(err.response?.data?.message || 'Authentication failed. Please verify credentials.');
        } finally {
            setLoading(false);
        }
    };

    // Quick demo login helper
    const fillDemoUser = (user, pass) => {
        setUsername(user);
        setPassword(pass);
        setError('');
    };

    return (
        <div className="auth-page">
            <div className="auth-backdrop-glow"></div>
            <div className="auth-wrapper">
                {/* Left Hero Overview */}
                <div className="auth-hero-panel">
                    <div className="auth-hero-badge">
                        <span className="hero-pulse-dot"></span>
                        <span>MUNICIPAL SRE & PUBLIC OPS V2.4</span>
                    </div>

                    <h1 className="auth-hero-title">
                        PulseCity <span className="title-gradient">Command</span>
                    </h1>

                    <p className="auth-hero-desc">
                        Empowering citizens and municipal representatives with live telemetry,
                        automated routing, and transparent civic resolution workflows.
                    </p>

                    <div className="hero-feature-cards">
                        <div className="feature-item">
                            <div className="feature-icon-box">⚡</div>
                            <div className="feature-item-text">
                                <h4>Instant Incident Telemetry</h4>
                                <p>Report potholes, streetlights, and sanitation with live tracking</p>
                            </div>
                        </div>

                        <div className="feature-item">
                            <div className="feature-icon-box">🗺️</div>
                            <div className="feature-item-text">
                                <h4>Interactive Geospatial Map</h4>
                                <p>Real-time neighborhood status pins across municipal zones</p>
                            </div>
                        </div>

                        <div className="feature-item">
                            <div className="feature-icon-box">🛡️</div>
                            <div className="feature-item-text">
                                <h4>Verifiable Resolution Proof</h4>
                                <p>Officials attach photographic confirmation to close citizen tickets</p>
                            </div>
                        </div>
                    </div>

                    <div className="demo-accounts-box">
                        <span className="demo-title">⚡ Quick Access Presets:</span>
                        <div className="demo-buttons-row">
                            <button
                                type="button"
                                className="btn-demo-preset"
                                onClick={() => fillDemoUser('corporator_ward10', 'password123')}
                            >
                                🏛️ Ward Corporator
                            </button>
                            <button
                                type="button"
                                className="btn-demo-preset"
                                onClick={() => fillDemoUser('mla_city', 'password123')}
                            >
                                🎖️ MLA City
                            </button>
                            <button
                                type="button"
                                className="btn-demo-preset"
                                onClick={() => fillDemoUser('citizen_demo', 'password123')}
                            >
                                👤 Citizen Demo
                            </button>
                        </div>
                    </div>
                </div>

                {/* Right Form Card */}
                <div className="auth-card-panel">
                    <div className="auth-card-glass">
                        <div className="auth-card-header">
                            <div className="auth-logo-badge">⚡</div>
                            <h2>{isLogin ? 'Access Console' : 'Register Account'}</h2>
                            <p>{isLogin ? 'Sign in to access your municipal portal' : 'Join your local civic community network'}</p>
                        </div>

                        <div className="auth-segmented-switch">
                            <button
                                type="button"
                                className={`switch-pill ${isLogin ? 'active' : ''}`}
                                onClick={() => { setIsLogin(true); setError(''); }}
                            >
                                Sign In
                            </button>
                            <button
                                type="button"
                                className={`switch-pill ${!isLogin ? 'active' : ''}`}
                                onClick={() => { setIsLogin(false); setError(''); }}
                            >
                                Register
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="auth-form-fields">
                            <div className="field-group">
                                <label className="field-label">Username</label>
                                <div className="input-with-icon">
                                    <span className="input-icon">👤</span>
                                    <input
                                        type="text"
                                        value={username}
                                        onChange={(e) => setUsername(e.target.value)}
                                        required
                                        placeholder="Enter your username"
                                        className="text-input"
                                        autoComplete="username"
                                    />
                                </div>
                            </div>

                            <div className="field-group">
                                <label className="field-label">Password</label>
                                <div className="input-with-icon">
                                    <span className="input-icon">🔒</span>
                                    <input
                                        type="password"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        required
                                        placeholder="••••••••••••"
                                        className="text-input"
                                        autoComplete="current-password"
                                    />
                                </div>
                            </div>

                            {error && (
                                <div className={`status-banner ${error.includes('successful') ? 'success' : 'error'}`}>
                                    <span className="banner-icon">{error.includes('successful') ? '✓' : '⚠️'}</span>
                                    <span>{error}</span>
                                </div>
                            )}

                            <button type="submit" className="btn-primary-action" disabled={loading}>
                                {loading ? (
                                    <span className="btn-loader">Authenticating...</span>
                                ) : (
                                    <span>{isLogin ? 'Enter PulseCity Portal ➔' : 'Create Account ➔'}</span>
                                )}
                            </button>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Auth;
