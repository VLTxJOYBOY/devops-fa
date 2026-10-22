import { useState, useEffect, useContext, useMemo } from 'react';
import { getIssues } from '../utils/api';
import { AuthContext } from '../utils/AuthContext';
import IssueCard from '../components/IssueCard';
import IncidentDetailModal from '../components/IncidentDetailModal';
import { io } from 'socket.io-client';
import './ListView.css';

const ListView = () => {
    const [issues, setIssues] = useState([]);
    const [statusFilter, setStatusFilter] = useState('All');
    const [categoryFilter, setCategoryFilter] = useState('All');
    const [searchQuery, setSearchQuery] = useState('');
    const [viewMode, setViewMode] = useState('stream'); // 'stream' (table/stream) or 'grid' (cards)
    const [sortBy, setSortBy] = useState('newest'); // 'newest' | 'upvotes'
    const [selectedIssue, setSelectedIssue] = useState(null);
    const [loading, setLoading] = useState(true);
    const { user } = useContext(AuthContext);

    useEffect(() => {
        fetchIssues();

        // Socket.IO setup for real-time updates
        const socket = io(import.meta.env.VITE_SOCKET_URL || '/');

        socket.on('statusUpdated', (data) => {
            setIssues((prevIssues) =>
                prevIssues.map((issue) =>
                    issue._id === data.id
                        ? { ...issue, status: data.status, resolution: data.resolution }
                        : issue
                )
            );
            // If currently viewing in drawer, update it too
            setSelectedIssue(prev => prev && prev._id === data.id ? { ...prev, status: data.status, resolution: data.resolution } : prev);
        });

        socket.on('issueCreated', (newIssue) => {
            setIssues((prev) => [newIssue, ...prev]);
        });

        return () => socket.disconnect();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const fetchIssues = async () => {
        try {
            const { data } = await getIssues();

            if (user?.role === 'representative') {
                const myIssues = data.filter(issue =>
                    issue.taggedRepresentative?._id === user.id
                );
                setIssues(myIssues);
            } else {
                setIssues(data);
            }
        } catch (_err) {
            console.error('Failed to fetch issues');
        } finally {
            setLoading(false);
        }
    };

    // Calculate dynamic stats
    const stats = useMemo(() => {
        const total = issues.length;
        const reported = issues.filter(i => i.status === 'Reported').length;
        const inProgress = issues.filter(i => i.status === 'In Progress').length;
        const resolved = issues.filter(i => i.status === 'Resolved').length;
        const totalUpvotes = issues.reduce((acc, i) => acc + (i.upvotes?.length || 0), 0);
        const resolvedRate = total > 0 ? Math.round((resolved / total) * 100) : 0;
        return { total, reported, inProgress, resolved, totalUpvotes, resolvedRate };
    }, [issues]);

    // Unique categories from actual data
    const categories = useMemo(() => {
        const cats = new Set(issues.map(i => i.category).filter(Boolean));
        return ['All', ...Array.from(cats)];
    }, [issues]);

    // Filtering & Sorting logic
    const filteredIssues = useMemo(() => {
        let result = issues.filter((issue) => {
            const matchesStatus = statusFilter === 'All' || issue.status === statusFilter;
            const matchesCategory = categoryFilter === 'All' || issue.category === categoryFilter;
            const matchesSearch = !searchQuery.trim() ||
                (issue.title && issue.title.toLowerCase().includes(searchQuery.toLowerCase())) ||
                (issue.description && issue.description.toLowerCase().includes(searchQuery.toLowerCase())) ||
                (issue.category && issue.category.toLowerCase().includes(searchQuery.toLowerCase())) ||
                (issue.taggedRepresentative?.username && issue.taggedRepresentative.username.toLowerCase().includes(searchQuery.toLowerCase()));
            return matchesStatus && matchesCategory && matchesSearch;
        });

        if (sortBy === 'upvotes') {
            result.sort((a, b) => (b.upvotes?.length || 0) - (a.upvotes?.length || 0));
        } else {
            result.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        }

        return result;
    }, [issues, statusFilter, categoryFilter, searchQuery, sortBy]);

    const handleIssueUpdated = (updatedIssue) => {
        setIssues(prev => prev.map(i => i._id === updatedIssue._id ? updatedIssue : i));
        setSelectedIssue(updatedIssue);
    };

    const formatDate = (date) => {
        if (!date) return '';
        return new Date(date).toLocaleDateString('en-IN', {
            month: 'short',
            day: 'numeric'
        });
    };

    const getCategoryIcon = (category) => {
        const cat = (category || '').toLowerCase();
        if (cat.includes('road') || cat.includes('pothole')) return '🛣️';
        if (cat.includes('light') || cat.includes('lamp')) return '💡';
        if (cat.includes('water') || cat.includes('leak')) return '🚰';
        if (cat.includes('garbage') || cat.includes('waste')) return '🗑️';
        return '⚠️';
    };

    if (loading) {
        return (
            <div className="loading-container">
                <div className="spinner"></div>
                <p>Establishing Secure Civic Data Pipeline...</p>
            </div>
        );
    }

    return (
        <div className="executive-feed-container">
            {/* Header Title & View Toggle */}
            <div className="feed-hero-bar">
                <div>
                    <div className="feed-tag">
                        <span className="feed-live-dot"></span>
                        <span>MUNICIPAL INCIDENT STREAM</span>
                    </div>
                    <h1 className="feed-title">{user?.role === 'representative' ? 'Assigned Duty Stream' : 'Live Civic Telemetry'}</h1>
                    <p className="feed-subtitle">
                        {user?.role === 'representative'
                            ? `Active incidents routed to your municipal desk (${issues.length} assigned)`
                            : `Centralized community operational log with real-time dispatch and verification`}
                    </p>
                </div>

                <div className="feed-view-toggles">
                    <button
                        className={`btn-view-toggle ${viewMode === 'stream' ? 'active' : ''}`}
                        onClick={() => setViewMode('stream')}
                        title="Stream View (Linear table)"
                    >
                        <span>☰ Stream Feed</span>
                    </button>
                    <button
                        className={`btn-view-toggle ${viewMode === 'grid' ? 'active' : ''}`}
                        onClick={() => setViewMode('grid')}
                        title="Gallery Card View"
                    >
                        <span>⊞ Card Deck</span>
                    </button>
                </div>
            </div>

            {/* Top Metrics Ribbon */}
            <div className="metrics-ribbon">
                <div className="ribbon-metric">
                    <span className="ribbon-label">Total Logged</span>
                    <span className="ribbon-value">{stats.total}</span>
                    <span className="ribbon-sub">All Incidents</span>
                </div>
                <div className="ribbon-metric">
                    <span className="ribbon-label">New Reports</span>
                    <span className="ribbon-value amber">{stats.reported}</span>
                    <span className="ribbon-sub">Pending Review</span>
                </div>
                <div className="ribbon-metric">
                    <span className="ribbon-label">Active Work</span>
                    <span className="ribbon-value blue">{stats.inProgress}</span>
                    <span className="ribbon-sub">In Dispatch</span>
                </div>
                <div className="ribbon-metric">
                    <span className="ribbon-label">Resolved Rate</span>
                    <span className="ribbon-value emerald">{stats.resolvedRate}%</span>
                    <span className="ribbon-sub">{stats.resolved} Closed</span>
                </div>
                <div className="ribbon-metric">
                    <span className="ribbon-label">Public Upvotes</span>
                    <span className="ribbon-value cyan">{stats.totalUpvotes}</span>
                    <span className="ribbon-sub">Community Signals</span>
                </div>
            </div>

            {/* Filter and Command Hub */}
            <div className="command-hub">
                <div className="search-box-row">
                    <div className="search-input-shell">
                        <span className="shell-icon">🔎</span>
                        <input
                            type="text"
                            placeholder="Search by title, category, authority, or keywords..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="shell-input"
                        />
                        {searchQuery && (
                            <button className="btn-clear-shell" onClick={() => setSearchQuery('')}>✕</button>
                        )}
                    </div>

                    <div className="sort-controls">
                        <span className="sort-label">Sort:</span>
                        <select
                            value={sortBy}
                            onChange={(e) => setSortBy(e.target.value)}
                            className="sort-dropdown"
                        >
                            <option value="newest">🕒 Most Recent</option>
                            <option value="upvotes">🔥 Most Upvoted</option>
                        </select>
                    </div>
                </div>

                <div className="filter-chips-row">
                    <div className="status-segments">
                        {['All', 'Reported', 'In Progress', 'Resolved'].map(st => (
                            <button
                                key={st}
                                className={`seg-btn ${statusFilter === st ? 'active ' + st.toLowerCase().replace(' ', '-') : ''}`}
                                onClick={() => setStatusFilter(st)}
                            >
                                {st}
                            </button>
                        ))}
                    </div>

                    {categories.length > 1 && (
                        <div className="category-scroll-chips">
                            {categories.map(cat => (
                                <button
                                    key={cat}
                                    className={`cat-pill ${categoryFilter === cat ? 'active' : ''}`}
                                    onClick={() => setCategoryFilter(cat)}
                                >
                                    {cat !== 'All' && getCategoryIcon(cat)} {cat}
                                </button>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Content Feed */}
            {filteredIssues.length === 0 ? (
                <div className="empty-stream-box">
                    <span className="empty-stream-icon">📡</span>
                    <h3>No incidents found</h3>
                    <p>No operational issues match your search and filter criteria.</p>
                    <button
                        className="btn-clear-all-filters"
                        onClick={() => { setStatusFilter('All'); setCategoryFilter('All'); setSearchQuery(''); }}
                    >
                        Clear All Filters
                    </button>
                </div>
            ) : viewMode === 'stream' ? (
                /* LINEAR-STYLE STREAM / TABLE VIEW */
                <div className="executive-stream-table">
                    <div className="stream-table-header">
                        <span className="col-status">Status</span>
                        <span className="col-category">Category</span>
                        <span className="col-title">Incident Title & Details</span>
                        <span className="col-official">Assigned Official</span>
                        <span className="col-date">Date</span>
                        <span className="col-upvotes">Signal</span>
                        <span className="col-action"></span>
                    </div>

                    <div className="stream-table-body">
                        {filteredIssues.map((issue) => {
                            const statusCls = (issue.status || 'Reported').toLowerCase().replace(' ', '-');
                            const hasUpvoted = (issue.upvotes || []).includes(user?.id);

                            return (
                                <div
                                    key={issue._id}
                                    className={`stream-row status-${statusCls}`}
                                    onClick={() => setSelectedIssue(issue)}
                                >
                                    <div className="col-status">
                                        <span className={`status-badge-mini ${statusCls}`}>
                                            <span className="dot"></span>
                                            {issue.status}
                                        </span>
                                    </div>

                                    <div className="col-category">
                                        <span className="cat-badge-mini">
                                            <span>{getCategoryIcon(issue.category)}</span>
                                            <span>{issue.category || 'General'}</span>
                                        </span>
                                    </div>

                                    <div className="col-title">
                                        <div className="title-row-content">
                                            <strong className="issue-row-title">{issue.title}</strong>
                                            <span className="issue-row-snippet">{issue.description}</span>
                                        </div>
                                    </div>

                                    <div className="col-official">
                                        {issue.taggedRepresentative ? (
                                            <div className="rep-mini-chip">
                                                <span className="rep-mini-avatar">👮</span>
                                                <div className="rep-mini-text">
                                                    <span className="rep-mini-name">{issue.taggedRepresentative.username}</span>
                                                    <span className="rep-mini-desig">{issue.taggedRepresentative.designation}</span>
                                                </div>
                                            </div>
                                        ) : (
                                            <span className="unassigned-text">—</span>
                                        )}
                                    </div>

                                    <div className="col-date">
                                        <span className="date-mini">{formatDate(issue.createdAt)}</span>
                                    </div>

                                    <div className="col-upvotes">
                                        <span className={`upvote-pill-mini ${hasUpvoted ? 'active' : ''}`}>
                                            <span>{hasUpvoted ? '🔥' : '⚡'}</span>
                                            <span>{issue.upvotes?.length || 0}</span>
                                        </span>
                                    </div>

                                    <div className="col-action">
                                        <button className="btn-inspect-row">
                                            <span>Inspect</span>
                                            <span className="arrow">➔</span>
                                        </button>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            ) : (
                /* GALLERY CARD DECK VIEW */
                <div className="issues-deck-grid">
                    {filteredIssues.map((issue, index) => (
                        <div key={issue._id} onClick={() => setSelectedIssue(issue)} className="card-click-wrapper">
                            <IssueCard
                                issue={issue}
                                currentUser={user}
                                style={{ animationDelay: `${Math.min(index * 0.05, 0.4)}s` }}
                            />
                        </div>
                    ))}
                </div>
            )}

            {/* Slide-over Detail Modal / Drawer */}
            {selectedIssue && (
                <IncidentDetailModal
                    issue={selectedIssue}
                    currentUser={user}
                    onClose={() => setSelectedIssue(null)}
                    onIssueUpdated={handleIssueUpdated}
                />
            )}
        </div>
    );
};

export default ListView;
