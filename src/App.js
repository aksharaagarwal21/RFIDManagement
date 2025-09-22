import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import Login from './components/Auth/Login';
import Register from './components/Auth/Register';
import StudentDashboard from './components/Dashboard/StudentDashboard';
import TeacherDashboard from './components/Dashboard/TeacherDashboard';
import WardenDashboard from './components/Dashboard/WardenDashboard';
import Header from './components/Layout/Header';
import LoadingSpinner from './components/Common/LoadingSpinner';
import './App.css';

const PrivateRoute = ({ children, allowedRoles = [] }) => {
  const { user, isAuthenticated, loading } = useAuth();
  
  if (loading) {
    return <LoadingSpinner />;
  }
  
  if (!isAuthenticated) {
    return <Navigate to="/login" />;
  }
  
  if (allowedRoles.length > 0 && !allowedRoles.includes(user?.role)) {
    return <Navigate to="/unauthorized" />;
  }
  
  return children;
};

const DashboardRouter = () => {
  const { user } = useAuth();
  
  switch (user?.role) {
    case 'student':
      return <StudentDashboard />;
    case 'teacher':
      return <TeacherDashboard />;
    case 'warden':
      return <WardenDashboard />;
    default:
      return <Navigate to="/login" />;
  }
};

const AppContent = () => {
  const { isAuthenticated, loading } = useAuth();
  
  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="page-wrapper">
      {isAuthenticated && <Header />}
      <main className="main-content">
        <Routes>
          <Route 
            path="/login" 
            element={
              isAuthenticated ? <Navigate to="/dashboard" /> : <Login />
            } 
          />
          <Route 
            path="/register" 
            element={
              isAuthenticated ? <Navigate to="/dashboard" /> : <Register />
            } 
          />
          <Route 
            path="/dashboard" 
            element={
              <PrivateRoute>
                <DashboardRouter />
              </PrivateRoute>
            } 
          />
          <Route path="/" element={<Navigate to="/dashboard" />} />
          <Route 
            path="/unauthorized" 
            element={
              <div className="dashboard-error">
                <h1 className="text-4xl font-bold text-danger mb-4">403</h1>
                <h2 className="text-xl font-semibold mb-2">Unauthorized Access</h2>
                <p className="text-gray">You don't have permission to access this page.</p>
                <button 
                  onClick={() => window.location.href = '/dashboard'} 
                  className="btn btn-primary mt-4"
                >
                  Go to Dashboard
                </button>
              </div>
            } 
          />
          <Route 
            path="*" 
            element={
              <div className="dashboard-error">
                <h1 className="text-4xl font-bold text-danger mb-4">404</h1>
                <h2 className="text-xl font-semibold mb-2">Page Not Found</h2>
                <p className="text-gray">The page you're looking for doesn't exist.</p>
                <button 
                  onClick={() => window.location.href = '/dashboard'} 
                  className="btn btn-primary mt-4"
                >
                  Go to Dashboard
                </button>
              </div>
            } 
          />
        </Routes>
      </main>
    </div>
  );
};

function App() {
  return (
    <AuthProvider>
      <Router>
        <AppContent />
      </Router>
    </AuthProvider>
  );
}

export default App;

