import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { getWardenDashboard } from '../../services/api';
import StatsCard from '../Common/StatsCard';
import LoadingSpinner from '../Common/LoadingSpinner';
import { formatDateTime, timeAgo } from '../../utils/helpers';
import io from 'socket.io-client';
import './WardenDashboard.css';

const WardenDashboard = () => {
  const { user } = useAuth();
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [socket, setSocket] = useState(null);
  const [liveLocations, setLiveLocations] = useState([]);

  useEffect(() => {
    fetchDashboardData();
    setupSocketConnection();

    return () => {
      if (socket) {
        socket.disconnect();
      }
    };
  }, []);

  const fetchDashboardData = async () => {
    try {
      const mockData = {
        user: {
          name: user?.name,
          employeeId: 'W001',
          hostelName: 'Boys Hostel 1'
        },
        stats: {
          studentsOnCampus: 245,
          studentsOutside: 15,
          totalEntriesToday: 350,
          activeAlerts: 2
        },
        alerts: [
          {
            userId: 'RA21CSE001',
            userName: 'John Doe',
            message: 'Left campus late at night',
            timestamp: new Date(),
            type: 'unusual_timing',
            severity: 'medium'
          },
          {
            userId: 'RA21CSE045',
            userName: 'Jane Smith',
            message: 'Multiple failed hostel access attempts',
            timestamp: new Date(Date.now() - 30 * 60 * 1000),
            type: 'security',
            severity: 'high'
          }
        ]
      };
      setDashboardData(mockData);
      
      setLiveLocations([
        {
          userId: 'RA21CSE001',
          userName: 'John Doe',
          location: 'library',
          locationName: 'Main Library',
          action: 'entry',
          timestamp: new Date(Date.now() - 5 * 60 * 1000)
        },
        {
          userId: 'RA21CSE002',
          userName: 'Jane Smith',
          location: 'mess',
          locationName: 'Main Mess',
          action: 'entry',
          timestamp: new Date(Date.now() - 10 * 60 * 1000)
        },
        {
          userId: 'RA21CSE003',
          userName: 'Mike Johnson',
          location: 'gate',
          locationName: 'Main Gate',
          action: 'exit',
          timestamp: new Date(Date.now() - 15 * 60 * 1000)
        }
      ]);
    } catch (error) {
      console.error('Dashboard fetch error:', error);
    } finally {
      setLoading(false);
    }
  };

  const setupSocketConnection = () => {
    const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';
    const newSocket = io(API_URL);
    newSocket.emit('join-dashboard', 'warden');
    
    newSocket.on('location-update', (data) => {
      setLiveLocations(prev => {
        const updated = [data, ...prev.filter(loc => loc.userId !== data.userId)];
        return updated.slice(0, 20);
      });
    });

    setSocket(newSocket);
  };

  if (loading) {
    return <LoadingSpinner message="Loading warden dashboard..." />;
  }

  if (!dashboardData) {
    return (
      <div className="dashboard-error">
        <h2>No data available</h2>
        <p>Please try refreshing the page</p>
      </div>
    );
  }

  const { stats, alerts } = dashboardData;

  return (
    <div className="dashboard-container">
      <div className="dashboard-header text-center">
        <h1 className="dashboard-title">Warden Dashboard</h1>
        <p className="dashboard-subtitle">
          {user?.name} • {dashboardData.user?.hostelName}
        </p>
      </div>

      <div className="stats-grid">
        <StatsCard
          title="Students on Campus"
          value={stats?.studentsOnCampus || 0}
          subtitle="Currently present"
          icon="🏫"
          color="success"
        />
        
        <StatsCard
          title="Students Outside"
          value={stats?.studentsOutside || 0}
          subtitle="Not on campus"
          icon="🚪"
          color="warning"
        />
        
        <StatsCard
          title="Today's Entries"
          value={stats?.totalEntriesToday || 0}
          subtitle="Total campus entries"
          icon="📊"
          color="primary"
        />
        
        <StatsCard
          title="Active Alerts"
          value={stats?.activeAlerts || 0}
          subtitle="Requires attention"
          icon="⚠️"
          color="danger"
        />
      </div>

      <div className="dashboard-grid">
        <div className="locations-container">
          <div className="locations-header">
            <h2 className="chart-title">Live Student Locations</h2>
            <span className="live-indicator">● LIVE</span>
          </div>
          <div className="locations-table">
            <div className="table-header">
              <div className="table-cell">Student</div>
              <div className="table-cell">Location</div>
              <div className="table-cell">Action</div>
              <div className="table-cell">Time</div>
            </div>
            <div className="table-body">
              {liveLocations.length > 0 ? liveLocations.map((location, index) => (
                <div key={index} className="table-row">
                  <div className="table-cell">
                    <div className="student-info">
                      <span className="student-name">{location.userName}</span>
                      <span className="student-id">{location.userId}</span>
                    </div>
                  </div>
                  <div className="table-cell">
                    <span className="location-name">{location.locationName}</span>
                  </div>
                  <div className="table-cell">
                    <span className={`action-badge ${location.action}`}>
                      {location.action === 'entry' ? 'Entry' : 'Exit'}
                    </span>
                  </div>
                  <div className="table-cell">
                    <span className="time-text">{timeAgo(location.timestamp)}</span>
                  </div>
                </div>
              )) : (
                <div className="no-data">
                  <p>No recent location updates</p>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="alerts-container">
          <div className="alerts-header">
            <h2 className="chart-title">Security Alerts</h2>
          </div>
          <div className="alerts-list">
            {alerts?.map((alert, index) => (
              <div key={index} className={`alert-item ${alert.severity}`}>
                <div className="alert-icon">
                  {alert.severity === 'high' ? '🚨' : 
                   alert.severity === 'medium' ? '⚠️' : 'ℹ️'}
                </div>
                <div className="alert-content">
                  <div className="alert-header">
                    <span className="alert-student">{alert.userName}</span>
                    <span className="alert-time">{timeAgo(alert.timestamp)}</span>
                  </div>
                  <p className="alert-message">{alert.message}</p>
                  <p className="alert-id">Student ID: {alert.userId}</p>
                </div>
                <div className="alert-actions">
                  <button className="btn btn-sm btn-primary">View Details</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="actions-container">
        <h2 className="chart-title">Quick Actions</h2>
        <div className="actions-grid">
          <button className="action-card">
            <div className="action-icon">👥</div>
            <div className="action-text">
              <h3>Student Search</h3>
              <p>Find and track specific students</p>
            </div>
          </button>
          
          <button className="action-card">
            <div className="action-icon">🚨</div>
            <div className="action-text">
              <h3>Emergency Alert</h3>
              <p>Send emergency notifications</p>
            </div>
          </button>
          
          <button className="action-card">
            <div className="action-icon">📊</div>
            <div className="action-text">
              <h3>Generate Report</h3>
              <p>Create location and safety reports</p>
            </div>
          </button>
          
          <button className="action-card">
            <div className="action-icon">⚙️</div>
            <div className="action-text">
              <h3>System Settings</h3>
              <p>Configure alerts and permissions</p>
            </div>
          </button>
        </div>
      </div>
    </div>
  );
};

export default WardenDashboard;
