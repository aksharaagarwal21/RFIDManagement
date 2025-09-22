import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import './Header.css';

const Header = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [showDropdown, setShowDropdown] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleProfileClick = () => {
    setShowDropdown(!showDropdown);
  };

  const getRoleDisplayName = (role) => {
    const roleMap = {
      student: 'Student',
      teacher: 'Teacher',
      warden: 'Warden',
      parent: 'Parent',
    };
    return roleMap[role] || role;
  };

  if (!user) return null;

  return (
    <header className="header">
      <div className="header-container">
        <div className="header-brand">
          <div className="brand-logo">
            <div className="logo-icon">🎓</div>
          </div>
          <div className="brand-text">
            <h1 className="brand-title">RFID University</h1>
            <p className="brand-subtitle">{getRoleDisplayName(user.role)} Portal</p>
          </div>
        </div>

        <div className="header-user">
          <div className="notifications">
            <button className="notification-btn">
              <span className="notification-icon">🔔</span>
              <span className="notification-badge">3</span>
            </button>
          </div>

          <div className="user-profile">
            <div className="user-info hidden-mobile">
              <p className="user-name">{user.name}</p>
              <p className="user-id">{user.userId}</p>
            </div>
            
            <div className="user-avatar-container" onClick={handleProfileClick}>
              <img
                className="user-avatar"
                src={user.profileImage || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name)}&background=3b82f6&color=fff`}
                alt={user.name}
              />
              <span className="avatar-dropdown-icon">▾</span>
            </div>

            {showDropdown && (
              <div className="user-dropdown">
                <div className="dropdown-item user-info-mobile">
                  <div>
                    <p className="dropdown-name">{user.name}</p>
                    <p className="dropdown-id">{user.userId}</p>
                  </div>
                </div>
                <div className="dropdown-divider"></div>
                <button className="dropdown-item" onClick={() => setShowDropdown(false)}>
                  <span>👤</span> Profile
                </button>
                <button className="dropdown-item" onClick={() => setShowDropdown(false)}>
                  <span>⚙️</span> Settings
                </button>
                <div className="dropdown-divider"></div>
                <button className="dropdown-item logout-item" onClick={handleLogout}>
                  <span>🚪</span> Logout
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {showDropdown && (
        <div className="dropdown-overlay" onClick={() => setShowDropdown(false)}></div>
      )}
    </header>
  );
};

export default Header;
