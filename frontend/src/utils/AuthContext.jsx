import { createContext, useState } from 'react';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(() => {
        const token = localStorage.getItem('token');
        const role = localStorage.getItem('role');
        const id = localStorage.getItem('userId');
        return (token && role && id) ? { token, role, id } : null;
    });
    const loading = false;

    const loginUser = (token, role, id) => {
        localStorage.setItem('token', token);
        localStorage.setItem('role', role);
        localStorage.setItem('userId', id);
        setUser({ token, role, id });
    };

    const logoutUser = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('role');
        localStorage.removeItem('userId');
        setUser(null);
    };

    return (
        <AuthContext.Provider value={{ user, loginUser, logoutUser, loading }}>
            {children}
        </AuthContext.Provider>
    );
};
