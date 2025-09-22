import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { getStudentDashboard } from '../../services/api';
import StatsCard from '../Common/StatsCard';
import LoadingSpinner from '../Common/LoadingSpinner';
import { formatDateTime, timeAgo } from '../../utils/helpers';
import { LineChart, Line, XAxis, YAxis, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import io from 'socket.io-client';
import './StudentDashboard.css';

const StudentDashboard = () => {
  const { user } = useAuth();
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [socket, setSocket] = useState(null);

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
      // Mock data for demonstration - replace with real API call
      const mockData = {
        user: {
          name: user?.name,
          userId: user?.userId,
          department: 'Computer Science',
          year: 3,
          semester: 5
        },
        stats: {
          attendancePercentage: 87,
          totalClasses: 45,
          presentClasses: 39,
          currentStreak: 5,
          totalPoints: 1250
        },
        currentLocation: {
          location: 'classroom',
          locationName: 'Computer Lab A101',
          timestamp: new Date(Date.now() - 30 * 60 * 1000)
        },
        recentActivity: [
          {
            action: 'entry',
            locationName: 'Computer Lab A101',
            timestamp: new Date(Date.now() - 30 * 60 * 1000)
          },
          {
            action: 'exit',
            locationName: 'Library',
            timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000)
          },
          {
            action: 'entry',
            locationName: 'Library',
            timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000)
          },
          {
            action: 'entry',
            locationName: 'Main Mess',
            timestamp: new Date(Date.now() - 6 * 60 * 60 * 1000)
          },
          {
            action: 'exit',
            locationName: 'Hostel Block A',
            timestamp: new Date(Date.now() - 8 * 60 * 60 * 1000)
          }
        ],
        upcomingExams: [
          {
            examName: 'Data Structures Mid Term',
            subject: 'Data Structures',
            examDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
            startTime: '09:00 AM',
            examHall: 'Hall A'
          },
          {
            examName: 'Database Systems Quiz',
            subject: 'Database Management',
            examDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
            startTime: '02:00 PM',
            examHall: 'Lab B201'
          },
          {
            examName: 'Operating Systems Final',
            subject: 'Operating Systems',
            examDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
            startTime: '10:00 AM',
            examHall: 'Hall C'
          }
        ],
        messLogs: [
          { mealType: 'breakfast', timestamp: new Date(), cost: 25, messName: 'Main Mess' },
          { mealType: 'lunch', timestamp: new Date(), cost: 45, messName: 'Main Mess' },
          { mealType: 'dinner', timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000), cost: 40, messName: 'Main Mess' },
          { mealType: 'breakfast', timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000), cost: 25, messName: 'Main Mess' },
          { mealType: 'lunch', timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000), cost: 45, messName: 'Main Mess' }
        ],
        badges: [
          {
            badgeName: 'Perfect Attendance',
            description: 'Attended all classes this week',
            icon: '🎯',
            earnedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000)
          },
          {
            badgeName: 'Early Bird',
            description: 'First to enter classroom 5 times',
            icon: '🌅',
            earnedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000)
          },
          {
            badgeName: 'Library Champion',
            description: 'Spent 20+ hours in library this week',
            icon: '📚',
            earnedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
          }
        ],
        leaderboard: {
          rank: 15,
          level: 3
        }
      };
      setDashboardData(mockData);
    } catch (error) {
      console.error('Dashboard fetch error:', error);
    } finally {
      setLoading(false);
    }
  };

  const setupSocketConnection = () => {
    const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';
    const newSocket = io(API_URL);
    newSocket.emit('join-dashboard', 'student');
    
    newSocket.on('location-update', (data) => {
      if (data.userId === user?.userId) {
        setDashboardData(prev => ({
          ...prev,
          currentLocation: {
            location: data.location,
            locationName: data.locationName,
            timestamp: data.timestamp
          }
        }));
      }
    });

    setSocket(newSocket);
  };

  if (loading) {
    return <LoadingSpinner message="Loading dashboard..." />;
  }

  if (!dashboardData) {
    return (
      <div className="dashboard-error">
        <h2>No data available</h2>
        <p>Please try refreshing the page</p>
        <button onClick={fetchDashboardData} className="btn btn-primary">
          Refresh
        </button>
      </div>
    );
  }

  const { stats, currentLocation, recentActivity, upcomingExams, messLogs, badges } = dashboardData;

  // Sample data for charts
  const attendanceData = [
    { day: 'Mon', percentage: 85 },
    { day: 'Tue', percentage: 92 },
    { day: 'Wed', percentage: 78 },
    { day: 'Thu', percentage: 88 },
    { day: 'Fri', percentage: 95 },
    { day: 'Sat', percentage: 82 }
  ];

  const mealData = [
    { name: 'Breakfast', value: messLogs?.filter(log => log.mealType === 'breakfast').length || 0 },
    { name: 'Lunch', value: messLogs?.filter(log => log.mealType === 'lunch').length || 0 },
    { name: 'Dinner', value: messLogs?.filter(log => log.mealType === 'dinner').length || 0 }
  ];

  const COLORS = ['#3b82f6', '#22c55e', '#f59e0b'];

  return (
    <div className="dashboard-container">
      {/* Header */}
      <div className="dashboard-header text-center">
        <h1 className="dashboard-title">Welcome back, {user?.name}!</h1>
        <p className="dashboard-subtitle">
          {user?.userId} • {dashboardData?.user?.department} • Year {dashboardData?.user?.year}
        </p>
      </div>

      {/* Stats Cards */}
      <div className="stats-grid">
        <StatsCard
          title="Attendance"
          value={`${stats?.attendancePercentage || 0}%`}
          subtitle={`${stats?.presentClasses || 0}/${stats?.totalClasses || 0} classes`}
          icon="✓"
          color="success"
        />
        
        <StatsCard
          title="Current Location"
          value={currentLocation?.locationName || 'Unknown'}
          subtitle={currentLocation ? timeAgo(currentLocation.timestamp) : 'No recent activity'}
          icon="📍"
          color="primary"
        />
        
        <StatsCard
          title="Streak"
          value={`${stats?.currentStreak || 0} Days`}
          subtitle="Attendance streak"
          icon="🔥"
          color="warning"
        />
        
        <StatsCard
          title="Points"
          value={stats?.totalPoints || 0}
          subtitle={`Level ${dashboardData?.leaderboard?.level || 1}`}
          icon="⭐"
          color="primary"
        />
      </div>

      <div className="dashboard-grid">
        {/* Attendance Chart */}
        <div className="chart-container">
          <h2 className="chart-title">Weekly Attendance</h2>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={attendanceData}>
              <XAxis dataKey="day" />
              <YAxis />
              <Line 
                type="monotone" 
                dataKey="percentage" 
                stroke="var(--primary-500)" 
                strokeWidth={3}
                dot={{ fill: 'var(--primary-500)', strokeWidth: 2, r: 4 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Recent Activity */}
        <div className="activity-feed">
          <div className="activity-header">
            <h2 className="chart-title">Recent Activity</h2>
          </div>
          <div className="activity-list">
            {recentActivity?.slice(0, 10).map((activity, index) => (
              <div key={index} className="activity-item">
                <div className={`activity-icon ${activity.action}`}></div>
                <div className="activity-text">
                  {activity.action === 'entry' ? 'Entered' : 'Exited'} {activity.locationName}
                </div>
                <div className="activity-time">
                  {timeAgo(activity.timestamp)}
                </div>
              </div>
            ))}
            {(!recentActivity || recentActivity.length === 0) && (
              <div className="no-activity">
                <p>No recent activity</p>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="dashboard-grid">
        {/* Meal Distribution */}
        <div className="chart-container">
          <h2 className="chart-title">Weekly Meals</h2>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={mealData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, value }) => `${name}: ${value}`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {mealData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Upcoming Exams */}
        <div className="exams-container">
          <div className="exams-header">
            <h2 className="chart-title">Upcoming Exams</h2>
          </div>
          <div className="exams-list">
            {upcomingExams?.slice(0, 5).map((exam, index) => (
              <div key={index} className="exam-item">
                <div className="exam-info">
                  <h3 className="exam-name">{exam.examName}</h3>
                  <p className="exam-subject">{exam.subject}</p>
                  <p className="exam-details">
                    {formatDateTime(exam.examDate)} • {exam.examHall}
                  </p>
                </div>
                <div className="exam-status">
                  <span className="badge badge-primary">Scheduled</span>
                </div>
              </div>
            ))}
            {(!upcomingExams || upcomingExams.length === 0) && (
              <div className="no-exams">
                <p>No upcoming exams</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Badges Section */}
      {badges && badges.length > 0 && (
        <div className="badges-container">
          <h2 className="chart-title">Achievements</h2>
          <div className="badges-grid">
            {badges.map((badge, index) => (
              <div key={index} className="badge-item">
                <div className="badge-icon">{badge.icon || '🏆'}</div>
                <div className="badge-info">
                  <h3 className="badge-name">{badge.badgeName}</h3>
                  <p className="badge-description">{badge.description}</p>
                  <p className="badge-date">{timeAgo(badge.earnedAt)}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default StudentDashboard;
