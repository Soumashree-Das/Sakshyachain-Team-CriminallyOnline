import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(sessionStorage.getItem('sakshya_jwt_token') || null);
  const [allUsers, setAllUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch available personas for user switcher
  const fetchPersonas = async () => {
    try {
      const res = await api.get('/auth/users');
      setAllUsers(res.data.users || []);
    } catch (err) {
      console.error('Failed to fetch personas:', err);
    }
  };

  // Verify active JWT token on startup
  const verifyToken = async () => {
    if (!token) {
      setUser(null);
      setLoading(false);
      return;
    }

    try {
      const res = await api.get('/auth/me');
      setUser(res.data.user);
      setError(null);
    } catch (err) {
      console.warn('JWT invalid or expired, returning to login screen...');
      sessionStorage.removeItem('sakshya_jwt_token');
      setToken(null);
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const beginCredentialLogin = async (credentials, portal) => {
    setLoading(true);
    setError(null);
    try {
      sessionStorage.removeItem('sakshya_jwt_token');
      sessionStorage.removeItem('sakshya_refresh_token');
      setToken(null);
      setUser(null);

      const res = await api.post('/auth/login', { ...credentials, portal }, {
        headers: { Authorization: '' }
      });
      return res.data;
    } catch (err) {
      const errMsg = err.response?.data?.message || 'Authentication failed';
      setError(errMsg);
      throw new Error(errMsg);
    } finally {
      setLoading(false);
    }
  };

  const loginWithEmployeeCredentials = (username, password) => beginCredentialLogin({ username, password }, 'EMPLOYEE');
  const loginWithITAdminCredentials = (username, password, secretCode) => beginCredentialLogin({ username, password, secretCode }, 'IT_ADMIN');

  const verifyLoginOTP = async (challengeId, otp) => {
    setLoading(true);
    setError(null);
    try {
      sessionStorage.removeItem('sakshya_jwt_token');
      sessionStorage.removeItem('sakshya_refresh_token');
      setToken(null);
      setUser(null);

      const res = await api.post('/auth/verify-login-otp', { challengeId, otp }, {
        headers: { Authorization: '' }
      });
      const { token: jwtToken, accessToken, refreshToken, user: userObj } = res.data;
      const accessJwt = accessToken || jwtToken;
      sessionStorage.setItem('sakshya_jwt_token', accessJwt);
      if (refreshToken) sessionStorage.setItem('sakshya_refresh_token', refreshToken);
      setToken(accessJwt);
      setUser(userObj);
      return userObj;
    } catch (err) {
      const errMsg = err.response?.data?.message || 'Authentication failed';
      setError(errMsg);
      throw new Error(errMsg);
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    sessionStorage.removeItem('sakshya_jwt_token');
    sessionStorage.removeItem('sakshya_refresh_token');
    setToken(null);
    setUser(null);
  };

  const isITAdmin = user?.systemRole === 'IT_ADMIN';
  const isSupervisor = user && ['JUDICIAL_MAGISTRATE', 'COMPLIANCE_AUDITOR'].includes(user.role);
  const isBreakGlassSupervisor = user?.role === 'SUPERVISOR';
  const isBoss = isSupervisor;
  const isEmployee = user && !isITAdmin;

  useEffect(() => {
    fetchPersonas();
    verifyToken();
  }, []);

  useEffect(() => {
    const handleAuthExpired = () => {
      sessionStorage.removeItem('sakshya_jwt_token');
      sessionStorage.removeItem('sakshya_refresh_token');
      setToken(null);
      setUser(null);
      setError('Your sign-in session expired. Please sign in again.');
    };
    window.addEventListener('sakshya-auth-expired', handleAuthExpired);
    return () => window.removeEventListener('sakshya-auth-expired', handleAuthExpired);
  }, []);

  useEffect(() => {
    const handleFrozenAccount = event => {
      sessionStorage.removeItem('sakshya_jwt_token');
      sessionStorage.removeItem('sakshya_refresh_token');
      setToken(null);
      setUser(null);
      setError(event.detail || 'This account is temporarily frozen after a security incident.');
    };
    window.addEventListener('sakshya-account-frozen', handleFrozenAccount);
    return () => window.removeEventListener('sakshya-account-frozen', handleFrozenAccount);
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        allUsers,
        loading,
        error,
        isBoss,
        isITAdmin,
        isSupervisor,
        isBreakGlassSupervisor,
        isEmployee,
        loginWithITAdminCredentials,
        loginWithEmployeeCredentials,
        verifyLoginOTP,
        logout,
        refreshPersonas: fetchPersonas
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
