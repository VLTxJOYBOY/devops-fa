import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || '/api';

const api = axios.create({
  baseURL: API_URL,
});

// Interceptor to inject token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('pixora_token') || localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor to handle unauth
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      // Clear token on unauthorized if needed
    }
    return Promise.reject(error);
  }
);

// Auth Endpoints
export const authApi = {
  login: (credentials) => api.post('/auth/login', credentials),
  register: (userData) => api.post('/auth/register', userData),
  getMe: () => api.get('/auth/me'),
};

// Image Endpoints
export const imageApi = {
  getImages: (params = {}) => api.get('/images', { params }),
  searchImages: (q, params = {}) => api.get('/images/search', { params: { q, ...params } }),
  getImageById: (id) => api.get(`/images/${id}`),
  uploadImage: (formData) => api.post('/images', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }),
  deleteImage: (id) => api.delete(`/images/${id}`),
};

// Favorites Endpoints
export const favoriteApi = {
  getFavorites: () => api.get('/favorites'),
  addFavorite: (imageId) => api.post(`/favorites/${imageId}`),
  removeFavorite: (imageId) => api.delete(`/favorites/${imageId}`),
};

// Collections Endpoints
export const collectionApi = {
  getCollections: () => api.get('/collections'),
  createCollection: (data) => api.post('/collections', data),
  getCollectionById: (id) => api.get(`/collections/${id}`),
  updateCollection: (id, data) => api.patch(`/collections/${id}`, data),
  deleteCollection: (id) => api.delete(`/collections/${id}`),
  addImageToCollection: (collectionId, imageId) =>
    api.post(`/collections/${collectionId}/images/${imageId}`),
  removeImageFromCollection: (collectionId, imageId) =>
    api.delete(`/collections/${collectionId}/images/${imageId}`),
};

// User Endpoints
export const userApi = {
  getUserProfile: (id) => api.get(`/users/${id}`),
  getUserImages: (id) => api.get(`/users/${id}/images`),
};

export default api;
