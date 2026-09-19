import React, { createContext, useState, useEffect } from 'react';
import api from '../utils/api';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Load profile if token exists on boot
  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem('railverse_token');
      if (token) {
        try {
          const res = await api.get('/auth/profile');
          setUser(res.data);
        } catch (err) {
          console.error('Session expired or invalid.');
          logout();
        }
      }
      setLoading(false);
    };
    checkAuth();
  }, []);

  const login = async (username, password) => {
    const res = await api.post('/auth/login', { username, password });
    localStorage.setItem('railverse_token', res.data.token);
    setUser(res.data.user);
    return res.data;
  };

  const adminLogin = async (username, password) => {
    const res = await api.post('/auth/admin/login', { username, password });
    localStorage.setItem('railverse_token', res.data.token);
    setUser(res.data.admin);
    return res.data;
  };

  const logout = () => {
    localStorage.removeItem('railverse_token');
    setUser(null);
  };

  const refreshProfile = async () => {
    try {
      const res = await api.get('/auth/profile');
      setUser(res.data);
    } catch (err) {
      console.error('Error refreshing profile', err);
    }
  };

  const addFunds = async (amount) => {
    const res = await api.post('/auth/wallet/add', { amount });
    setUser(prev => ({
      ...prev,
      wallet_balance: res.data.wallet_balance
    }));
    return res.data;
  };

  return (
    <AuthContext.Provider value={{ user, setUser, loading, login, adminLogin, logout, addFunds, refreshProfile }}>
      {children}
    </AuthContext.Provider>
  );
};
