import { useState, useEffect, useContext } from 'react';
import { getIssues } from '../utils/api';
import { AuthContext } from '../utils/AuthContext';
import IssueCard from '../components/IssueCard';
import { io } from 'socket.io-client';
import './ListView.css';

const ListView = () => {
    const [issues, setIssues] = useState([]);
    const [filter, setFilter] = useState('All');
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

        return () => socket.disconnect();
    }, []);

    const fetchIssues = async () => {
        try {
            const { data } = await getIssues();

            // Filter issues based on user role
            if (user?.role === 'representative') {
                // Representatives only see issues tagged to them
                const myIssues = data.filter(issue =>
                    issue.taggedRepresentative?._id === user.id
                );
                setIssues(myIssues);
            } else {
                // Citizens see all issues
                setIssues(data);
            }
        } catch (_err) {
            console.error('Failed to fetch issues');
        } finally {
            setLoading(false);
        }
    };

    const filteredIssues = filter === 'All'
        ? issues
        : issues.filter((issue) => issue.status === filter);

    if (loading) {
        return (
            <div className="loading-container">
                <div className="spinner"></div>
            </div>
        );
    }

    return (
        <div className="list-view">
            <div className="list-header">
                <h1>{user?.role === 'representative' ? 'My Assigned Issues' : 'Civic Issues'}</h1>
                <p>{user?.role === 'representative'
                    ? `📋 ${issues.length} issues assigned to you`
                    : `📋 ${issues.length} total issues`}
                </p>
                <div className="filter-buttons">
                    {['All', 'Reported', 'In Progress', 'Resolved'].map(status => (
                        <button
                            key={status}
                            className={filter === status ? 'active' : ''}
                            onClick={() => setFilter(status)}
                        >
                            {status}
                        </button>
                    ))}
                </div>
            </div>

            {filteredIssues.length === 0 ? (
                <div className="no-issues">
                    <p>No issues found.</p>
                </div>
            ) : (
                <div className="issues-grid">
                    {filteredIssues.map((issue, index) => (
                        <IssueCard
                            key={issue._id}
                            issue={issue}
                            currentUser={user}
                            style={{ animationDelay: `${index * 0.1}s` }}
                        />
                    ))}
                </div>
            )}
        </div>
    );
};

export default ListView;
