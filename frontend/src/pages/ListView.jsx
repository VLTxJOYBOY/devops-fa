import { useState, useEffect, useContext, useMemo } from 'react';
import { getIssues } from '../utils/api';
import { AuthContext } from '../utils/AuthContext';
import IssueCard from '../components/IssueCard';
import { io } from 'socket.io-client';
import './ListView.css';

const ListView = () => {
    const [issues, setIssues] = useState([]);
    const [statusFilter, setStatusFilter] = useState('All');
    const [categoryFilter, setCategoryFilter] = useState('All');
    const [searchQuery, setSearchQuery] = useState('');
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
        });

        socket.on('issueCreated', (newIssue) => {
            setIssues((prev) => [newIssue, ...prev]);
        });

        return () => socket.disconnect();
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

    // Filtering logic
    const filteredIssues = useMemo(() => {
        return issues.filter((issue) => {
            const matchesStatus = statusFilter === 'All' || issue.status === statusFilter;
            const matchesCategory = categoryFilter === 'All' || issue.category === categoryFilter;
            const matchesSearch = !searchQuery.trim() ||
                (issue.title && issue.title.toLowerCase().includes(searchQuery.toLowerCase())) ||
                (issue.description && issue.description.toLowerCase().includes(searchQuery.toLowerCase())) ||
                (issue.category && issue.category.toLowerCase().includes(searchQuery.toLowerCase()));
            return matchesStatus && matchesCategory && matchesSearch;
        });
    }, [issues, statusFilter, categoryFilter, searchQuery]);

    if (loading) {
        return (
            <div className="loading-container">
                <div className="spinner"></div>
                <p>Synchronizing Live Civic Telemetry...</p>
            </div>
        );
    }

    return (
        <div className="list-page-container">
            {/* Top Metrics HUD */}
            <div className="metrics-hud-grid">
                <div className="metric-card total">
                    <div className="metric-header">
                        <span className="metric-label">TOTAL INCIDENTS</span>
                        <span className="metric-icon">📑</span>
                    </div>
                    <div className="metric-value">{stats.total}</div>
                    <div className="metric-footer">
                        <span>{user?.role === 'representative' ? 'Assigned to your zone' : 'City-wide reports'}</span>
                    </div>
                </div>

                <div className="metric-card reported">
                    <div className="metric-header">
                        <span className="metric-label">REPORTED (NEW)</span>
                        <span className="metric-icon">⚠️</span>
                    </div>
                    <div className="metric-value">{stats.reported}</div>
                    <div className="metric-footer">
                        <span className="indicator-amber">● Pending Triaging</span>
                    </div>
                </div>

                <div className="metric-card in-progress">
                    <div className="metric-header">
                        <span className="metric-label">IN PROGRESS</span>
                        <span className="metric-icon">⚙️</span>
                    </div>
                    <div className="metric-value">{stats.inProgress}</div>
                    <div className="metric-footer">
                        <span className="indicator-blue">● Under active maintenance</span>
                    </div>
                </div>

                <div className="metric-card resolved">
                    <div className="metric-header">
                        <span className="metric-label">RESOLVED RATE</span>
                        <span className="metric-icon">✅</span>
                    </div>
                    <div className="metric-value">{stats.resolvedRate}%</div>
                    <div className="metric-footer">
                        <span className="indicator-emerald">{stats.resolved} incidents completed</span>
                    </div>
                </div>
            </div>

            {/* Filter and Command Controls */}
            <div className="command-bar-card">
                <div className="search-bar-wrapper">
                    <span className="search-icon">🔍</span>
                    <input
                        type="text"
                        className="search-input"
                        placeholder="Filter by keyword, title, area, or description..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                    {searchQuery && (
                        <button className="btn-clear-search" onClick={() => setSearchQuery('')}>✕</button>
                    )}
                </div>

                {/* Status Tabs */}
                <div className="filters-row">
                    <div className="status-chips-group">
                        <span className="filter-group-label">Status:</span>
                        {['All', 'Reported', 'In Progress', 'Resolved'].map(status => (
                            <button
                                key={status}
                                className={`filter-chip ${statusFilter === status ? 'active ' + status.toLowerCase().replace(' ', '-') : ''}`}
                                onClick={() => setStatusFilter(status)}
                            >
                                {status === 'All' && '🌐 All'}
                                {status === 'Reported' && '⚠️ Reported'}
                                {status === 'In Progress' && '⚡ In Progress'}
                                {status === 'Resolved' && '✅ Resolved'}
                            </button>
                        ))}
                    </div>

                    {/* Category Filter */}
                    {categories.length > 1 && (
                        <div className="category-chips-group">
                            <span className="filter-group-label">Category:</span>
                            <div className="category-scroll">
                                {categories.map(cat => (
                                    <button
                                        key={cat}
                                        className={`cat-chip ${categoryFilter === cat ? 'active' : ''}`}
                                        onClick={() => setCategoryFilter(cat)}
                                    >
                                        {cat}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Issues Feed Grid */}
            <div className="feed-header-meta">
                <div className="feed-count">
                    <span>Showing <strong>{filteredIssues.length}</strong> {filteredIssues.length === 1 ? 'incident' : 'incidents'}</span>
                </div>
            </div>

            {filteredIssues.length === 0 ? (
                <div className="empty-feed-card">
                    <div className="empty-icon">📡</div>
                    <h3>No Incidents Found</h3>
                    <p>There are no recorded issues matching your current filter criteria.</p>
                    <button
                        className="btn-reset-filters"
                        onClick={() => { setStatusFilter('All'); setCategoryFilter('All'); setSearchQuery(''); }}
                    >
                        Reset Filters
                    </button>
                </div>
            ) : (
                <div className="issues-deck-grid">
                    {filteredIssues.map((issue, index) => (
                        <IssueCard
                            key={issue._id}
                            issue={issue}
                            currentUser={user}
                            style={{ animationDelay: `${Math.min(index * 0.05, 0.4)}s` }}
                        />
                    ))}
                </div>
            )}
        </div>
    );
};

export default ListView;
