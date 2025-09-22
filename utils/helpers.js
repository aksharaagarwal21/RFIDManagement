// Date formatting utilities
const formatDate = (date, format = 'YYYY-MM-DD') => {
  if (!date) return '';
  
  const d = new Date(date);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  
  switch (format) {
    case 'YYYY-MM-DD':
      return `${year}-${month}-${day}`;
    case 'DD/MM/YYYY':
      return `${day}/${month}/${year}`;
    case 'MM/DD/YYYY':
      return `${month}/${day}/${year}`;
    default:
      return `${year}-${month}-${day}`;
  }
};

const formatDateTime = (date, format = 'YYYY-MM-DD HH:mm') => {
  if (!date) return '';
  
  const d = new Date(date);
  const dateStr = formatDate(d);
  const hours = String(d.getHours()).padStart(2, '0');
  const minutes = String(d.getMinutes()).padStart(2, '0');
  
  return `${dateStr} ${hours}:${minutes}`;
};

const timeAgo = (date) => {
  if (!date) return '';
  
  const now = new Date();
  const diff = now - new Date(date);
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  const weeks = Math.floor(days / 7);
  const months = Math.floor(days / 30);
  const years = Math.floor(days / 365);

  if (seconds < 60) return 'just now';
  if (minutes < 60) return `${minutes} minute${minutes !== 1 ? 's' : ''} ago`;
  if (hours < 24) return `${hours} hour${hours !== 1 ? 's' : ''} ago`;
  if (days < 7) return `${days} day${days !== 1 ? 's' : ''} ago`;
  if (weeks < 4) return `${weeks} week${weeks !== 1 ? 's' : ''} ago`;
  if (months < 12) return `${months} month${months !== 1 ? 's' : ''} ago`;
  return `${years} year${years !== 1 ? 's' : ''} ago`;
};

// Pagination helper
const getPaginationData = (page, limit, total) => {
  const pageNum = parseInt(page) || 1;
  const limitNum = parseInt(limit) || 20;
  const skip = (pageNum - 1) * limitNum;
  const totalPages = Math.ceil(total / limitNum);

  return {
    page: pageNum,
    limit: limitNum,
    skip,
    totalPages,
    hasNextPage: pageNum < totalPages,
    hasPrevPage: pageNum > 1,
    nextPage: pageNum < totalPages ? pageNum + 1 : null,
    prevPage: pageNum > 1 ? pageNum - 1 : null
  };
};

// Generate random string
const generateRandomString = (length = 10) => {
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  
  for (let i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  
  return result;
};

// Calculate percentage
const calculatePercentage = (part, whole, decimals = 2) => {
  if (!whole || whole === 0) return 0;
  return Math.round((part / whole) * 100 * Math.pow(10, decimals)) / Math.pow(10, decimals);
};

// Validate email format
const isValidEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

// Validate phone number format
const isValidPhone = (phone) => {
  const phoneRegex = /^[\+]?[0-9\s\-\(\)]{10,}$/;
  return phoneRegex.test(phone);
};

// Sanitize string for database queries
const sanitizeString = (str) => {
  if (typeof str !== 'string') return str;
  return str.trim().replace(/[<>]/g, '');
};

// Format currency
const formatCurrency = (amount, currency = 'INR') => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: currency
  }).format(amount);
};

// Get current academic year
const getCurrentAcademicYear = () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + 1;
  
  // Academic year starts in July (month 7)
  if (month >= 7) {
    return `${year}-${year + 1}`;
  } else {
    return `${year - 1}-${year}`;
  }
};

// Get current semester
const getCurrentSemester = () => {
  const now = new Date();
  const month = now.getMonth() + 1;
  
  // Odd semesters: July-November (7-11)
  // Even semesters: December-June (12, 1-6)
  if (month >= 7 && month <= 11) {
    return 'odd'; // 1, 3, 5, 7
  } else {
    return 'even'; // 2, 4, 6, 8
  }
};

// Calculate grade from percentage
const calculateGrade = (percentage) => {
  if (percentage >= 90) return { grade: 'A+', gpa: 10.0 };
  if (percentage >= 80) return { grade: 'A', gpa: 9.0 };
  if (percentage >= 70) return { grade: 'B+', gpa: 8.0 };
  if (percentage >= 60) return { grade: 'B', gpa: 7.0 };
  if (percentage >= 50) return { grade: 'C+', gpa: 6.0 };
  if (percentage >= 40) return { grade: 'C', gpa: 5.0 };
  return { grade: 'F', gpa: 0.0 };
};

// Convert 24-hour time to 12-hour format
const formatTime12Hour = (time24) => {
  if (!time24) return '';
  
  const [hours, minutes] = time24.split(':');
  const hour12 = hours % 12 || 12;
  const ampm = hours < 12 ? 'AM' : 'PM';
  
  return `${hour12}:${minutes} ${ampm}`;
};

// Get day name from date
const getDayName = (date) => {
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  return days[new Date(date).getDay()];
};

// Deep clone object
const deepClone = (obj) => {
  return JSON.parse(JSON.stringify(obj));
};

// Capitalize first letter
const capitalize = (str) => {
  if (!str) return '';
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
};

// Generate RFID card ID
const generateRfidCardId = () => {
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substr(2, 4).toUpperCase();
  return `RFC${timestamp}${random}`;
};

module.exports = {
  formatDate,
  formatDateTime,
  timeAgo,
  getPaginationData,
  generateRandomString,
  calculatePercentage,
  isValidEmail,
  isValidPhone,
  sanitizeString,
  formatCurrency,
  getCurrentAcademicYear,
  getCurrentSemester,
  calculateGrade,
  formatTime12Hour,
  getDayName,
  deepClone,
  capitalize,
  generateRfidCardId
};
