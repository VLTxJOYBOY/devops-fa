import { useState } from 'react';
import { updateIssueStatus, upvoteIssue, reopenIssue } from '../utils/api';
import './IssueCard.css';

const IssueCard = ({ issue, currentUser, style }) => {
    const [resolutionForm, setResolutionForm] = useState(false);
    const [resolutionData, setResolutionData] = useState({ message: '', imageUrl: '' });
    const [upvotes, setUpvotes] = useState(issue.upvotes || []);

    const getStatusColor = (status) => {
        switch (status) {
            case 'Reported': return '#f59e0b';
            case 'In Progress': return '#3b82f6';
            case 'Resolved': return '#10b981';
            case 'Re-opened': return '#ef4444';
            default: return '#6b7280';
        }
    };

    const handleStatusChange = async (newStatus) => {
        if (newStatus === 'Resolved') {
            setResolutionForm(true);
            return;
        }
        try {
            await updateIssueStatus(issue._id, newStatus);
        } catch (_err) {
            alert('Failed to update status');
        }
    };

    const handleUpvote = async () => {
        if (!currentUser) {
            alert('Please login to upvote');
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
        if (!window.confirm('Are you sure this issue is not resolved yet? This will alert the representative.')) return;
        try {
            await reopenIssue(issue._id);
            alert('Issue re-opened successfully. The representative has been notified.');
        } catch (err) {
            alert(err.response?.data?.message || 'Failed to re-open issue');
        }
    };

    const submitResolution = async () => {
        if (!resolutionData.message.trim()) {
            alert('Please provide a resolution message');
            return;
        }
        try {
            await updateIssueStatus(issue._id, 'Resolved', resolutionData);
            setResolutionForm(false);
        } catch (_err) {
            alert('Failed to submit resolution');
        }
    };

    const formatDate = (date) => {
        return new Date(date).toLocaleDateString('en-IN', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    };

    const hasUpvoted = upvotes.includes(currentUser?.id);

    return (
        <div className="issue-card" style={style}>
            <div className="issue-header">
                <div>
                    <h3 className="issue-title">{issue.title}</h3>
                    <span className="issue-category">📍 {issue.category}</span>
                </div>
                <span
                    className="issue-status"
                    style={{ background: getStatusColor(issue.status) }}
                >
                    {issue.status}
                </span>
            </div>

            <p className="issue-description">{issue.description}</p>

            {issue.imageUrl && (
                <img src={issue.imageUrl} alt="Issue" className="issue-image" />
            )}

            <div className="issue-footer">
                <div className="issue-meta">
                    <span>📅 {formatDate(issue.createdAt)}</span>
                    {issue.lat && issue.lng && (
                        <span>📍 {issue.lat.toFixed(4)}, {issue.lng.toFixed(4)}</span>
                    )}
                </div>

                <div className="issue-actions">
                    <button
                        className="upvote-btn"
                        onClick={handleUpvote}
                        disabled={hasUpvoted}
                    >
                        {hasUpvoted ? '✅ Upvoted' : '👍 Upvote'} ({upvotes.length})
                    </button>
                    {issue.status === 'Resolved' && currentUser?.role === 'citizen' && (
                        <button
                            className="reopen-btn"
                            onClick={handleReopen}
                        >
                            🚫 Not Resolved?
                        </button>
                    )}
                </div>
            </div>

            {issue.taggedRepresentative && (
                <div className="tagged-rep">
                    <span>
                        👮 Assigned to: {issue.taggedRepresentative.username} ({issue.taggedRepresentative.designation})
                    </span>
                </div>
            )}

            {issue.status === 'Resolved' && issue.resolution && (
                <div className="resolution-box">
                    <h4>✅ Resolution</h4>
                    <p>"{issue.resolution.message}"</p>
                    {issue.resolution.imageUrl && (
                        <img src={issue.resolution.imageUrl} alt="Resolution" className="resolution-image" />
                    )}
                    <small>Resolved on {formatDate(issue.resolution.resolvedAt)}</small>
                </div>
            )}

            {currentUser?.role === 'representative' && currentUser?.id === issue.taggedRepresentative?._id && issue.status !== 'Resolved' && (
                <div className="status-controls">
                    <select
                        value={issue.status}
                        onChange={(e) => handleStatusChange(e.target.value)}
                        className="status-select"
                    >
                        <option value="Reported">Reported</option>
                        <option value="In Progress">In Progress</option>
                        <option value="Re-opened">Re-opened</option>
                        <option value="Resolved">Resolved</option>
                    </select>
                </div>
            )}

            {resolutionForm && (
                <div className="resolution-form">
                    <h4>Submit Resolution</h4>
                    <textarea
                        placeholder="Describe how the issue was resolved..."
                        value={resolutionData.message}
                        onChange={(e) => setResolutionData({ ...resolutionData, message: e.target.value })}
                        rows="3"
                    />
                    <input
                        type="url"
                        placeholder="Resolution image URL (optional)"
                        value={resolutionData.imageUrl}
                        onChange={(e) => setResolutionData({ ...resolutionData, imageUrl: e.target.value })}
                    />
                    <div className="resolution-actions">
                        <button onClick={submitResolution} className="submit-resolution">Submit</button>
                        <button onClick={() => setResolutionForm(false)} className="cancel-resolution">Cancel</button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default IssueCard;
