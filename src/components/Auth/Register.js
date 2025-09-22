import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import './Register.css';

const Register = () => {
  const [formData, setFormData] = useState({
    userId: '',
    rfidCardId: '',
    name: '',
    email: '',
    password: '',
    phone: '',
    role: 'student',
    srmId: '',
    hostelName: '',
    roomNumber: '',
    department: '',
    year: 1,
    semester: 1
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { register } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const userData = {
      userId: formData.userId,
      rfidCardId: formData.rfidCardId,
      name: formData.name,
      email: formData.email,
      password: formData.password,
      phone: formData.phone,
      role: formData.role
    };

    if (formData.role === 'student') {
      userData.studentDetails = {
        srmId: formData.srmId,
        hostelName: formData.hostelName,
        roomNumber: formData.roomNumber,
        department: formData.department,
        year: parseInt(formData.year),
        semester: parseInt(formData.semester)
      };
    }

    const result = await register(userData);
    
    if (result.success) {
      navigate('/dashboard');
    } else {
      setError(result.error);
    }
    
    setLoading(false);
  };

  return (
    <div className="register-container">
      <div className="register-card">
        <div className="register-header">
          <div className="register-logo">🎓</div>
          <h2 className="register-title">Create Account</h2>
          <p className="register-subtitle">
            Already have an account?{' '}
            <Link to="/login" className="register-link">
              Sign in here
            </Link>
          </p>
        </div>

        <form className="register-form" onSubmit={handleSubmit}>
          {error && (
            <div className="alert alert-danger">
              {error}
            </div>
          )}

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="userId" className="form-label">User ID</label>
              <input
                id="userId"
                name="userId"
                type="text"
                required
                className="form-input"
                placeholder="e.g., RA21CSE001"
                value={formData.userId}
                onChange={handleChange}
              />
            </div>

            <div className="form-group">
              <label htmlFor="rfidCardId" className="form-label">RFID Card ID</label>
              <input
                id="rfidCardId"
                name="rfidCardId"
                type="text"
                required
                className="form-input"
                placeholder="e.g., RFC123456"
                value={formData.rfidCardId}
                onChange={handleChange}
              />
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="name" className="form-label">Full Name</label>
            <input
              id="name"
              name="name"
              type="text"
              required
              className="form-input"
              placeholder="Enter your full name"
              value={formData.name}
              onChange={handleChange}
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="email" className="form-label">Email</label>
              <input
                id="email"
                name="email"
                type="email"
                required
                className="form-input"
                placeholder="your.email@srm.edu"
                value={formData.email}
                onChange={handleChange}
              />
            </div>

            <div className="form-group">
              <label htmlFor="phone" className="form-label">Phone</label>
              <input
                id="phone"
                name="phone"
                type="tel"
                required
                className="form-input"
                placeholder="Phone number"
                value={formData.phone}
                onChange={handleChange}
              />
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="password" className="form-label">Password</label>
            <input
              id="password"
              name="password"
              type="password"
              required
              minLength="6"
              className="form-input"
              placeholder="Create a password"
              value={formData.password}
              onChange={handleChange}
            />
          </div>

          <div className="form-group">
            <label htmlFor="role" className="form-label">Role</label>
            <select
              id="role"
              name="role"
              required
              className="form-select"
              value={formData.role}
              onChange={handleChange}
            >
              <option value="student">Student</option>
              <option value="teacher">Teacher</option>
              <option value="warden">Warden</option>
              <option value="parent">Parent</option>
            </select>
          </div>

          {formData.role === 'student' && (
            <>
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="department" className="form-label">Department</label>
                  <select
                    id="department"
                    name="department"
                    className="form-select"
                    value={formData.department}
                    onChange={handleChange}
                  >
                    <option value="">Select Department</option>
                    <option value="CSE">Computer Science</option>
                    <option value="ECE">Electronics</option>
                    <option value="MECH">Mechanical</option>
                    <option value="CIVIL">Civil</option>
                    <option value="IT">Information Technology</option>
                  </select>
                </div>

                <div className="form-group">
                  <label htmlFor="year" className="form-label">Year</label>
                  <select
                    id="year"
                    name="year"
                    className="form-select"
                    value={formData.year}
                    onChange={handleChange}
                  >
                    <option value="1">1st Year</option>
                    <option value="2">2nd Year</option>
                    <option value="3">3rd Year</option>
                    <option value="4">4th Year</option>
                  </select>
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="hostelName" className="form-label">Hostel</label>
                  <select
                    id="hostelName"
                    name="hostelName"
                    className="form-select"
                    value={formData.hostelName}
                    onChange={handleChange}
                  >
                    <option value="">Select Hostel</option>
                    <option value="Boys Hostel 1">Boys Hostel 1</option>
                    <option value="Boys Hostel 2">Boys Hostel 2</option>
                    <option value="Girls Hostel 1">Girls Hostel 1</option>
                    <option value="Girls Hostel 2">Girls Hostel 2</option>
                  </select>
                </div>

                <div className="form-group">
                  <label htmlFor="roomNumber" className="form-label">Room Number</label>
                  <input
                    id="roomNumber"
                    name="roomNumber"
                    type="text"
                    className="form-input"
                    placeholder="e.g., 101A"
                    value={formData.roomNumber}
                    onChange={handleChange}
                  />
                </div>
              </div>
            </>
          )}

          <button
            type="submit"
            disabled={loading}
            className="btn btn-primary btn-full"
          >
            {loading ? (
              <div className="flex items-center">
                <div className="spinner spinner-sm"></div>
                Creating Account...
              </div>
            ) : (
              'Create Account'
            )}
          </button>
        </form>
      </div>
    </div>
  );
};

export default Register;
