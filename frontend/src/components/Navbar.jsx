import { useContext } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { AuthContext } from '../utils/AuthContext';
import './Navbar.css';

const Navbar = () => {
    const { user, logoutUser } = useContext(AuthContext);
    const navigate = useNavigate();
    const location = useLocation();

    const handleLogout = () => {
        logoutUser();
        navigate('/auth');
    };

    if (!user) return null;

    const userInitial = user.username ? user.username.charAt(0).toUpperCase() : 'U';

    return (
        <header className="navbar-wrapper">
            <nav className="navbar-dock">
                <Link to="/" className="navbar-brand">
                    <div className="brand-icon-box">
                        <span className="brand-bolt">⚡</span>
                    </div>
                    <div className="brand-text-group">
                        <span className="brand-title">PulseCity</span>
                        <span className="brand-sub"><span className="live-dot"></span>CIVIC INTELLIGENCE</span>
                    </div>
                </Link>

                <div className="navbar-nav-links">
                    <Link
                        to="/"
                        className={`nav-pill ${location.pathname === '/' ? 'active' : ''}`}
                    >
                        <span className="nav-icon">📊</span>
                        <span className="nav-label">Live Feed</span>
                    </Link>
                    <Link
                        to="/map"
                        className={`nav-pill ${location.pathname === '/map' ? 'active' : ''}`}
                    >
                        <span className="nav-icon">🗺️</span>
                        <span className="nav-label">Geo Radar</span>
                    </Link>
                    <Link
                        to="/report"
                        className={`nav-pill highlight ${location.pathname === '/report' ? 'active' : ''}`}
                    >
                        <span className="nav-icon">⚡</span>
                        <span className="nav-label">Report Issue</span>
                    </Link>
                </div>

                <div className="navbar-profile-section">
                    <div className="profile-badge">
                        <div className="avatar-disc">{userInitial}</div>
                        <div className="user-details">
                            <span className="username-text">{user.username || 'Citizen'}</span>
                            <span className={`role-tag ${user.role === 'representative' ? 'rep' : 'citizen'}`}>
                                {user.role === 'representative' ? 'Official' : 'Citizen'}
                            </span>
                        </div>
                    </div>
                    <button onClick={handleLogout} className="btn-logout" title="Sign out">
                        <span className="logout-icon">⏻</span>
                        <span className="logout-text">Exit</span>
                    </button>
                </div>
            </nav>
        </header>
    );
};

export default Navbar;
