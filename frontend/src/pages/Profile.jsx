import { useState, useEffect, useContext } from 'react';
import { useSearchParams, Link, Navigate } from 'react-router-dom';
import { AuthContext } from '../utils/AuthContext';
import { userApi, imageApi } from '../utils/api';
import { useToast } from '../utils/ToastContext';
import ImageCard from '../components/ImageCard';
import {
  User as UserIcon,
  UploadCloud,
  Images,
  Bookmark,
  Calendar,
  Loader2,
  Trash2,
  AlertCircle
} from 'lucide-react';

export default function Profile() {
  const { user: currentUser, isAuthenticated, loading: authLoading } = useContext(AuthContext);
  const { addToast } = useToast();
  const [searchParams] = useSearchParams();

  const queryUserId = searchParams.get('userId');
  const targetUserId = queryUserId || currentUser?._id || currentUser?.id;

  const [profileUser, setProfileUser] = useState(null);
  const [userImages, setUserImages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [deleteTargetId, setDeleteTargetId] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const isCurrentAuthUser = Boolean(
    currentUser &&
    targetUserId &&
    (targetUserId === currentUser._id || targetUserId === currentUser.id)
  );

  useEffect(() => {
    if (!targetUserId) {
      if (!authLoading && !isAuthenticated) {
        setLoading(false);
      }
      return;
    }

    let isMounted = true;

    Promise.all([
      userApi.getUserProfile(targetUserId),
      userApi.getUserImages(targetUserId)
    ])
      .then(([profileRes, imagesRes]) => {
        if (isMounted) {
          setProfileUser(profileRes.data);
          setUserImages(imagesRes.data || []);
          setLoading(false);
        }
      })
      .catch((err) => {
        if (isMounted) {
          console.error(err);
          setError(err.response?.data?.message || 'Could not load user profile');
          setLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [targetUserId, authLoading, isAuthenticated]);

  if (!authLoading && !isAuthenticated && !queryUserId) {
    return <Navigate to="/login" state={{ from: { pathname: '/profile' } }} replace />;
  }

  const handleDeleteImage = async (imageId) => {
    try {
      setDeleting(true);
      await imageApi.deleteImage(imageId);
      setUserImages((prev) => prev.filter((img) => img._id !== imageId));
      addToast('Image deleted successfully', 'success');
      setDeleteTargetId(null);
    } catch (err) {
      addToast(err.response?.data?.message || 'Failed to delete image', 'error');
    } finally {
      setDeleting(false);
    }
  };

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '80px 0' }}>
        <Loader2 size={36} className="animate-spin" color="#38bdf8" />
        <p style={{ marginTop: '14px', color: '#94a3b8' }}>Loading creator profile...</p>
      </div>
    );
  }

  if (error || !profileUser) {
    return (
      <div className="empty-state">
        <div className="empty-state-icon" style={{ color: '#f43f5e' }}>
          <AlertCircle size={32} />
        </div>
        <h3 className="empty-state-title">User Not Found</h3>
        <p className="empty-state-description">{error || 'Could not find the requested user.'}</p>
        <Link to="/" className="btn-primary">
          Back to Explore
        </Link>
      </div>
    );
  }

  const avatar =
    profileUser.avatarUrl ||
    `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(profileUser.name || 'user')}`;

  return (
    <div className="profile-page">
      {/* Creator Profile Banner */}
      <div
        style={{
          background: '#14171f',
          borderRadius: '24px',
          padding: '40px',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          marginBottom: '36px'
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '24px'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '24px', flexWrap: 'wrap' }}>
            <img
              src={avatar}
              alt={profileUser.name}
              style={{
                width: '96px',
                height: '96px',
                borderRadius: '50%',
                objectFit: 'cover',
                border: '3px solid #38bdf8',
                boxShadow: '0 8px 24px rgba(56, 189, 248, 0.25)'
              }}
            />

            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
                <h1 style={{ fontSize: '1.8rem', fontWeight: 800, color: '#f8fafc' }}>
                  {profileUser.name}
                </h1>
                {isCurrentAuthUser && (
                  <span
                    style={{
                      background: 'rgba(56, 189, 248, 0.15)',
                      color: '#38bdf8',
                      fontSize: '0.75rem',
                      fontWeight: 700,
                      padding: '2px 8px',
                      borderRadius: '8px'
                    }}
                  >
                    You
                  </span>
                )}
              </div>

              <p style={{ color: '#94a3b8', fontSize: '0.92rem', marginBottom: '10px' }}>
                {profileUser.email}
              </p>

              {profileUser.bio ? (
                <p style={{ color: '#cbd5e1', fontSize: '0.95rem', maxWidth: '560px', lineHeight: 1.5 }}>
                  {profileUser.bio}
                </p>
              ) : (
                <p style={{ color: '#64748b', fontSize: '0.85rem', fontStyle: 'italic' }}>
                  Visual artist on Pixora.
                </p>
              )}
            </div>
          </div>

          {/* Action Button */}
          {isCurrentAuthUser && (
            <Link to="/upload" className="btn-primary">
              <UploadCloud size={16} />
              <span>Upload New Photo</span>
            </Link>
          )}
        </div>

        {/* Stats Row */}
        <div
          style={{
            display: 'flex',
            gap: '32px',
            marginTop: '28px',
            paddingTop: '24px',
            borderTop: '1px solid rgba(255, 255, 255, 0.08)',
            flexWrap: 'wrap'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Images size={18} color="#38bdf8" />
            <div>
              <div style={{ fontSize: '1.1rem', fontWeight: 700, color: '#f8fafc' }}>
                {userImages.length}
              </div>
              <div style={{ fontSize: '0.78rem', color: '#94a3b8' }}>Photographs</div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Bookmark size={18} color="#38bdf8" />
            <div>
              <div style={{ fontSize: '1.1rem', fontWeight: 700, color: '#f8fafc' }}>
                {profileUser.collectionsCount || 0}
              </div>
              <div style={{ fontSize: '0.78rem', color: '#94a3b8' }}>Collections</div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Calendar size={18} color="#94a3b8" />
            <div>
              <div style={{ fontSize: '0.9rem', fontWeight: 600, color: '#f8fafc' }}>
                {new Date(profileUser.createdAt || Date.now()).toLocaleDateString(undefined, {
                  month: 'short',
                  year: 'numeric'
                })}
              </div>
              <div style={{ fontSize: '0.78rem', color: '#94a3b8' }}>Member Since</div>
            </div>
          </div>
        </div>
      </div>

      {/* Uploaded Photos Gallery */}
      <div style={{ marginBottom: '24px' }}>
        <h2 style={{ fontSize: '1.4rem', fontWeight: 700, color: '#f8fafc', marginBottom: '16px' }}>
          {isCurrentAuthUser ? 'My Uploaded Photographs' : `Photographs by ${profileUser.name}`}
        </h2>

        {userImages.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">
              <UserIcon size={32} />
            </div>
            <h3 className="empty-state-title">No photographs published yet</h3>
            <p className="empty-state-description">
              {isCurrentAuthUser
                ? 'Share your first high-resolution photograph to build your portfolio.'
                : 'This creator has not uploaded any public photographs yet.'}
            </p>
            {isCurrentAuthUser && (
              <Link to="/upload" className="btn-primary">
                <UploadCloud size={16} />
                <span>Upload a Photo</span>
              </Link>
            )}
          </div>
        ) : (
          <div className="masonry-grid">
            {userImages.map((img) => (
              <div key={img._id} style={{ position: 'relative' }}>
                <ImageCard image={img} />
                {isCurrentAuthUser && (
                  <button
                    type="button"
                    onClick={() => setDeleteTargetId(img._id)}
                    style={{
                      position: 'absolute',
                      top: '12px',
                      left: '12px',
                      zIndex: 10,
                      background: 'rgba(12, 14, 18, 0.85)',
                      color: '#fda4af',
                      border: '1px solid rgba(244, 63, 94, 0.3)',
                      borderRadius: '50%',
                      width: '32px',
                      height: '32px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: 'pointer'
                    }}
                    title="Delete your photo"
                  >
                    <Trash2 size={16} />
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {deleteTargetId && (
        <div className="modal-backdrop" onClick={() => setDeleteTargetId(null)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <h3 className="modal-title" style={{ color: '#fda4af', marginBottom: '12px' }}>
              Delete This Photograph?
            </h3>
            <p style={{ color: '#94a3b8', fontSize: '0.92rem', marginBottom: '24px' }}>
              Are you sure you want to permanently delete this photo? It will be removed from Cloudinary and any collections.
            </p>
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
              <button
                type="button"
                className="btn-secondary"
                onClick={() => setDeleteTargetId(null)}
                disabled={deleting}
              >
                Cancel
              </button>
              <button
                type="button"
                className="btn-danger"
                onClick={() => handleDeleteImage(deleteTargetId)}
                disabled={deleting}
              >
                {deleting ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
