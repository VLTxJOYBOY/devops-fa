import { useState, useEffect, useContext } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { collectionApi } from '../utils/api';
import { AuthContext } from '../utils/AuthContext';
import { useToast } from '../utils/ToastContext';
import ImageCard from '../components/ImageCard';
import {
  ArrowLeft,
  Edit2,
  Trash2,
  Images,
  FolderOpen,
  Loader2,
  X,
  Compass
} from 'lucide-react';

export default function CollectionDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, isAuthenticated } = useContext(AuthContext);
  const { addToast } = useToast();

  const [collection, setCollection] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [editName, setEditName] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    let isMounted = true;

    collectionApi.getCollectionById(id)
      .then((res) => {
        if (isMounted) {
          setCollection(res.data);
          setEditName(res.data.name || '');
          setEditDescription(res.data.description || '');
          setLoading(false);
        }
      })
      .catch((err) => {
        if (isMounted) {
          console.error(err);
          setError(err.response?.data?.message || 'Collection not found');
          setLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [id]);

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '100px 0' }}>
        <Loader2 size={36} className="animate-spin" color="#38bdf8" />
        <p style={{ marginTop: '16px', color: '#94a3b8' }}>Loading collection...</p>
      </div>
    );
  }

  if (error || !collection) {
    return (
      <div className="empty-state">
        <div className="empty-state-icon" style={{ color: '#f43f5e' }}>
          <FolderOpen size={32} />
        </div>
        <h3 className="empty-state-title">Collection Not Found</h3>
        <p className="empty-state-description">
          {error || 'This collection could not be loaded or may have been deleted.'}
        </p>
        <Link to="/collections" className="btn-primary">
          <ArrowLeft size={16} />
          <span>Back to Collections</span>
        </Link>
      </div>
    );
  }

  const isOwner = Boolean(
    isAuthenticated &&
    user &&
    collection.owner &&
    (collection.owner._id === user._id || collection.owner._id === user.id || collection.owner === user.id)
  );

  const handleUpdateCollection = async (e) => {
    e.preventDefault();
    if (!editName.trim()) return;

    try {
      setSaving(true);
      const res = await collectionApi.updateCollection(collection._id, {
        name: editName.trim(),
        description: editDescription.trim()
      });

      setCollection((prev) => ({
        ...prev,
        name: res.data.name,
        description: res.data.description
      }));

      addToast('Collection details updated!', 'success');
      setEditModalOpen(false);
    } catch (err) {
      addToast(err.response?.data?.message || 'Failed to update collection', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteCollection = async () => {
    try {
      setDeleting(true);
      await collectionApi.deleteCollection(collection._id);
      addToast('Collection deleted', 'info');
      navigate('/collections');
    } catch (err) {
      addToast(err.response?.data?.message || 'Failed to delete collection', 'error');
      setDeleting(false);
    }
  };

  const handleRemoveImage = async (imageId) => {
    try {
      await collectionApi.removeImageFromCollection(collection._id, imageId);
      setCollection((prev) => ({
        ...prev,
        images: prev.images.filter((img) => img._id !== imageId)
      }));
      addToast('Removed from collection', 'info');
    } catch (err) {
      addToast(err.response?.data?.message || 'Failed to remove image', 'error');
    }
  };

  return (
    <div className="collection-detail-page">
      {/* Navigation bar */}
      <div style={{ marginBottom: '24px' }}>
        <Link
          to="/collections"
          className="btn-secondary"
          style={{ display: 'inline-flex', padding: '6px 14px', fontSize: '0.85rem' }}
        >
          <ArrowLeft size={14} />
          <span>All Collections</span>
        </Link>
      </div>

      {/* Collection Header */}
      <div
        style={{
          background: '#14171f',
          borderRadius: '20px',
          padding: '36px',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          marginBottom: '36px'
        }}
      >
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            flexWrap: 'wrap',
            gap: '20px'
          }}
        >
          <div style={{ maxWidth: '680px' }}>
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                background: 'rgba(56, 189, 248, 0.1)',
                color: '#38bdf8',
                padding: '4px 12px',
                borderRadius: '12px',
                fontSize: '0.8rem',
                fontWeight: 600,
                marginBottom: '12px'
              }}
            >
              <Images size={14} />
              <span>{collection.images?.length || 0} Photographs</span>
            </div>

            <h1
              style={{
                fontSize: '2.4rem',
                fontWeight: 800,
                letterSpacing: '-0.03em',
                color: '#f8fafc',
                marginBottom: '12px'
              }}
            >
              {collection.name}
            </h1>

            {collection.description && (
              <p
                style={{
                  fontSize: '1rem',
                  color: '#94a3b8',
                  lineHeight: 1.6,
                  marginBottom: '16px'
                }}
              >
                {collection.description}
              </p>
            )}

            <div style={{ fontSize: '0.86rem', color: '#64748b' }}>
              Created by{' '}
              <span style={{ color: '#f8fafc', fontWeight: 600 }}>
                {collection.owner?.name || 'Pixora Creator'}
              </span>
            </div>
          </div>

          {/* Owner Actions */}
          {isOwner && (
            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                type="button"
                className="btn-secondary"
                onClick={() => setEditModalOpen(true)}
              >
                <Edit2 size={15} />
                <span>Edit Collection</span>
              </button>
              <button
                type="button"
                className="btn-danger"
                onClick={() => setDeleteModalOpen(true)}
              >
                <Trash2 size={15} />
                <span>Delete</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Images in Collection */}
      {collection.images?.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">
            <Images size={32} />
          </div>
          <h3 className="empty-state-title">This collection is empty</h3>
          <p className="empty-state-description">
            Add photographs to this collection by clicking the bookmark icon while browsing images.
          </p>
          <Link to="/" className="btn-primary">
            <Compass size={16} />
            <span>Explore Photos to Add</span>
          </Link>
        </div>
      ) : (
        <div className="masonry-grid">
          {collection.images?.map((img) => (
            <div key={img._id} style={{ position: 'relative' }}>
              <ImageCard image={img} />
              {isOwner && (
                <button
                  type="button"
                  onClick={() => handleRemoveImage(img._id)}
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
                  title="Remove from collection"
                >
                  <X size={16} />
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Edit Collection Modal */}
      {editModalOpen && (
        <div className="modal-backdrop" onClick={() => setEditModalOpen(false)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">Edit Collection</h3>
              <button
                type="button"
                className="modal-close-btn"
                onClick={() => setEditModalOpen(false)}
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleUpdateCollection}>
              <div className="form-group">
                <label className="form-label">Collection Name *</label>
                <input
                  type="text"
                  className="form-input"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  required
                />
              </div>

              <div className="form-group" style={{ marginBottom: '24px' }}>
                <label className="form-label">Description</label>
                <textarea
                  className="form-textarea"
                  value={editDescription}
                  onChange={(e) => setEditDescription(e.target.value)}
                  style={{ minHeight: '80px' }}
                />
              </div>

              <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => setEditModalOpen(false)}
                  disabled={saving}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-primary"
                  disabled={saving || !editName.trim()}
                >
                  {saving ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteModalOpen && (
        <div className="modal-backdrop" onClick={() => setDeleteModalOpen(false)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <h3 className="modal-title" style={{ color: '#fda4af', marginBottom: '12px' }}>
              Delete Collection?
            </h3>
            <p style={{ color: '#94a3b8', fontSize: '0.92rem', marginBottom: '24px' }}>
              Are you sure you want to delete &ldquo;{collection.name}&rdquo;? The photographs will remain in the platform, but the collection board will be removed.
            </p>
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
              <button
                type="button"
                className="btn-secondary"
                onClick={() => setDeleteModalOpen(false)}
                disabled={deleting}
              >
                Cancel
              </button>
              <button
                type="button"
                className="btn-danger"
                onClick={handleDeleteCollection}
                disabled={deleting}
              >
                {deleting ? 'Deleting...' : 'Delete Collection'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
