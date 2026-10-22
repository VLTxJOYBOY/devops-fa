import { useState, useRef, useContext } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import { AuthContext } from '../utils/AuthContext';
import { useToast } from '../utils/ToastContext';
import { imageApi } from '../utils/api';
import {
  UploadCloud,
  Image as ImageIcon,
  X,
  Tag,
  Loader2,
  CheckCircle,
  AlertCircle
} from 'lucide-react';

const CATEGORIES = [
  'Nature',
  'Architecture',
  'Travel',
  'Portraits',
  'Food',
  'Technology',
  'Other'
];

export default function UploadImage() {
  const { isAuthenticated, loading: authLoading } = useContext(AuthContext);
  const navigate = useNavigate();
  const { addToast } = useToast();
  const fileInputRef = useRef(null);

  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('Nature');
  const [tags, setTags] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [errorMsg, setErrorMsg] = useState('');

  if (!authLoading && !isAuthenticated) {
    return <Navigate to="/login" state={{ from: { pathname: '/upload' } }} replace />;
  }

  const validateAndSetFile = (file) => {
    setErrorMsg('');
    if (!file) return;

    const validTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      setErrorMsg('Invalid file format. Please choose a JPEG, PNG, or WebP photograph.');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setErrorMsg('File size exceeds 5MB limit. Please upload a smaller image.');
      return;
    }

    setSelectedFile(file);
    const objectUrl = URL.createObjectURL(file);
    setPreviewUrl(objectUrl);

    // Auto-fill title from filename if empty
    if (!title) {
      const cleanName = file.name
        .replace(/\.[^/.]+$/, '')
        .replace(/[-_]/g, ' ')
        .replace(/\b\w/g, (c) => c.toUpperCase());
      setTitle(cleanName);
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    validateAndSetFile(file);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    validateAndSetFile(file);
  };

  const handleRemoveFile = () => {
    setSelectedFile(null);
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl('');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');

    if (!selectedFile) {
      setErrorMsg('Please select or drag an image to upload.');
      return;
    }

    if (!title.trim()) {
      setErrorMsg('Please provide a title for your photograph.');
      return;
    }

    try {
      setUploading(true);
      setUploadProgress(25);

      const formData = new FormData();
      formData.append('image', selectedFile);
      formData.append('title', title.trim());
      formData.append('description', description.trim());
      formData.append('category', category);
      formData.append('tags', tags);

      setUploadProgress(60);
      const res = await imageApi.uploadImage(formData);
      setUploadProgress(100);

      addToast('Photograph uploaded and published to Pixora!', 'success');
      navigate(`/image/${res.data._id}`);
    } catch (err) {
      console.error(err);
      const msg = err.response?.data?.message || 'Failed to upload image. Please try again.';
      setErrorMsg(msg);
      addToast(msg, 'error');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div style={{ maxWidth: '820px', margin: '0 auto', padding: '16px 0 60px' }}>
      <div style={{ marginBottom: '32px' }}>
        <h1 style={{ fontSize: '2rem', fontWeight: 800, letterSpacing: '-0.03em', color: '#f8fafc' }}>
          Publish a Photograph
        </h1>
        <p style={{ color: '#94a3b8', fontSize: '0.95rem', marginTop: '6px' }}>
          Upload high-resolution photography. Your assets are stored in Cloudinary and distributed globally.
        </p>
      </div>

      {errorMsg && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            background: 'rgba(244, 63, 94, 0.15)',
            border: '1px solid rgba(244, 63, 94, 0.3)',
            borderRadius: '10px',
            padding: '12px 16px',
            color: '#fda4af',
            marginBottom: '24px'
          }}
        >
          <AlertCircle size={18} />
          <span>{errorMsg}</span>
        </div>
      )}

      <form onSubmit={handleSubmit}>
        {/* Upload Dropzone / Live Preview Area */}
        <div style={{ marginBottom: '28px' }}>
          {!previewUrl ? (
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              style={{
                border: `2px dashed ${isDragging ? '#38bdf8' : 'rgba(255, 255, 255, 0.15)'}`,
                borderRadius: '18px',
                padding: '54px 24px',
                textAlign: 'center',
                background: isDragging ? 'rgba(56, 189, 248, 0.05)' : '#14171f',
                cursor: 'pointer',
                transition: 'all 0.2s ease'
              }}
            >
              <div
                style={{
                  width: '64px',
                  height: '64px',
                  borderRadius: '50%',
                  background: '#1d212c',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 16px',
                  color: '#38bdf8'
                }}
              >
                <UploadCloud size={32} />
              </div>

              <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: '#f8fafc', marginBottom: '8px' }}>
                Drag and drop your high-res image here
              </h3>
              <p style={{ color: '#94a3b8', fontSize: '0.88rem', marginBottom: '16px' }}>
                Supports JPEG, PNG, and WebP (up to 5 MB)
              </p>

              <button
                type="button"
                className="btn-primary"
                style={{ padding: '8px 20px', fontSize: '0.88rem' }}
                onClick={(e) => {
                  e.stopPropagation();
                  fileInputRef.current?.click();
                }}
              >
                Browse Files
              </button>
            </div>
          ) : (
            <div
              style={{
                position: 'relative',
                background: '#07090c',
                borderRadius: '18px',
                overflow: 'hidden',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                textAlign: 'center'
              }}
            >
              <img
                src={previewUrl}
                alt="Upload Preview"
                style={{ maxHeight: '420px', maxWidth: '100%', objectFit: 'contain' }}
              />

              <div
                style={{
                  position: 'absolute',
                  top: '16px',
                  right: '16px',
                  display: 'flex',
                  gap: '8px'
                }}
              >
                <button
                  type="button"
                  onClick={handleRemoveFile}
                  style={{
                    background: 'rgba(0, 0, 0, 0.75)',
                    color: '#f43f5e',
                    border: '1px solid rgba(244, 63, 94, 0.4)',
                    borderRadius: '50%',
                    width: '36px',
                    height: '36px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                  title="Remove image"
                >
                  <X size={18} />
                </button>
              </div>

              <div
                style={{
                  padding: '10px 16px',
                  background: '#14171f',
                  borderTop: '1px solid rgba(255,255,255,0.06)',
                  display: 'flex',
                  justifyContent: 'space-between',
                  fontSize: '0.82rem',
                  color: '#94a3b8'
                }}
              >
                <span>{selectedFile?.name}</span>
                <span>{(selectedFile?.size / (1024 * 1024)).toFixed(2)} MB</span>
              </div>
            </div>
          )}

          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept="image/jpeg,image/png,image/webp"
            style={{ display: 'none' }}
          />
        </div>

        {/* Metadata Inputs */}
        <div
          style={{
            background: '#14171f',
            borderRadius: '18px',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            padding: '28px'
          }}
        >
          <div className="form-group">
            <label className="form-label">Photograph Title *</label>
            <input
              type="text"
              className="form-input"
              placeholder="e.g. Autumn Sunrise over Maroon Bells"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Category *</label>
            <select
              className="form-select"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
            >
              {CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">Story &amp; Description</label>
            <textarea
              className="form-textarea"
              placeholder="Describe the mood, lighting, location, or equipment used..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          <div className="form-group" style={{ marginBottom: '28px' }}>
            <label className="form-label">Tags (comma-separated)</label>
            <div style={{ position: 'relative' }}>
              <input
                type="text"
                className="form-input"
                placeholder="mountains, fog, landscape, goldenhour, leica"
                value={tags}
                onChange={(e) => setTags(e.target.value)}
                style={{ paddingLeft: '38px' }}
              />
              <Tag
                size={18}
                style={{ position: 'absolute', left: '12px', top: '12px', color: '#64748b' }}
              />
            </div>
          </div>

          {uploading && (
            <div style={{ marginBottom: '20px' }}>
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  fontSize: '0.85rem',
                  color: '#38bdf8',
                  marginBottom: '8px'
                }}
              >
                <span>Uploading to Cloudinary...</span>
                <span>{uploadProgress}%</span>
              </div>
              <div
                style={{
                  width: '100%',
                  height: '6px',
                  background: '#1d212c',
                  borderRadius: '3px',
                  overflow: 'hidden'
                }}
              >
                <div
                  style={{
                    width: `${uploadProgress}%`,
                    height: '100%',
                    background: 'linear-gradient(90deg, #38bdf8, #0ea5e9)',
                    transition: 'width 0.3s ease'
                  }}
                />
              </div>
            </div>
          )}

          <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
            <button
              type="button"
              className="btn-secondary"
              onClick={() => navigate('/')}
              disabled={uploading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn-primary"
              disabled={uploading || !selectedFile}
              style={{ minWidth: '160px' }}
            >
              {uploading ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  <span>Processing...</span>
                </>
              ) : (
                <>
                  <CheckCircle size={16} />
                  <span>Publish Photograph</span>
                </>
              )}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
