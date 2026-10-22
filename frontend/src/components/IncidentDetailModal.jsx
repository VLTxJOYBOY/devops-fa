import { useState } from 'react';
import { updateIssueStatus, upvoteIssue, reopenIssue } from '../utils/api';
import './IncidentDetailModal.css';

const IncidentDetailModal = ({ issue, currentUser, onClose, onIssueUpdated }) => {
    const [resolutionForm, setResolutionForm] = useState(false);
    const [resolutionData, setResolutionData] = useState({ message: '', imageUrl: '' });
    const [upvotes, setUpvotes] = useState(issue.upvotes || []);
    const [isUpdating, setIsUpdating] = useState(false);

    if (!issue) return null;

    const hasUpvoted = upvotes.includes(currentUser?.id);
    const latitude = issue.lat ?? issue.location?.lat;
    const longitude = issue.lng ?? issue.location?.lng;

    const handleUpvote = async () => {
        if (!currentUser) {
            alert('Please sign in to upvote');
            return;
        }
        try {
            const { data } = await upvoteIssue(issue._id);
            setUpvotes(data.upvotes);
            if (onIssueUpdated) onIssueUpdated({ ...issue, upvotes: data.upvotes });
        } catch (err) {
            alert(err.response?.data?.message || 'Failed to upvote');
        }
    };

    const handleReopen = async () => {
        if (!window.confirm('Are you sure this issue is not resolved yet? This will notify the assigned representative.')) return;
        try {
            await reopenIssue(issue._id);
            alert('Incident has been flagged and re-opened.');
            if (onIssueUpdated) onIssueUpdated({ ...issue, status: 'Re-opened' });
            onClose();
        } catch (err) {
            alert(err.response?.data?.message || 'Failed to re-open incident');
        }
    };

    const handleStatusChange = async (newStatus) => {
        if (newStatus === 'Resolved') {
            setResolutionForm(true);
            return;
        }
        setIsUpdating(true);
        try {
            const { data } = await updateIssueStatus(issue._id, newStatus);
            if (onIssueUpdated) onIssueUpdated(data);
            setIsUpdating(false);
        } catch (_err) {
            alert('Failed to update status');
            setIsUpdating(false);
        }
    };

    const submitResolution = async () => {
        if (!resolutionData.message.trim()) {
            alert('Please provide a resolution summary');
            return;
        }
        setIsUpdating(true);
        try {
            const { data } = await updateIssueStatus(issue._id, 'Resolved', resolutionData);
            setResolutionForm(false);
            if (onIssueUpdated) onIssueUpdated(data);
            setIsUpdating(false);
            onClose();
        } catch (_err) {
            alert('Failed to submit resolution proof');
            setIsUpdating(false);
        }
    };

    const formatDate = (date) => {
        if (!date) return 'N/A';
        return new Date(date).toLocaleString('en-IN', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const statusClass = (issue.status || 'Reported').toLowerCase().replace(' ', '-');

    return (
        <div className="modal-backdrop-overlay" onClick={onClose}>
            <div className="incident-drawer-panel" onClick={(e) => e.stopPropagation()}>
                {/* Drawer Header */}
                <div className="drawer-header-bar">
                    <div className="header-meta-group">
                        <span className="incident-id-tag">INC-#{issue._id.slice(-6).toUpperCase()}</span>
                        <span className={`status-pill ${statusClass}`}>
                            <span className="dot"></span>
                            {issue.status}
                        </span>
                        <span className="category-pill">{issue.category || 'General'}</span>
                    </div>

                    <button className="btn-close-drawer" onClick={onClose} title="Close (Esc)">✕</button>
                </div>

                <div className="drawer-body-scroll">
                    {/* Main Title & Description */}
                    <div className="drawer-title-section">
                        <h2 className="incident-main-title">{issue.title}</h2>
                        <span className="incident-date-stamp">Logged on {formatDate(issue.createdAt)}</span>
                    </div>

                    <div className="drawer-section">
                        <label className="drawer-section-label">Incident Overview</label>
                        <p className="incident-full-desc">{issue.description}</p>
                    </div>

                    {/* Photographic Evidence */}
                    {issue.imageUrl && (
                        <div className="drawer-section">
                            <label className="drawer-section-label">Citizen Photographic Evidence</label>
                            <div className="evidence-large-frame">
                                <img src={issue.imageUrl} alt="Citizen Evidence" />
                            </div>
                        </div>
                    )}

                    {/* Assigned Representative Details */}
                    {issue.taggedRepresentative && (
                        <div className="drawer-section">
                            <label className="drawer-section-label">Assigned Municipal Authority</label>
                            <div className="official-profile-card">
                                <div className="official-avatar-ring">👮</div>
                                <div className="official-info">
                                    <div className="official-name-row">
                                        <strong>{issue.taggedRepresentative.username}</strong>
                                        <span className="official-desig-tag">{issue.taggedRepresentative.designation}</span>
                                    </div>
                                    <span className="official-area-sub">Assigned Jurisdiction: {issue.taggedRepresentative.area || 'City Ward'}</span>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Geospatial Coordinates */}
                    {latitude != null && longitude != null && (
                        <div className="drawer-section">
                            <label className="drawer-section-label">Geospatial Telemetry</label>
                            <div className="geo-telemetry-box">
                                <div className="geo-coord">
                                    <span>Latitude:</span>
                                    <code>{Number(latitude).toFixed(5)}</code>
                                </div>
                                <div className="geo-coord">
                                    <span>Longitude:</span>
                                    <code>{Number(longitude).toFixed(5)}</code>
                                </div>
                                <a
                                    href={`https://www.google.com/maps?q=${latitude},${longitude}`}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="btn-open-maps"
                                >
                                    🗺️ Open External GPS ↗
                                </a>
                            </div>
                        </div>
                    )}

                    {/* Verified Resolution Proof */}
                    {issue.status === 'Resolved' && issue.resolution && (
                        <div className="drawer-section">
                            <div className="resolution-seal-card">
                                <div className="seal-header">
                                    <span className="seal-check">✓</span>
                                    <div>
                                        <h4>Official Corrective Action Completed</h4>
                                        <span className="seal-time">Verified on {formatDate(issue.resolution.resolvedAt)}</span>
                                    </div>
                                </div>
                                <p className="seal-quote">"{issue.resolution.message}"</p>
                                {issue.resolution.imageUrl && (
                                    <div className="seal-img-wrapper">
                                        <img src={issue.resolution.imageUrl} alt="Official Completion Proof" />
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Official Resolution Form */}
                    {resolutionForm && (
                        <div className="drawer-section">
                            <div className="resolution-input-card">
                                <h4>Submit Official Completion Report</h4>
                                <textarea
                                    placeholder="Summarize actions taken (contractor dispatched, asphalt poured, transformer replaced)..."
                                    value={resolutionData.message}
                                    onChange={(e) => setResolutionData({ ...resolutionData, message: e.target.value })}
                                    rows="3"
                                    className="cyber-textarea"
                                />
                                <input
                                    type="url"
                                    placeholder="Proof photo URL (optional)"
                                    value={resolutionData.imageUrl}
                                    onChange={(e) => setResolutionData({ ...resolutionData, imageUrl: e.target.value })}
                                    className="cyber-input"
                                />
                                <div className="form-action-row">
                                    <button onClick={submitResolution} className="btn-confirm-res" disabled={isUpdating}>
                                        {isUpdating ? 'Saving...' : 'Authorize & Resolve'}
                                    </button>
                                    <button onClick={() => setResolutionForm(false)} className="btn-cancel-res">
                                        Cancel
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Drawer Footer Actions */}
                <div className="drawer-footer-actions">
                    <div className="footer-left">
                        <button
                            className={`btn-drawer-upvote ${hasUpvoted ? 'active' : ''}`}
                            onClick={handleUpvote}
                            disabled={hasUpvoted}
                        >
                            <span>{hasUpvoted ? '🔥 Upvoted' : '⚡ Prioritize / Upvote'}</span>
                            <span className="counter-pill">{upvotes.length}</span>
                        </button>

                        {issue.status === 'Resolved' && currentUser?.role === 'citizen' && (
                            <button className="btn-drawer-reopen" onClick={handleReopen}>
                                🚫 Dispute / Re-open
                            </button>
                        )}
                    </div>

                    {currentUser?.role === 'representative' && currentUser?.id === issue.taggedRepresentative?._id && issue.status !== 'Resolved' && (
                        <div className="footer-right-rep">
                            <span className="rep-label">Update Status:</span>
                            <select
                                value={issue.status}
                                onChange={(e) => handleStatusChange(e.target.value)}
                                className="rep-select-dropdown"
                                disabled={isUpdating}
                            >
                                <option value="Reported">Reported</option>
                                <option value="In Progress">In Progress</option>
                                <option value="Re-opened">Re-opened</option>
                                <option value="Resolved">Resolved (Submit Proof)</option>
                            </select>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default IncidentDetailModal;
