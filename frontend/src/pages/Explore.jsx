import { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { imageApi } from '../utils/api';
import ImageCard from '../components/ImageCard';
import { Search, Sparkles, Filter, ChevronLeft, ChevronRight, Image as ImageIcon } from 'lucide-react';

const CATEGORIES = [
  'All',
  'Nature',
  'Architecture',
  'Travel',
  'Portraits',
  'Food',
  'Technology'
];

export default function Explore() {
  const [searchParams, setSearchParams] = useSearchParams();
  const urlCategory = searchParams.get('category') || 'All';
  const urlQuery = searchParams.get('q') || '';
  const urlPage = parseInt(searchParams.get('page') || '1', 10);

  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [sort, setSort] = useState('newest');
  const [searchInput, setSearchInput] = useState(urlQuery);

  const fetchExploreImages = useCallback(async () => {
    try {
      setLoading(true);
      const params = {
        category: urlCategory === 'All' ? undefined : urlCategory,
        q: urlQuery || undefined,
        sort,
        page: urlPage,
        limit: 12
      };

      const res = await imageApi.getImages(params);
      setImages(res.data.images || []);
      setTotalPages(res.data.totalPages || 1);
      setTotalCount(res.data.total || 0);
    } catch (err) {
      console.error('Failed to load explore images:', err);
    } finally {
      setLoading(false);
    }
  }, [urlCategory, urlQuery, urlPage, sort]);

  useEffect(() => {
    setSearchInput(urlQuery);
    fetchExploreImages();
  }, [urlQuery, urlCategory, urlPage, sort, fetchExploreImages]);

  const handleCategorySelect = (category) => {
    const newParams = new URLSearchParams(searchParams);
    if (category === 'All') {
      newParams.delete('category');
    } else {
      newParams.set('category', category);
    }
    newParams.set('page', '1');
    setSearchParams(newParams);
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    const newParams = new URLSearchParams(searchParams);
    if (searchInput.trim()) {
      newParams.set('q', searchInput.trim());
    } else {
      newParams.delete('q');
    }
    newParams.set('page', '1');
    setSearchParams(newParams);
  };

  const handlePageChange = (newPage) => {
    const newParams = new URLSearchParams(searchParams);
    newParams.set('page', newPage.toString());
    setSearchParams(newParams);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleClearFilters = () => {
    setSearchInput('');
    setSearchParams({});
  };

  return (
    <div className="explore-page">
      {/* Hero Section */}
      <section className="hero-section">
        <h1 className="hero-title">
          Discover Extraordinary Photography
        </h1>
        <p className="hero-subtitle">
          Over 2 million curated photographs shared by an inspiring community of international visual artists.
        </p>

        <form className="hero-search-wrapper" onSubmit={handleSearchSubmit}>
          <div className="nav-search-input-wrapper" style={{ height: '54px', padding: '0 20px' }}>
            <Search size={22} color="#38bdf8" />
            <input
              type="text"
              placeholder="Search high-res photography, styles, color palettes..."
              className="nav-search-input"
              style={{ fontSize: '1.05rem' }}
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
            />
            {searchInput && (
              <button
                type="button"
                onClick={() => {
                  setSearchInput('');
                  const newParams = new URLSearchParams(searchParams);
                  newParams.delete('q');
                  setSearchParams(newParams);
                }}
                style={{ color: '#94a3b8', fontSize: '0.85rem', marginRight: '8px' }}
              >
                Clear
              </button>
            )}
            <button type="submit" className="btn-primary" style={{ padding: '8px 18px' }}>
              Search
            </button>
          </div>
        </form>
      </section>

      {/* Category Pills Bar */}
      <div className="category-filter-bar">
        {CATEGORIES.map((cat) => (
          <button
            key={cat}
            type="button"
            className={`category-pill ${urlCategory === cat ? 'active' : ''}`}
            onClick={() => handleCategorySelect(cat)}
          >
            {cat === 'All' && <Sparkles size={14} style={{ marginRight: '6px', verticalAlign: 'middle' }} />}
            {cat}
          </button>
        ))}
      </div>

      {/* Controls Header */}
      <div className="explore-controls-header">
        <div className="results-count">
          {urlQuery && <span>Search: &ldquo;{urlQuery}&rdquo; &bull; </span>}
          {urlCategory !== 'All' && <span>Category: {urlCategory} &bull; </span>}
          <span>{totalCount} photographs found</span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Filter size={15} color="#94a3b8" />
          <select
            className="sort-select"
            value={sort}
            onChange={(e) => setSort(e.target.value)}
          >
            <option value="newest">Newest First</option>
            <option value="popular">Most Popular</option>
          </select>
        </div>
      </div>

      {/* Gallery / Skeletons / Empty State */}
      {loading ? (
        <div className="masonry-grid">
          {Array.from({ length: 8 }).map((_, idx) => (
            <div key={idx} className="masonry-item">
              <div
                className="skeleton"
                style={{
                  height: idx % 2 === 0 ? '360px' : '260px',
                  borderRadius: '14px',
                  marginBottom: '20px'
                }}
              />
            </div>
          ))}
        </div>
      ) : images.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">
            <ImageIcon size={32} />
          </div>
          <h3 className="empty-state-title">No photographs found</h3>
          <p className="empty-state-description">
            We couldn&apos;t find any images matching your search or category filter. Try refining your keywords or explore all categories.
          </p>
          <button type="button" className="btn-primary" onClick={handleClearFilters}>
            Reset All Filters
          </button>
        </div>
      ) : (
        <>
          <div className="masonry-grid">
            {images.map((image) => (
              <ImageCard key={image._id} image={image} />
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div
              style={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                gap: '16px',
                marginTop: '48px'
              }}
            >
              <button
                type="button"
                className="btn-secondary"
                disabled={urlPage <= 1}
                onClick={() => handlePageChange(urlPage - 1)}
              >
                <ChevronLeft size={16} />
                <span>Previous</span>
              </button>

              <span style={{ fontSize: '0.9rem', color: '#94a3b8', fontWeight: 600 }}>
                Page {urlPage} of {totalPages}
              </span>

              <button
                type="button"
                className="btn-secondary"
                disabled={urlPage >= totalPages}
                onClick={() => handlePageChange(urlPage + 1)}
              >
                <span>Next</span>
                <ChevronRight size={16} />
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
