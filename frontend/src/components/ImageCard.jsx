import { useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../utils/AuthContext';
import { useToast } from '../utils/ToastContext';
import { favoriteApi } from '../utils/api';
import AddToCollectionModal from './AddToCollectionModal';
import { Heart, Bookmark } from 'lucide-react';

export default function ImageCard({ image, onFavoriteToggle }) {
  const navigate = useNavigate();
  const { isAuthenticated } = useContext(AuthContext);
  const { addToast } = useToast();

  const [isFavorited, setIsFavorited] = useState(Boolean(image.isFavorited));
  const [favoritesCount, setFavoritesCount] = useState(image.favoritesCount || 0);
  const [modalOpen, setModalOpen] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  const handleCardClick = () => {
    navigate(`/image/${image._id}`);
  };

  const handleFavoriteClick = async (e) => {
    e.stopPropagation();
    if (!isAuthenticated) {
      addToast('Please log in to save favorites', 'info');
      navigate('/login');
      return;
    }

    try {
      if (isFavorited) {
        setIsFavorited(false);
        setFavoritesCount((prev) => Math.max(0, prev - 1));
        await favoriteApi.removeFavorite(image._id);
        addToast('Removed from favorites', 'info');
        if (onFavoriteToggle) onFavoriteToggle(image._id, false);
      } else {
        setIsFavorited(true);
        setFavoritesCount((prev) => prev + 1);
        await favoriteApi.addFavorite(image._id);
        addToast('Added to favorites!', 'success');
        if (onFavoriteToggle) onFavoriteToggle(image._id, true);
      }
    } catch (_err) {
      // Revert on error
      setIsFavorited((prev) => !prev);
      addToast('Failed to update favorite', 'error');
    }
  };

  const handleBookmarkClick = (e) => {
    e.stopPropagation();
    if (!isAuthenticated) {
      addToast('Please log in to add to collection', 'info');
      navigate('/login');
      return;
    }
    setModalOpen(true);
  };

  const uploaderName = image.uploader?.name || 'Photographer';
  const uploaderAvatar =
    image.uploader?.avatarUrl ||
    `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(uploaderName)}`;

  return (
    <>
      <div
        className="masonry-item"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <div className="image-card" onClick={handleCardClick}>
          <div className="image-card-img-wrapper">
            <img
              src={image.imageUrl}
              alt={image.title}
              className="image-card-img"
              loading="lazy"
            />

            {/* Hover overlay with actions & creator info */}
            <div className="image-card-overlay">
              <div className="card-top-bar">
                <span className="card-category-badge">{image.category}</span>
                <div className="card-actions">
                  <button
                    type="button"
                    className={`card-action-btn ${isFavorited ? 'active-favorite' : ''}`}
                    onClick={handleFavoriteClick}
                    title={isFavorited ? 'Remove Favorite' : 'Add to Favorites'}
                  >
                    <Heart size={16} fill={isFavorited ? 'currentColor' : 'none'} />
                  </button>
                  <button
                    type="button"
                    className="card-action-btn"
                    onClick={handleBookmarkClick}
                    title="Add to Collection"
                  >
                    <Bookmark size={16} />
                  </button>
                </div>
              </div>

              <div className="card-bottom-bar">
                <div
                  className="card-photographer"
                  onClick={(e) => {
                    e.stopPropagation();
                    if (image.uploader?._id) {
                      navigate(`/profile?userId=${image.uploader._id}`);
                    }
                  }}
                >
                  <img
                    src={uploaderAvatar}
                    alt={uploaderName}
                    className="card-photographer-avatar"
                  />
                  <span className="card-photographer-name">{uploaderName}</span>
                </div>

                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    fontSize: '0.78rem',
                    color: 'rgba(255,255,255,0.85)',
                    background: 'rgba(0,0,0,0.5)',
                    padding: '2px 8px',
                    borderRadius: '12px'
                  }}
                >
                  <Heart size={12} fill="#f43f5e" color="#f43f5e" />
                  <span>{favoritesCount}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="card-title-footer">
            <h4 className="card-title-text">{image.title}</h4>
            {image.tags && image.tags.length > 0 && isHovered && (
              <div style={{ display: 'flex', gap: '4px', marginTop: '6px', overflow: 'hidden' }}>
                {image.tags.slice(0, 3).map((tag, idx) => (
                  <span
                    key={idx}
                    style={{
                      fontSize: '0.7rem',
                      color: '#94a3b8',
                      background: '#1d212c',
                      padding: '2px 6px',
                      borderRadius: '4px',
                      whiteSpace: 'nowrap'
                    }}
                  >
                    #{tag}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      <AddToCollectionModal
        image={image}
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
      />
    </>
  );
}
