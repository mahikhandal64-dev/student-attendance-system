import React, { createContext, useContext, useState, useEffect } from 'react';
import { api, setAuthToken, setStoredUser, getStoredUser, getAuthToken } from '../services/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => getStoredUser());
  const [token, setToken] = useState(() => getAuthToken());
  const [loading, setLoading] = useState(true);
  const [demoUsers, setDemoUsers] = useState([]);

  // Fetch demo users for the quick-fill buttons
  useEffect(() => {
    api.getDemoUsers()
      .then(users => setDemoUsers(users))
      .catch(err => console.error('Failed to load demo users:', err));
  }, []);

  // Validate session on mount
  useEffect(() => {
    const verifyAuth = async () => {
      const storedToken = getAuthToken();
      if (!storedToken) {
        setLoading(false);
        return;
      }
      try {
        const currentUser = await api.getCurrentUser();
        setUser(currentUser);
        setStoredUser(currentUser);
      } catch (err) {
        console.warn('Session verification failed, clearing auth:', err);
        setToken(null);
        setUser(null);
        setAuthToken(null);
        setStoredUser(null);
      } finally {
        setLoading(false);
      }
    };

    verifyAuth();

    const handleUnauthorized = () => {
      setUser(null);
      setToken(null);
    };

    window.addEventListener('auth:unauthorized', handleUnauthorized);
    return () => window.removeEventListener('auth:unauthorized', handleUnauthorized);
  }, []);

  const login = async (email, password) => {
    const res = await api.login(email, password);
    setToken(res.token);
    setUser(res.user);
    setAuthToken(res.token);
    setStoredUser(res.user);
    return res.user;
  };

  const register = async (userData) => {
    const res = await api.register(userData);
    setToken(res.token);
    setUser(res.user);
    setAuthToken(res.token);
    setStoredUser(res.user);
    return res.user;
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    setAuthToken(null);
    setStoredUser(null);
  };

  // 1-Click quick login as any demo user
  const quickLogin = async (demoUser) => {
    return login(demoUser.email, demoUser.password);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!user,
        isAdmin: user?.role === 'admin',
        isFaculty: user?.role === 'faculty',
        isStudent: user?.role === 'student',
        canMarkAttendance: user?.role === 'admin' || user?.role === 'faculty',
        loading,
        demoUsers,
        login,
        register,
        logout,
        quickLogin,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
