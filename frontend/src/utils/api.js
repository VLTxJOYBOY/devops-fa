import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || '/api';

// Create axios instance
const api = axios.create({
    baseURL: API_URL,
});

// Add token to requests if available
api.interceptors.request.use((config) => {
    const token = localStorage.getItem('token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

// Auth API
export const register = (username, password) =>
    api.post('/auth/register', { username, password });

export const login = (username, password) =>
    api.post('/auth/login', { username, password });

// Issues API
export const getIssues = () => api.get('/issues');

export const createIssue = (issueData) =>
    api.post('/issues', issueData);

export const upvoteIssue = (id) =>
    api.put(`/issues/${id}/upvote`);

export const getRepresentatives = () => api.get('/auth/representatives');

export const updateIssueStatus = (id, status, resolutionData = {}) =>
    api.put(`/issues/${id}/status`, { status, ...resolutionData });

export const reopenIssue = (id) => api.put(`/issues/${id}/reopen`);

export default api;
