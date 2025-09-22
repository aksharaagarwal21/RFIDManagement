import React, { createContext, useState, useContext, useEffect } from 'react';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(false);

  // Mock login function
  const login = async (email, password) => {
    try {
      setLoading(true);
      
      // Mock authentication - replace with real API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Mock user data based on email
      let mockUser;
      if (email.includes('student')) {
        mockUser = { name: 'John Doe', userId: 'RA21CSE001', role: 'student' };
      } else if (email.includes('teacher')) {
        mockUser = { name: 'Prof. Smith', userId: 'T001', role: 'teacher' };
      } else if (email.includes('warden')) {
        mockUser = { name: 'Mr. Johnson', userId: 'W001', role: 'warden' };
      } else {
        mockUser = { name: 'Demo User', userId: 'DEMO001', role: 'student' };
      }
      
      setUser(mockUser);
      setIsAuthenticated(true);
      localStorage.setItem('token', 'mock-jwt-token');
      
      return { success: true, user: mockUser };
    } catch (error) {
      return { success: false, error: 'Login failed' };
    } finally {
      setLoading(false);
    }
  };

  // Mock register function
  const register = async (userData) => {
    try {
      setLoading(true);
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const mockUser = {
        name: userData.name,
        userId: userData.userId,
        role: userData.role || 'student'
      };
      
      setUser(mockUser);
      setIsAuthenticated(true);
      localStorage.setItem('token', 'mock-jwt-token');
      
      return { success: true, user: mockUser };
    } catch (error) {
      return { success: false, error: 'Registration failed' };
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    setUser(null);
    setIsAuthenticated(false);
  };

  // Check for existing token on app start
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      // Mock user restoration
      const mockUser = { name: 'Demo User', userId: 'DEMO001', role: 'student' };
      setUser(mockUser);
      setIsAuthenticated(true);
    }
  }, []);

  const value = {
    user,
    isAuthenticated,
    loading,
    login,
    register,
    logout
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
