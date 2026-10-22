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

    return (
        <nav className="navbar">
            <div className="navbar-container">
                <Link to="/" className="navbar-logo">
                    <span className="logo-icon">🏛️</span>
                    PulseCity
                </Link>

                <div className="navbar-links">
                    <Link
                        to="/"
                        className={location.pathname === '/' ? 'active' : ''}
                    >
                        📋 List View
                    </Link>
                    <Link
                        to="/map"
                        className={location.pathname === '/map' ? 'active' : ''}
                    >
                        🗺️ Map View
                    </Link>
                    <Link
                        to="/report"
                        className={location.pathname === '/report' ? 'active' : ''}
                    >
                        ➕ Report Issue
                    </Link>
                </div>

                <div className="navbar-user">
                    <span className="user-role">
                        {user.role === 'admin' ? ' Admin' : '👤 User'}
                    </span>
                    <button onClick={handleLogout} className="logout-btn">
                        Logout
                    </button>
                </div>
            </div>
        </nav>
    );
};

export default Navbar;
