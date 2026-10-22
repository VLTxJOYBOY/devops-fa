import { useState, useEffect, useContext } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { AuthContext } from '../utils/AuthContext';
import { useToast } from '../utils/ToastContext';
import { collectionApi } from '../utils/api';
import {
  Bookmark,
  Plus,
  Images,
  FolderOpen,
  Loader2,
  X,
  ExternalLink
} from 'lucide-react';

export default function Collections() {
  const { isAuthenticated, loading: authLoading } = useContext(AuthContext);
  const { addToast } = useToast();

  const [collections, setCollections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    if (!isAuthenticated) return;

    let isMounted = true;

    collectionApi.getCollections()
      .then((res) => {
        if (isMounted) {
          setCollections(res.data);
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
    return <Navigate to="/login" state={{ from: { pathname: '/collections' } }} replace />;
  }

  const handleCreateCollection = async (e) => {
    e.preventDefault();
    if (!name.trim()) return;

    try {
      setCreating(true);
      const res = await collectionApi.createCollection({
        name: name.trim(),
        description: description.trim()
      });

      setCollections((prev) => [res.data, ...prev]);
      addToast(`Collection "${name.trim()}" created!`, 'success');
      setName('');
      setDescription('');
      setModalOpen(false);
    } catch (err) {
      addToast(err.response?.data?.message || 'Failed to create collection', 'error');
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="collections-page">
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '32px',
          flexWrap: 'wrap',
          gap: '16px'
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
            <div
              style={{
                width: '40px',
                height: '40px',
                borderRadius: '10px',
                background: 'rgba(56, 189, 248, 0.15)',
                color: '#38bdf8',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <Bookmark size={22} fill="currentColor" />
            </div>
            <h1 style={{ fontSize: '2rem', fontWeight: 800, letterSpacing: '-0.03em', color: '#f8fafc' }}>
              Personal Collections
            </h1>
          </div>
          <p style={{ color: '#94a3b8', fontSize: '0.95rem' }}>
            Curate thematic boards and group images by style, location, or project.
          </p>
        </div>

        <button
          type="button"
          className="btn-primary"
          onClick={() => setModalOpen(true)}
        >
          <Plus size={16} />
          <span>New Collection</span>
        </button>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '60px 0' }}>
          <Loader2 size={32} className="animate-spin" color="#38bdf8" />
          <p style={{ marginTop: '12px', color: '#94a3b8' }}>Loading collections...</p>
        </div>
      ) : collections.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon" style={{ color: '#38bdf8' }}>
            <FolderOpen size={32} />
          </div>
          <h3 className="empty-state-title">No Collections Yet</h3>
          <p className="empty-state-description">
            Organize the photography you love into custom moodboards and collections.
          </p>
          <button
            type="button"
            className="btn-primary"
            onClick={() => setModalOpen(true)}
          >
            <Plus size={16} />
            <span>Create Your First Collection</span>
          </button>
        </div>
      ) : (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
            gap: '24px'
          }}
        >
          {collections.map((col) => {
            const count = col.images?.length || 0;
            const cover = col.coverImageUrl || col.images?.[0]?.imageUrl;

            return (
              <Link
                key={col._id}
                to={`/collections/${col._id}`}
                style={{
                  background: '#14171f',
                  borderRadius: '16px',
                  overflow: 'hidden',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                  transition: 'all 0.25s ease',
                  display: 'flex',
                  flexDirection: 'column'
                }}
                className="collection-card"
              >
                {/* Cover Image */}
                <div
                  style={{
                    height: '200px',
                    background: '#1d212c',
                    position: 'relative',
                    overflow: 'hidden'
                  }}
                >
                  {cover ? (
                    <img
                      src={cover}
                      alt={col.name}
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                  ) : (
                    <div
                      style={{
                        height: '100%',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: '#64748b'
                      }}
                    >
                      <Images size={36} />
                      <span style={{ fontSize: '0.8rem', marginTop: '8px' }}>Empty Collection</span>
                    </div>
                  )}

                  <div
                    style={{
                      position: 'absolute',
                      bottom: '12px',
                      right: '12px',
                      background: 'rgba(12, 14, 18, 0.8)',
                      backdropFilter: 'blur(8px)',
                      padding: '4px 10px',
                      borderRadius: '12px',
                      fontSize: '0.75rem',
                      fontWeight: 600,
                      color: '#f8fafc',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px'
                    }}
                  >
                    <Images size={13} />
                    <span>{count} photos</span>
                  </div>
                </div>

                {/* Content */}
                <div style={{ padding: '20px', flex: 1, display: 'flex', flexDirection: 'column' }}>
                  <h3
                    style={{
                      fontSize: '1.15rem',
                      fontWeight: 700,
                      color: '#f8fafc',
                      marginBottom: '6px'
                    }}
                  >
                    {col.name}
                  </h3>
                  {col.description && (
                    <p
                      style={{
                        fontSize: '0.88rem',
                        color: '#94a3b8',
                        lineHeight: 1.5,
                        flex: 1,
                        marginBottom: '16px'
                      }}
                    >
                      {col.description}
                    </p>
                  )}
                  <div
                    style={{
                      marginTop: 'auto',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      fontSize: '0.8rem',
                      color: '#64748b'
                    }}
                  >
                    <span>Curated by {col.owner?.name || 'You'}</span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#38bdf8' }}>
                      <span>View</span>
                      <ExternalLink size={12} />
                    </span>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}

      {/* Create Collection Modal */}
      {modalOpen && (
        <div className="modal-backdrop" onClick={() => setModalOpen(false)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">Create New Collection</h3>
              <button
                type="button"
                className="modal-close-btn"
                onClick={() => setModalOpen(false)}
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleCreateCollection}>
              <div className="form-group">
                <label className="form-label">Collection Name *</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g. Nordic Winter, Street Reflections"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  autoFocus
                />
              </div>

              <div className="form-group" style={{ marginBottom: '24px' }}>
                <label className="form-label">Description (Optional)</label>
                <textarea
                  className="form-textarea"
                  placeholder="What visual theme or story does this collection represent?"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  style={{ minHeight: '80px' }}
                />
              </div>

              <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => setModalOpen(false)}
                  disabled={creating}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-primary"
                  disabled={creating || !name.trim()}
                >
                  {creating ? 'Creating...' : 'Create Collection'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
