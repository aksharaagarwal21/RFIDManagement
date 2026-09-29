# RFID Smart Campus · Backend

The API for an RFID-based campus management system that handles attendance, exams, mess and hostel access, and campus security.

## Features

- JWT authentication with role-based access for students, teachers and wardens
- RFID scan logging, protected by a device secret
- Attendance, exam, mess and hostel access records
- Security alerts and notifications, with real-time updates over Socket.IO and email through Nodemailer
- Gamification points for students
- Rate limiting, Helmet security headers and input validation

## API routes

`/api/auth` · `/api/dashboard` · `/api/rfid` · `/api/attendance` · `/api/exam` · `/api/mess` · `/api/notifications` · `/api/security` · `/api/gamification`

## Tech stack

Node.js · Express · MongoDB (Mongoose) · Socket.IO · JWT · Nodemailer

## Run locally

```bash
npm install
```

Create a `.env` file:

```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/rfid_campus
JWT_SECRET=any_long_random_string
```

```bash
npm run setup-db   # creates sample data
npm run dev
```

The `src/` folder holds an early version of the React frontend. The full frontend is in [frontendddd](https://github.com/aksharaagarwal21/frontendddd).
