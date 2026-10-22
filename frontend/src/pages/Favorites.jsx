import { useState, useEffect, useContext } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { AuthContext } from '../utils/AuthContext';
import { favoriteApi } from '../utils/api';
import ImageCard from '../components/ImageCard';
import { Heart, Compass, Loader2 } from 'lucide-react';

export default function Favorites() {
  const { isAuthenticated, loading: authLoading } = useContext(AuthContext);
  const [favorites, setFavorites] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isAuthenticated) return;

    let isMounted = true;

    favoriteApi.getFavorites()
      .then((res) => {
        if (isMounted) {
          // res.data has array of { _id, image, createdAt }
          const validImages = res.data.map((fav) => fav.image).filter(Boolean);
          setFavorites(validImages);
          setLoading(false);
        }
      })
      .catch((err) => {
        if (isMounted) {
          console.error(err);
          setLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [isAuthenticated]);

  if (!authLoading && !isAuthenticated) {
    return <Navigate to="/login" state={{ from: { pathname: '/favorites' } }} replace />;
  }

  const handleFavoriteToggle = (imageId, isNowFavorited) => {
    if (!isNowFavorited) {
      // Remove from list immediately
      setFavorites((prev) => prev.filter((img) => img._id !== imageId));
    }
  };

  return (
    <div className="favorites-page">
      <div style={{ marginBottom: '32px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
          <div
            style={{
              width: '40px',
              height: '40px',
              borderRadius: '10px',
              background: 'rgba(244, 63, 94, 0.15)',
              color: '#f43f5e',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <Heart size={22} fill="currentColor" />
          </div>
          <h1 style={{ fontSize: '2rem', fontWeight: 800, letterSpacing: '-0.03em', color: '#f8fafc' }}>
            Saved Favorites
          </h1>
        </div>
        <p style={{ color: '#94a3b8', fontSize: '0.95rem' }}>
          Your personal gallery of curated photographs and visual inspirations.
        </p>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '60px 0' }}>
          <Loader2 size={32} className="animate-spin" color="#38bdf8" />
          <p style={{ marginTop: '12px', color: '#94a3b8' }}>Loading your favorites...</p>
        </div>
      ) : favorites.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon" style={{ color: '#f43f5e' }}>
            <Heart size={32} />
          </div>
          <h3 className="empty-state-title">No saved favorites yet</h3>
          <p className="empty-state-description">
            Explore the latest high-resolution photography and click the heart icon on any photo to save it here.
          </p>
          <Link to="/" className="btn-primary">
            <Compass size={16} />
            <span>Discover Photographs</span>
          </Link>
        </div>
      ) : (
        <div className="masonry-grid">
          {favorites.map((img) => (
            <ImageCard
              key={img._id}
              image={img}
              onFavoriteToggle={handleFavoriteToggle}
            />
          ))}
        </div>
      )}
    </div>
  );
}
