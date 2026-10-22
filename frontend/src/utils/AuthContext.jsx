import { createContext, useState, useEffect, useCallback } from 'react';
import { authApi } from './api';

// eslint-disable-next-line react-refresh/only-export-components
export const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const savedUser = localStorage.getItem('pixora_user');
    return savedUser ? JSON.parse(savedUser) : null;
  });
  const [token, setToken] = useState(() => localStorage.getItem('pixora_token') || '');
  const [loading, setLoading] = useState(true);

  const fetchCurrentUser = useCallback(async () => {
    const activeToken = localStorage.getItem('pixora_token');
    if (!activeToken) {
      setUser(null);
      setLoading(false);
      return;
    }

    try {
      const res = await authApi.getMe();
      setUser(res.data);
      localStorage.setItem('pixora_user', JSON.stringify(res.data));
    } catch (_err) {
      // Invalid/expired token
      localStorage.removeItem('pixora_token');
      localStorage.removeItem('pixora_user');
      setUser(null);
      setToken('');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCurrentUser();
  }, [fetchCurrentUser]);

  const login = async (email, password) => {
    const res = await authApi.login({ email, password });
    const { token: receivedToken, user: receivedUser } = res.data;
    localStorage.setItem('pixora_token', receivedToken);
    localStorage.setItem('pixora_user', JSON.stringify(receivedUser));
    setToken(receivedToken);
    setUser(receivedUser);
    return receivedUser;
  };

  const register = async (userData) => {
    const res = await authApi.register(userData);
    const { token: receivedToken, user: receivedUser } = res.data;
    localStorage.setItem('pixora_token', receivedToken);
    localStorage.setItem('pixora_user', JSON.stringify(receivedUser));
    setToken(receivedToken);
    setUser(receivedUser);
    return receivedUser;
  };

  const logout = () => {
    localStorage.removeItem('pixora_token');
    localStorage.removeItem('pixora_user');
    setToken('');
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        isAuthenticated: Boolean(user),
        login,
        register,
        logout,
        refreshUser: fetchCurrentUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
