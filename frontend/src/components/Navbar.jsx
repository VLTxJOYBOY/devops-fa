import { useState, useContext } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { AuthContext } from '../utils/AuthContext';
import { Camera, Search, UploadCloud, Heart, Bookmark, User, LogOut, Menu, X } from 'lucide-react';

export default function Navbar() {
  const { user, isAuthenticated, logout } = useContext(AuthContext);
  const navigate = useNavigate();
  const location = useLocation();
  const [searchQuery, setSearchQuery] = useState('');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/?q=${encodeURIComponent(searchQuery.trim())}`);
    } else {
      navigate('/');
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <header className="navbar">
      <div className="navbar-container">
        {/* Brand */}
        <Link to="/" className="nav-brand" onClick={() => setSearchQuery('')}>
          <div className="brand-icon-wrapper">
            <Camera size={20} strokeWidth={2.5} />
          </div>
          <span>Pixora</span>
        </Link>

        {/* Search Bar */}
        <form className="nav-search-bar" onSubmit={handleSearchSubmit}>
          <div className="nav-search-input-wrapper">
            <Search size={18} color="#94a3b8" />
            <input
              type="text"
              placeholder="Search high-res photography, styles, tags..."
              className="nav-search-input"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </form>

        {/* Desktop Navigation Links */}
        <nav className="nav-links" style={{ display: 'flex' }}>
          <Link
            to="/"
            className={`nav-link ${location.pathname === '/' ? 'active' : ''}`}
          >
            Explore
          </Link>

          {isAuthenticated ? (
            <>
              <Link
                to="/favorites"
                className={`nav-link ${location.pathname === '/favorites' ? 'active' : ''}`}
                title="Saved Favorites"
              >
                <Heart size={16} />
                <span>Favorites</span>
              </Link>
              <Link
                to="/collections"
                className={`nav-link ${location.pathname.startsWith('/collections') ? 'active' : ''}`}
                title="Personal Collections"
              >
                <Bookmark size={16} />
                <span>Collections</span>
              </Link>
              <Link to="/upload" className="nav-btn-upload">
                <UploadCloud size={16} />
                <span>Submit Photo</span>
              </Link>
              <Link
                to="/profile"
                className="nav-avatar-btn"
                title={`${user?.name} - Profile`}
              >
                <img
                  src={
                    user?.avatarUrl ||
                    `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(user?.name || 'user')}`
                  }
                  alt={user?.name || 'Avatar'}
                  className="nav-avatar-img"
                />
                <span className="nav-avatar-name">{user?.name?.split(' ')[0] || 'Profile'}</span>
              </Link>
              <button
                type="button"
                onClick={handleLogout}
                className="nav-link"
                title="Log Out"
                style={{ padding: '8px' }}
              >
                <LogOut size={16} />
              </button>
            </>
          ) : (
            <>
              <Link
                to="/login"
                className={`nav-link ${location.pathname === '/login' ? 'active' : ''}`}
              >
                <User size={16} />
                <span>Log In</span>
              </Link>
              <Link to="/register" className="nav-btn-upload">
                <span>Join Free</span>
              </Link>
            </>
          )}
        </nav>

        {/* Mobile menu trigger button */}
        <button
          type="button"
          className="mobile-menu-btn"
          style={{ display: 'none', color: '#f8fafc' }}
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        >
          {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>
    </header>
  );
}
