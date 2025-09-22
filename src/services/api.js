// Mock API service for now
const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

// Mock functions that return promises
export const getStudentDashboard = async () => {
  return new Promise(resolve => {
    setTimeout(() => {
      resolve({ success: true, data: {} });
    }, 500);
  });
};

export const getTeacherDashboard = async () => {
  return new Promise(resolve => {
    setTimeout(() => {
      resolve({ success: true, data: {} });
    }, 500);
  });
};

export const getWardenDashboard = async () => {
  return new Promise(resolve => {
    setTimeout(() => {
      resolve({ success: true, data: {} });
    }, 500);
  });
};

export default {
  getStudentDashboard,
  getTeacherDashboard,
  getWardenDashboard
};
