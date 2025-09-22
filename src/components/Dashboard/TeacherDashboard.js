import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { getTeacherDashboard } from '../../services/api';
import StatsCard from '../Common/StatsCard';
import LoadingSpinner from '../Common/LoadingSpinner';
import { formatDateTime, timeAgo } from '../../utils/helpers';
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, LineChart, Line } from 'recharts';
import './TeacherDashboard.css';

const TeacherDashboard = () => {
  const { user } = useAuth();
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      // Mock data for teacher dashboard - replace with real API call
      const mockData = {
        user: {
          name: user?.name,
          employeeId: 'T001',
          department: 'Computer Science'
        },
        stats: {
          totalClasses: 12,
          todayClasses: 3,
          totalStudents: 180,
          averageAttendance: 85
        },
        todaySchedule: [
          { 
            time: '09:00 AM', 
            subject: 'Data Structures', 
            classroom: 'A101', 
            enrolled: 45,
            status: 'upcoming'
          },
          { 
            time: '11:00 AM', 
            subject: 'Algorithms', 
            classroom: 'B202', 
            enrolled: 38,
            status: 'in-progress'
          },
          { 
            time: '02:00 PM', 
            subject: 'Database Systems', 
            classroom: 'C301', 
            enrolled: 42,
            status: 'upcoming'
          },
          { 
            time: '04:00 PM', 
            subject: 'Software Engineering', 
            classroom: 'D401', 
            enrolled: 35,
            status: 'upcoming'
          }
        ],
        classPerformance: [
          { subject: 'Data Structures', attendance: 88, avgMarks: 78 },
          { subject: 'Algorithms', attendance: 82, avgMarks: 85 },
          { subject: 'Database Systems', attendance: 90, avgMarks: 82 },
          { subject: 'Software Engineering', attendance: 85, avgMarks: 76 }
        ],
        weeklyAttendance: [
          { day: 'Mon', attendance: 85 },
          { day: 'Tue', attendance: 88 },
          { day: 'Wed', attendance: 92 },
          { day: 'Thu', attendance: 86 },
          { day: 'Fri', attendance: 89 },
          { day: 'Sat', attendance: 83 }
        ],
        recentActivities: [
          {
            action: 'Created Quiz',
            subject: 'Data Structures',
            timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000)
          },
          {
            action: 'Updated Syllabus',
            subject: 'Algorithms',
            timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000)
          },
          {
            action: 'Graded Assignments',
            subject: 'Database Systems',
            timestamp: new Date(Date.now() - 6 * 60 * 60 * 1000)
          },
          {
            action: 'Posted Announcement',
            subject: 'Software Engineering',
            timestamp: new Date(Date.now() - 8 * 60 * 60 * 1000)
          },
          {
            action: 'Uploaded Materials',
            subject: 'Data Structures',
            timestamp: new Date(Date.now() - 12 * 60 * 60 * 1000)
          }
        ]
      };
      setDashboardData(mockData);
    } catch (error) {
      console.error('Dashboard fetch error:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <LoadingSpinner message="Loading teacher dashboard..." />;
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

  const { stats, todaySchedule, classPerformance, weeklyAttendance, recentActivities } = dashboardData;

  return (
    <div className="dashboard-container">
      {/* Header */}
      <div className="dashboard-header text-center">
        <h1 className="dashboard-title">Teacher Dashboard</h1>
        <p className="dashboard-subtitle">
          {user?.name} • {dashboardData.user?.employeeId} • {dashboardData.user?.department}
        </p>
      </div>

      {/* Stats Cards */}
      <div className="stats-grid">
        <StatsCard
          title="Total Classes"
          value={stats?.totalClasses || 0}
          subtitle="This semester"
          icon="📚"
          color="primary"
        />
        
        <StatsCard
          title="Today's Classes"
          value={stats?.todayClasses || 0}
          subtitle="Scheduled for today"
          icon="📅"
          color="success"
        />
        
        <StatsCard
          title="Total Students"
          value={stats?.totalStudents || 0}
          subtitle="Across all classes"
          icon="👥"
          color="warning"
        />
        
        <StatsCard
          title="Avg Attendance"
          value={`${stats?.averageAttendance || 0}%`}
          subtitle="This month"
          icon="✓"
          color="success"
        />
      </div>

      <div className="dashboard-grid">
        {/* Today's Schedule */}
        <div className="schedule-container">
          <div className="schedule-header">
            <h2 className="chart-title">Today's Schedule</h2>
          </div>
          <div className="schedule-list">
            {todaySchedule?.map((class_, index) => (
              <div key={index} className="schedule-item">
                <div className="schedule-time">
                  <span className={`time-text ${class_.status}`}>{class_.time}</span>
                </div>
                <div className="schedule-info">
                  <h3 className="schedule-subject">{class_.subject}</h3>
                  <p className="schedule-details">
                    {class_.classroom} • {class_.enrolled} students
                  </p>
                </div>
                <div className="schedule-actions">
                  <button className="btn btn-sm btn-primary">
                    View Attendance
                  </button>
                </div>
              </div>
            ))}
            {(!todaySchedule || todaySchedule.length === 0) && (
              <div className="no-schedule">
                <p>No classes scheduled for today</p>
              </div>
            )}
          </div>
        </div>

        {/* Class Performance Chart */}
        <div className="chart-container">
          <h2 className="chart-title">Class Attendance Performance</h2>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={classPerformance}>
              <XAxis 
                dataKey="subject" 
                tick={{ fontSize: 12 }}
                angle={-45}
                textAnchor="end"
                height={80}
              />
              <YAxis />
              <Bar dataKey="attendance" fill="var(--primary-500)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="dashboard-grid">
        {/* Weekly Attendance Trend */}
        <div className="chart-container">
          <h2 className="chart-title">Weekly Attendance Trend</h2>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={weeklyAttendance}>
              <XAxis dataKey="day" />
              <YAxis />
              <Line 
                type="monotone" 
                dataKey="attendance" 
                stroke="var(--success-500)" 
                strokeWidth={3}
                dot={{ fill: 'var(--success-500)', strokeWidth: 2, r: 4 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Recent Activities */}
        <div className="activities-container">
          <div className="activities-header">
            <h2 className="chart-title">Recent Activities</h2>
          </div>
          <div className="activities-list">
            {recentActivities?.slice(0, 8).map((activity, index) => (
              <div key={index} className="activity-item">
                <div className="activity-icon">
                  {activity.action.includes('Quiz') ? '📝' :
                   activity.action.includes('Syllabus') ? '📋' :
                   activity.action.includes('Graded') ? '✅' :
                   activity.action.includes('Announcement') ? '📢' :
                   activity.action.includes('Uploaded') ? '📤' : '📚'}
                </div>
                <div className="activity-info">
                  <h3 className="activity-action">{activity.action}</h3>
                  <p className="activity-subject">{activity.subject}</p>
                  <p className="activity-time">{timeAgo(activity.timestamp)}</p>
                </div>
              </div>
            ))}
            {(!recentActivities || recentActivities.length === 0) && (
              <div className="no-activities">
                <p>No recent activities</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="actions-container">
        <h2 className="chart-title">Quick Actions</h2>
        <div className="actions-grid">
          <button className="action-card">
            <div className="action-icon">📊</div>
            <div className="action-text">
              <h3>Generate Reports</h3>
              <p>Create attendance and performance reports</p>
            </div>
          </button>
          
          <button className="action-card">
            <div className="action-icon">✏️</div>
            <div className="action-text">
              <h3>Manual Attendance</h3>
              <p>Mark attendance manually</p>
            </div>
          </button>
          
          <button className="action-card">
            <div className="action-icon">📝</div>
            <div className="action-text">
              <h3>Create Exam</h3>
              <p>Schedule new examinations</p>
            </div>
          </button>
          
          <button className="action-card">
            <div className="action-icon">👥</div>
            <div className="action-text">
              <h3>Manage Students</h3>
              <p>View and manage enrolled students</p>
            </div>
          </button>
          
          <button className="action-card">
            <div className="action-icon">📚</div>
            <div className="action-text">
              <h3>Course Materials</h3>
              <p>Upload and manage course content</p>
            </div>
          </button>
          
          <button className="action-card">
            <div className="action-icon">💬</div>
            <div className="action-text">
              <h3>Announcements</h3>
              <p>Send notifications to students</p>
            </div>
          </button>
        </div>
      </div>
    </div>
  );
};

export default TeacherDashboard;
