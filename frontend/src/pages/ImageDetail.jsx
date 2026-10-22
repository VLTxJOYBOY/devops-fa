import { useState, useEffect, useContext } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { imageApi, favoriteApi } from '../utils/api';
import { AuthContext } from '../utils/AuthContext';
import { useToast } from '../utils/ToastContext';
import AddToCollectionModal from '../components/AddToCollectionModal';
import {
  ArrowLeft,
  Heart,
  Bookmark,
  Trash2,
  Eye,
  Calendar,
  Tag,
  ExternalLink,
  Loader2,
  AlertCircle
} from 'lucide-react';

export default function ImageDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, isAuthenticated } = useContext(AuthContext);
  const { addToast } = useToast();

  const [image, setImage] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isFavorited, setIsFavorited] = useState(false);
  const [favoritesCount, setFavoritesCount] = useState(0);
  const [collectionModalOpen, setCollectionModalOpen] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    let isMounted = true;

    imageApi.getImageById(id)
      .then((res) => {
        if (isMounted) {
          setImage(res.data);
          setIsFavorited(Boolean(res.data.isFavorited));
          setFavoritesCount(res.data.favoritesCount || 0);
          setLoading(false);
        }
      })
      .catch((err) => {
        if (isMounted) {
          console.error(err);
          setError(err.response?.data?.message || 'Failed to load image details');
          setLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [id]);

  const handleFavoriteToggle = async () => {
    if (!isAuthenticated) {
      addToast('Please sign in to favorite images', 'info');
      navigate('/login');
      return;
    }

    try {
      if (isFavorited) {
        setIsFavorited(false);
        setFavoritesCount((prev) => Math.max(0, prev - 1));
        await favoriteApi.removeFavorite(image._id);
        addToast('Removed from favorites', 'info');
      } else {
        setIsFavorited(true);
        setFavoritesCount((prev) => prev + 1);
        await favoriteApi.addFavorite(image._id);
        addToast('Added to favorites!', 'success');
      }
    } catch (_err) {
      setIsFavorited((prev) => !prev);
      addToast('Could not update favorite', 'error');
    }
  };

  const handleDeleteImage = async () => {
    try {
      setDeleting(true);
      await imageApi.deleteImage(image._id);
      addToast('Image deleted successfully', 'success');
      navigate('/');
    } catch (err) {
      addToast(err.response?.data?.message || 'Failed to delete image', 'error');
      setDeleting(false);
    }
  };

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '100px 0' }}>
        <Loader2 size={36} className="animate-spin" color="#38bdf8" />
        <p style={{ marginTop: '16px', color: '#94a3b8' }}>Loading image details...</p>
      </div>
    );
  }

  if (error || !image) {
    return (
      <div className="empty-state" style={{ padding: '80px 20px' }}>
        <div className="empty-state-icon" style={{ color: '#f43f5e' }}>
          <AlertCircle size={32} />
        </div>
        <h3 className="empty-state-title">Image Not Found</h3>
        <p className="empty-state-description">
          {error || 'The requested image could not be located or may have been deleted.'}
        </p>
        <Link to="/" className="btn-primary">
          <ArrowLeft size={16} />
          <span>Return to Explore</span>
        </Link>
      </div>
    );
  }

  // Determine if current user is owner
  const isOwner = Boolean(
    isAuthenticated &&
    user &&
    image.uploader &&
    (image.uploader._id === user._id || image.uploader._id === user.id || image.uploader === user.id)
  );

  const uploaderName = image.uploader?.name || 'Photographer';
  const uploaderAvatar =
    image.uploader?.avatarUrl ||
    `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(uploaderName)}`;

  return (
    <div className="image-detail-page" style={{ maxWidth: '1180px', margin: '0 auto' }}>
      {/* Top back navigation & quick action toolbar */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '24px'
        }}
      >
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="btn-secondary"
          style={{ padding: '8px 16px' }}
        >
          <ArrowLeft size={16} />
          <span>Back</span>
        </button>

        <div style={{ display: 'flex', gap: '10px' }}>
          <button
            type="button"
            className={isFavorited ? 'btn-danger' : 'btn-secondary'}
            onClick={handleFavoriteToggle}
            title={isFavorited ? 'Remove Favorite' : 'Save to Favorites'}
          >
            <Heart size={16} fill={isFavorited ? 'currentColor' : 'none'} />
            <span>{isFavorited ? 'Saved' : 'Favorite'} ({favoritesCount})</span>
          </button>

          <button
            type="button"
            className="btn-secondary"
            onClick={() => {
              if (!isAuthenticated) {
                addToast('Please sign in to save to collection', 'info');
                navigate('/login');
                return;
              }
              setCollectionModalOpen(true);
            }}
          >
            <Bookmark size={16} />
            <span>Add to Collection</span>
          </button>

          {isOwner && (
            <button
              type="button"
              className="btn-danger"
              onClick={() => setDeleteConfirmOpen(true)}
              title="Delete this photo"
            >
              <Trash2 size={16} />
              <span>Delete Photo</span>
            </button>
          )}
        </div>
      </div>

      {/* Main Image Viewport */}
      <div
        style={{
          background: '#07090c',
          borderRadius: '20px',
          overflow: 'hidden',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          boxShadow: '0 20px 50px rgba(0, 0, 0, 0.7)',
          textAlign: 'center',
          marginBottom: '32px'
        }}
      >
        <img
          src={image.imageUrl}
          alt={image.title}
          style={{
            maxWidth: '100%',
            maxHeight: '78vh',
            objectFit: 'contain',
            display: 'inline-block'
          }}
        />
      </div>

      {/* Meta Information Grid */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '2fr 1fr',
          gap: '32px',
          alignItems: 'start'
        }}
      >
        {/* Left Column: Title, Description, Tags */}
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
            <span className="card-category-badge">{image.category}</span>
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px',
                fontSize: '0.82rem',
                color: '#94a3b8'
              }}
            >
              <Eye size={14} />
              <span>{image.views || 0} views</span>
            </span>
          </div>

          <h1
            style={{
              fontSize: '2.2rem',
              fontWeight: 800,
              letterSpacing: '-0.03em',
              color: '#f8fafc',
              marginBottom: '16px'
            }}
          >
            {image.title}
          </h1>

          {image.description && (
            <p
              style={{
                fontSize: '1.05rem',
                color: '#cbd5e1',
                lineHeight: 1.7,
                marginBottom: '28px'
              }}
            >
              {image.description}
            </p>
          )}

          {/* Tags */}
          {image.tags && image.tags.length > 0 && (
            <div style={{ marginTop: '24px' }}>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  fontSize: '0.82rem',
                  fontWeight: 600,
                  color: '#94a3b8',
                  marginBottom: '10px'
                }}
              >
                <Tag size={14} />
                <span>Tags &amp; Aesthetics</span>
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                {image.tags.map((tag, idx) => (
                  <Link
                    key={idx}
                    to={`/?q=${encodeURIComponent(tag)}`}
                    style={{
                      background: '#1d212c',
                      color: '#cbd5e1',
                      fontSize: '0.85rem',
                      padding: '5px 12px',
                      borderRadius: '8px',
                      border: '1px solid rgba(255,255,255,0.06)',
                      transition: 'border-color 0.15s ease'
                    }}
                  >
                    #{tag}
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right Column: Photographer Card & Specs */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Creator Profile Box */}
          <div
            style={{
              background: '#14171f',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              borderRadius: '16px',
              padding: '24px'
            }}
          >
            <div style={{ fontSize: '0.8rem', fontWeight: 600, color: '#64748b', marginBottom: '14px' }}>
              PHOTOGRAPHER
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '16px' }}>
              <img
                src={uploaderAvatar}
                alt={uploaderName}
                style={{ width: '52px', height: '52px', borderRadius: '50%', objectFit: 'cover' }}
              />
              <div>
                <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: '#f8fafc' }}>
                  {uploaderName}
                </h3>
                <p style={{ fontSize: '0.82rem', color: '#94a3b8' }}>
                  {image.uploader?.email || 'Verified Creator'}
                </p>
              </div>
            </div>

            {image.uploader?.bio && (
              <p style={{ fontSize: '0.86rem', color: '#94a3b8', fontStyle: 'italic', marginBottom: '16px' }}>
                &ldquo;{image.uploader.bio}&rdquo;
              </p>
            )}

            {image.uploader?._id && (
              <Link
                to={`/profile?userId=${image.uploader._id}`}
                className="btn-secondary"
                style={{ width: '100%', justifyContent: 'center', fontSize: '0.85rem' }}
              >
                <span>View Creator Profile</span>
                <ExternalLink size={14} />
              </Link>
            )}
          </div>

          {/* Image Technical Details */}
          <div
            style={{
              background: '#14171f',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              borderRadius: '16px',
              padding: '24px',
              fontSize: '0.86rem',
              color: '#94a3b8'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
              <Calendar size={15} color="#38bdf8" />
              <span>Published on {new Date(image.createdAt).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })}</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <ExternalLink size={15} color="#38bdf8" />
              <a
                href={image.imageUrl}
                target="_blank"
                rel="noreferrer"
                style={{ color: '#38bdf8', textDecoration: 'underline' }}
              >
                Open Original High-Res Media
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* Add To Collection Modal */}
      <AddToCollectionModal
        image={image}
        isOpen={collectionModalOpen}
        onClose={() => setCollectionModalOpen(false)}
      />

      {/* Owner Delete Confirmation Modal */}
      {deleteConfirmOpen && (
        <div className="modal-backdrop" onClick={() => setDeleteConfirmOpen(false)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <h3 className="modal-title" style={{ color: '#fda4af', marginBottom: '12px' }}>
              Confirm Photo Deletion
            </h3>
            <p style={{ color: '#94a3b8', fontSize: '0.92rem', marginBottom: '24px' }}>
              Are you sure you want to permanently delete &ldquo;{image.title}&rdquo;? This will remove the image asset from Cloudinary and clean up any saved collections.
            </p>
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
              <button
                type="button"
                className="btn-secondary"
                onClick={() => setDeleteConfirmOpen(false)}
                disabled={deleting}
              >
                Cancel
              </button>
              <button
                type="button"
                className="btn-danger"
                onClick={handleDeleteImage}
                disabled={deleting}
              >
                {deleting ? 'Deleting...' : 'Delete Permanently'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
