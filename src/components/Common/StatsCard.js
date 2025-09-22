import React from 'react';
import './StatsCard.css';

const StatsCard = ({ 
  title, 
  value, 
  subtitle, 
  icon, 
  color = 'primary', 
  trend = null,
  onClick = null 
}) => {
  const cardClass = `stats-card stats-card-${color} ${onClick ? 'clickable' : ''}`;
  
  return (
    <div className={cardClass} onClick={onClick}>
      <div className="stats-card-content">
        <div className="stats-card-header">
          <div className="stats-card-title">{title}</div>
          {icon && <div className="stats-card-icon">{icon}</div>}
        </div>
        
        <div className="stats-card-value">
          {value}
          {trend && (
            <span className={`stats-card-trend ${trend.type}`}>
              {trend.type === 'up' ? '↗' : '↘'} {trend.value}
            </span>
          )}
        </div>
        
        {subtitle && <div className="stats-card-subtitle">{subtitle}</div>}
      </div>
    </div>
  );
};

export default StatsCard;
