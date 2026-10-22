import { useState, useEffect } from 'react';
import { collectionApi } from '../utils/api';
import { useToast } from '../utils/ToastContext';
import { X, Plus, FolderCheck, Loader2 } from 'lucide-react';

export default function AddToCollectionModal({ image, isOpen, onClose }) {
  const [collections, setCollections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [newCollectionName, setNewCollectionName] = useState('');
  const [actionLoadingId, setActionLoadingId] = useState(null);
  const { addToast } = useToast();

  useEffect(() => {
    if (!isOpen) return;

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
  }, [isOpen]);

  if (!isOpen || !image) return null;

  const handleAddToCollection = async (collectionId) => {
    try {
      setActionLoadingId(collectionId);
      await collectionApi.addImageToCollection(collectionId, image._id);
      addToast('Added to collection!', 'success');
      onClose();
    } catch (err) {
      addToast(err.response?.data?.message || 'Failed to add to collection', 'error');
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleCreateAndAdd = async (e) => {
    e.preventDefault();
    if (!newCollectionName.trim()) return;

    try {
      setActionLoadingId('new');
      const createRes = await collectionApi.createCollection({
        name: newCollectionName.trim(),
        coverImageUrl: image.imageUrl
      });

      const newCol = createRes.data;
      await collectionApi.addImageToCollection(newCol._id, image._id);
      addToast(`Created "${newCollectionName}" & added photo!`, 'success');
      setNewCollectionName('');
      setIsCreating(false);
      onClose();
    } catch (err) {
      addToast(err.response?.data?.message || 'Failed to create collection', 'error');
    } finally {
      setActionLoadingId(null);
    }
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-card" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3 className="modal-title">Save to Collection</h3>
          <button type="button" className="modal-close-btn" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '32px 0' }}>
            <Loader2 className="animate-spin" size={28} color="#38bdf8" />
            <p style={{ marginTop: '12px', color: '#94a3b8', fontSize: '0.88rem' }}>
              Loading your collections...
            </p>
          </div>
        ) : (
          <div>
            <div style={{ maxHeight: '240px', overflowY: 'auto', marginBottom: '20px' }}>
              {collections.length === 0 ? (
                <p style={{ color: '#94a3b8', fontSize: '0.9rem', textAlign: 'center', padding: '16px 0' }}>
                  You haven&apos;t created any collections yet.
                </p>
              ) : (
                collections.map((col) => {
                  const alreadyInCol = col.images?.some((img) => (img._id || img) === image._id);
                  return (
                    <div
                      key={col._id}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '10px 14px',
                        borderRadius: '8px',
                        background: '#1d212c',
                        marginBottom: '8px',
                        border: '1px solid rgba(255,255,255,0.06)'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div
                          style={{
                            width: '36px',
                            height: '36px',
                            borderRadius: '6px',
                            background: '#262c3b',
                            overflow: 'hidden'
                          }}
                        >
                          {col.coverImageUrl ? (
                            <img
                              src={col.coverImageUrl}
                              alt={col.name}
                              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                            />
                          ) : (
                            <FolderCheck size={20} style={{ margin: '8px', color: '#94a3b8' }} />
                          )}
                        </div>
                        <div>
                          <div style={{ fontSize: '0.92rem', fontWeight: 600, color: '#f8fafc' }}>
                            {col.name}
                          </div>
                          <div style={{ fontSize: '0.78rem', color: '#64748b' }}>
                            {col.images?.length || 0} items
                          </div>
                        </div>
                      </div>

                      <button
                        type="button"
                        className={alreadyInCol ? 'btn-secondary' : 'btn-primary'}
                        style={{ padding: '6px 14px', fontSize: '0.82rem' }}
                        disabled={alreadyInCol || actionLoadingId === col._id}
                        onClick={() => handleAddToCollection(col._id)}
                      >
                        {actionLoadingId === col._id ? (
                          <Loader2 size={14} className="animate-spin" />
                        ) : alreadyInCol ? (
                          'Added'
                        ) : (
                          'Add'
                        )}
                      </button>
                    </div>
                  );
                })
              )}
            </div>

            {isCreating ? (
              <form onSubmit={handleCreateAndAdd} style={{ borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: '16px' }}>
                <div className="form-group" style={{ marginBottom: '12px' }}>
                  <label className="form-label">New Collection Name</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="e.g. Minimalist Architecture, Sunset Moods"
                    value={newCollectionName}
                    onChange={(e) => setNewCollectionName(e.target.value)}
                    autoFocus
                  />
                </div>
                <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                  <button
                    type="button"
                    className="btn-secondary"
                    onClick={() => setIsCreating(false)}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="btn-primary"
                    disabled={!newCollectionName.trim() || actionLoadingId === 'new'}
                  >
                    {actionLoadingId === 'new' ? 'Creating...' : 'Create & Add'}
                  </button>
                </div>
              </form>
            ) : (
              <button
                type="button"
                className="btn-secondary"
                style={{ width: '100%', justifyContent: 'center' }}
                onClick={() => setIsCreating(true)}
              >
                <Plus size={16} />
                <span>Create New Collection</span>
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
