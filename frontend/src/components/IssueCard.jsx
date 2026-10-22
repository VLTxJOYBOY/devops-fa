import { useState } from 'react';
import { updateIssueStatus, upvoteIssue, reopenIssue } from '../utils/api';
import './IssueCard.css';

const IssueCard = ({ issue, currentUser, style }) => {
    const [resolutionForm, setResolutionForm] = useState(false);
    const [resolutionData, setResolutionData] = useState({ message: '', imageUrl: '' });
    const [upvotes, setUpvotes] = useState(issue.upvotes || []);
    const [isUpdating, setIsUpdating] = useState(false);

    const getCategoryIcon = (category) => {
        const cat = (category || '').toLowerCase();
        if (cat.includes('road') || cat.includes('pothole')) return '🛣️';
        if (cat.includes('light') || cat.includes('lamp')) return '💡';
        if (cat.includes('water') || cat.includes('leak')) return '🚰';
        if (cat.includes('garbage') || cat.includes('waste') || cat.includes('sanitation')) return '🗑️';
        return '⚠️';
    };

    const handleStatusChange = async (newStatus) => {
        if (newStatus === 'Resolved') {
            setResolutionForm(true);
            return;
        }
        setIsUpdating(true);
        try {
            await updateIssueStatus(issue._id, newStatus);
        } catch (_err) {
            alert('Failed to update status');
        } finally {
            setIsUpdating(false);
        }
    };

    const handleUpvote = async () => {
        if (!currentUser) {
            alert('Please sign in to upvote issues');
            return;
        }
        try {
            const { data } = await upvoteIssue(issue._id);
            setUpvotes(data.upvotes);
        } catch (err) {
            alert(err.response?.data?.message || 'Failed to upvote');
        }
    };

    const handleReopen = async () => {
        if (!window.confirm('Are you sure this issue is not resolved yet? This will notify the assigned representative.')) return;
        try {
            await reopenIssue(issue._id);
            alert('Issue re-opened. The representative has been notified.');
        } catch (err) {
            alert(err.response?.data?.message || 'Failed to re-open issue');
        }
    };

    const submitResolution = async () => {
        if (!resolutionData.message.trim()) {
            alert('Please provide a resolution note or action summary');
            return;
        }
        setIsUpdating(true);
        try {
            await updateIssueStatus(issue._id, 'Resolved', resolutionData);
            setResolutionForm(false);
        } catch (_err) {
            alert('Failed to submit resolution');
        } finally {
            setIsUpdating(false);
        }
    };

    const formatDate = (date) => {
        if (!date) return '';
        return new Date(date).toLocaleDateString('en-IN', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    };

    const hasUpvoted = upvotes.includes(currentUser?.id);
    const statusClass = (issue.status || 'Reported').toLowerCase().replace(' ', '-');
    const latitude = issue.lat ?? issue.location?.lat;
    const longitude = issue.lng ?? issue.location?.lng;

    return (
        <div className={`cyber-issue-card status-${statusClass}`} style={style}>
            <div className="card-top-stripe"></div>

            <div className="card-header-bar">
                <div className="category-tag">
                    <span className="cat-icon">{getCategoryIcon(issue.category)}</span>
                    <span className="cat-text">{issue.category || 'General'}</span>
                </div>

                <div className={`status-badge-chip ${statusClass}`}>
                    <span className="status-dot"></span>
                    <span className="status-text">{issue.status}</span>
                </div>
            </div>

            <div className="card-body-content">
                <h3 className="card-issue-title">{issue.title}</h3>
                <p className="card-issue-desc">{issue.description}</p>

                {issue.imageUrl && (
                    <div className="card-media-wrapper">
                        <img src={issue.imageUrl} alt="Incident Evidence" className="card-evidence-img" />
                    </div>
                )}
            </div>

            {/* Representative Assignment */}
            {issue.taggedRepresentative && (
                <div className="assigned-official-chip">
                    <div className="official-avatar">👮</div>
                    <div className="official-meta">
                        <span className="official-name">{issue.taggedRepresentative.username}</span>
                        <span className="official-role">{issue.taggedRepresentative.designation} • {issue.taggedRepresentative.area || 'Zone'}</span>
                    </div>
                </div>
            )}

            {/* Resolution Verification Box */}
            {issue.status === 'Resolved' && issue.resolution && (
                <div className="resolution-proof-card">
                    <div className="resolution-header">
                        <span className="proof-icon">✅</span>
                        <span className="proof-label">VERIFIED RESOLUTION</span>
                    </div>
                    <p className="resolution-message">"{issue.resolution.message}"</p>
                    {issue.resolution.imageUrl && (
                        <div className="resolution-img-box">
                            <img src={issue.resolution.imageUrl} alt="Resolution Proof" className="resolution-proof-img" />
                        </div>
                    )}
                    <div className="resolution-timestamp">
                        <span>Completed {formatDate(issue.resolution.resolvedAt)}</span>
                    </div>
                </div>
            )}

            {/* Representative Status Changer Modal/Panel */}
            {currentUser?.role === 'representative' && currentUser?.id === issue.taggedRepresentative?._id && issue.status !== 'Resolved' && (
                <div className="rep-management-bar">
                    <span className="rep-action-label">Update Ticket:</span>
                    <select
                        value={issue.status}
                        onChange={(e) => handleStatusChange(e.target.value)}
                        className="rep-status-dropdown"
                        disabled={isUpdating}
                    >
                        <option value="Reported">Reported</option>
                        <option value="In Progress">In Progress</option>
                        <option value="Re-opened">Re-opened</option>
                        <option value="Resolved">Resolved (Submit Proof)</option>
                    </select>
                </div>
            )}

            {/* Resolution Form Dropdown */}
            {resolutionForm && (
                <div className="resolution-submission-dock">
                    <div className="resolution-dock-header">
                        <h4>Attach Official Resolution Proof</h4>
                        <button className="btn-close-dock" onClick={() => setResolutionForm(false)}>✕</button>
                    </div>
                    <textarea
                        placeholder="Detail corrective actions taken (repairs completed, dispatch info)..."
                        value={resolutionData.message}
                        onChange={(e) => setResolutionData({ ...resolutionData, message: e.target.value })}
                        rows="3"
                        className="dock-textarea"
                    />
                    <input
                        type="url"
                        placeholder="Proof image URL (e.g. photo of repaired road/light)"
                        value={resolutionData.imageUrl}
                        onChange={(e) => setResolutionData({ ...resolutionData, imageUrl: e.target.value })}
                        className="dock-input"
                    />
                    <div className="dock-actions-row">
                        <button onClick={submitResolution} className="btn-dock-submit" disabled={isUpdating}>
                            {isUpdating ? 'Submitting...' : 'Confirm Resolution'}
                        </button>
                        <button onClick={() => setResolutionForm(false)} className="btn-dock-cancel">Cancel</button>
                    </div>
                </div>
            )}

            {/* Card Footer Actions & Meta */}
            <div className="card-footer-controls">
                <div className="incident-meta-tags">
                    <span className="meta-item">📅 {formatDate(issue.createdAt)}</span>
                    {latitude != null && longitude != null && (
                        <span className="meta-item">📍 {Number(latitude).toFixed(3)}, {Number(longitude).toFixed(3)}</span>
                    )}
                </div>

                <div className="incident-action-buttons">
                    <button
                        className={`btn-upvote-counter ${hasUpvoted ? 'upvoted' : ''}`}
                        onClick={handleUpvote}
                        disabled={hasUpvoted}
                        title={hasUpvoted ? 'You have upvoted this incident' : 'Upvote to boost priority'}
                    >
                        <span className="upvote-flame">{hasUpvoted ? '🔥' : '⚡'}</span>
                        <span className="upvote-count">{upvotes.length}</span>
                    </button>

                    {issue.status === 'Resolved' && currentUser?.role === 'citizen' && (
                        <button
                            className="btn-reopen-ticket"
                            onClick={handleReopen}
                            title="Flag as unresolved"
                        >
                            🚫 Re-open
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};

export default IssueCard;
