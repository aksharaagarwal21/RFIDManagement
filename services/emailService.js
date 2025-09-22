const nodemailer = require('nodemailer');

// Create transporter
const createTransporter = () => {
  return nodemailer.createTransporter({
    service: process.env.EMAIL_SERVICE || 'gmail',
    host: process.env.EMAIL_HOST || 'smtp.gmail.com',
    port: process.env.EMAIL_PORT || 587,
    secure: false, // true for 465, false for other ports
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS
    }
  });
};

// Send email
const sendEmail = async (options) => {
  try {
    const transporter = createTransporter();

    const mailOptions = {
      from: `"RFID University" <${process.env.EMAIL_USER}>`,
      to: options.to,
      subject: options.subject,
      html: options.html,
      text: options.text
    };

    const result = await transporter.sendMail(mailOptions);
    console.log('Email sent successfully:', result.messageId);
    return { success: true, messageId: result.messageId };
  } catch (error) {
    console.error('Email send failed:', error);
    return { success: false, error: error.message };
  }
};

// Send welcome email
const sendWelcomeEmail = async (user) => {
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #3b82f6;">Welcome to RFID University!</h2>
      <p>Dear ${user.name},</p>
      <p>Welcome to the RFID University Management System. Your account has been successfully created.</p>
      
      <div style="background-color: #f8fafc; padding: 20px; border-radius: 8px; margin: 20px 0;">
        <h3>Your Account Details:</h3>
        <p><strong>User ID:</strong> ${user.userId}</p>
        <p><strong>Email:</strong> ${user.email}</p>
        <p><strong>Role:</strong> ${user.role}</p>
        <p><strong>RFID Card ID:</strong> ${user.rfidCardId}</p>
      </div>
      
      <p>You can now access the system using your credentials. Please keep your RFID card safe as it will be used for attendance and access control.</p>
      
      <p>If you have any questions, please contact the IT support team.</p>
      
      <p>Best regards,<br>RFID University Team</p>
    </div>
  `;

  return await sendEmail({
    to: user.email,
    subject: 'Welcome to RFID University',
    html
  });
};

// Send attendance alert email
const sendAttendanceAlert = async (user, attendanceData) => {
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #f59e0b;">Attendance Alert</h2>
      <p>Dear ${user.name},</p>
      <p>Your attendance in <strong>${attendanceData.className}</strong> has fallen below the required threshold.</p>
      
      <div style="background-color: #fef3c7; padding: 20px; border-radius: 8px; margin: 20px 0;">
        <h3>Current Attendance:</h3>
        <p><strong>Percentage:</strong> ${attendanceData.percentage}%</p>
        <p><strong>Classes Attended:</strong> ${attendanceData.present}/${attendanceData.total}</p>
        <p><strong>Required:</strong> 75%</p>
      </div>
      
      <p>Please make sure to attend your classes regularly to maintain the minimum required attendance.</p>
      
      <p>Best regards,<br>RFID University Team</p>
    </div>
  `;

  return await sendEmail({
    to: user.email,
    subject: 'Attendance Alert - Action Required',
    html
  });
};

// Send exam notification email
const sendExamNotification = async (user, exam) => {
  const examDate = new Date(exam.examDate).toLocaleDateString();
  const examTime = new Date(exam.examDate).toLocaleTimeString();

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #3b82f6;">Exam Notification</h2>
      <p>Dear ${user.name},</p>
      <p>This is a reminder about your upcoming exam:</p>
      
      <div style="background-color: #eff6ff; padding: 20px; border-radius: 8px; margin: 20px 0;">
        <h3>${exam.examName}</h3>
        <p><strong>Subject:</strong> ${exam.className}</p>
        <p><strong>Date:</strong> ${examDate}</p>
        <p><strong>Time:</strong> ${examTime}</p>
        <p><strong>Duration:</strong> ${exam.duration} minutes</p>
        <p><strong>Hall:</strong> ${exam.examHall}</p>
        <p><strong>Total Marks:</strong> ${exam.totalMarks}</p>
      </div>
      
      ${exam.instructions ? `<p><strong>Instructions:</strong> ${exam.instructions}</p>` : ''}
      
      <p>Please be on time and bring all necessary materials.</p>
      
      <p>Best regards,<br>RFID University Team</p>
    </div>
  `;

  return await sendEmail({
    to: user.email,
    subject: `Exam Reminder: ${exam.examName}`,
    html
  });
};

module.exports = {
  sendEmail,
  sendWelcomeEmail,
  sendAttendanceAlert,
  sendExamNotification
};
