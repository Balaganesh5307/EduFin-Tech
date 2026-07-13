import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';
import bcrypt from 'bcrypt';

import authRoutes from './routes/auth.routes';
import dashboardRoutes from './routes/dashboard.routes';
import paymentRoutes from './routes/payment.routes';
import aiRoutes from './routes/ai.routes';
import studentRoutes from './routes/student.routes';
import academicRoutes from './routes/academic-mgmt.routes';
import attendanceRoutes from './routes/attendance.routes';
import studentFinanceRoutes from './routes/student-finance.routes';
import feeManagementRoutes from './routes/fee-management.routes';
import personalFinanceRoutes from './routes/personal-finance.routes';
import scholarshipRoutes from './routes/scholarship.routes';
import loanRoutes from './routes/loan.routes';
import portalRoutes from './routes/portal.routes';

import { User } from './models/user.model';
import { Student, Parent, Department, Course, Semester } from './models/academic.models';

dotenv.config();

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
  },
});

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/payment', paymentRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/students', studentRoutes);
app.use('/api/academic', academicRoutes);
app.use('/api/attendance', attendanceRoutes);
app.use('/api/student-finance', studentFinanceRoutes);
app.use('/api/fee-management', feeManagementRoutes);
app.use('/api/personal-finance', personalFinanceRoutes);
app.use('/api/scholarships', scholarshipRoutes);
app.use('/api/loans', loanRoutes);
app.use('/api/portals', portalRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date(),
    uptime: process.uptime(),
    dbState: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected'
  });
});

// Seed default users if none exist in the database
const seedUsers = async () => {
  try {
    const userCount = await User.countDocuments();
    if (userCount === 0) {
      console.log('No users found in database. Seeding default demo accounts...');
      
      const salt = await bcrypt.genSalt(10);
      const passwordHash = await bcrypt.hash('password123', salt);

      const demoUsers = [
        {
          email: 'superadmin@edufin.edu',
          passwordHash,
          name: 'Chief Admin Officer',
          role: 'SuperAdmin',
          status: 'Active',
          refreshTokens: []
        },
        {
          email: 'admin@edufin.edu',
          passwordHash,
          name: 'Academic Finance Admin',
          role: 'Admin',
          status: 'Active',
          refreshTokens: []
        },
        {
          email: 'faculty@edufin.edu',
          passwordHash,
          name: 'Dr. Sarah Connor',
          role: 'Faculty',
          status: 'Active',
          refreshTokens: []
        },
        {
          email: 'parent@edufin.edu',
          passwordHash,
          name: 'Robert Johnson (Parent)',
          role: 'Parent',
          status: 'Active',
          refreshTokens: []
        },
        {
          email: 'student@edufin.edu',
          passwordHash,
          name: 'Alex Johnson',
          role: 'Student',
          status: 'Active',
          refreshTokens: []
        }
      ];

      await User.insertMany(demoUsers);
      console.log('Demo accounts created successfully!');
      console.log('Use password "password123" to log in with any email:');
      console.log(' - superadmin@edufin.edu (SuperAdmin)');
      console.log(' - admin@edufin.edu (Admin)');
      console.log(' - faculty@edufin.edu (Faculty)');
      console.log(' - parent@edufin.edu (Parent)');
      console.log(' - student@edufin.edu (Student)');
    }

    // Ensure academic profiles are initialized for student@edufin.edu and parent@edufin.edu
    const studentUser = await User.findOne({ email: 'student@edufin.edu' });
    const parentUser = await User.findOne({ email: 'parent@edufin.edu' });

    if (studentUser) {
      let dept = await Department.findOne({ code: 'CSE' });
      if (!dept) {
        dept = new Department({
          name: 'Computer Science & Engineering',
          code: 'CSE',
          description: 'Department of Computer Science & Engineering'
        });
        await dept.save();
      }

      let course = await Course.findOne({ code: 'BTECH-CSE' });
      if (!course) {
        course = new Course({
          name: 'Bachelor of Technology in Computer Science',
          code: 'BTECH-CSE',
          credits: 180,
          department: dept._id
        });
        await course.save();
      }

      let sem = await Semester.findOne({ name: 'Semester 5' });
      if (!sem) {
        sem = new Semester({
          name: 'Semester 5',
          startDate: new Date('2026-06-01'),
          endDate: new Date('2026-11-30'),
          isActive: true
        });
        await sem.save();
      }

      let parentProfile = null;
      if (parentUser) {
        parentProfile = await Parent.findOne({ user: parentUser._id });
        if (!parentProfile) {
          parentProfile = new Parent({
            user: parentUser._id,
            children: [],
            relation: 'Father',
            occupation: 'Business'
          });
          await parentProfile.save();
        }
      }

      let studentProfile = await Student.findOne({ user: studentUser._id });
      if (!studentProfile) {
        studentProfile = new Student({
          user: studentUser._id,
          studentId: 'STU-2026-5831',
          rollNumber: '26-CSE-041',
          department: dept._id,
          course: course._id,
          currentSemester: sem._id,
          parent: parentProfile ? parentProfile._id : undefined,
          admissionDate: new Date()
        });
        await studentProfile.save();

        if (parentProfile) {
          parentProfile.children.push(studentProfile._id);
          await parentProfile.save();
        }
        console.log('Demo Student and Parent academic profiles seeded successfully.');
      }
    }
  } catch (error) {
    console.error('Error seeding database users:', error);
  }
};

// WebSockets connection
io.on('connection', (socket) => {
  console.log(`Socket Client connected: ${socket.id}`);
  
  socket.on('join_room', (userId) => {
    socket.join(userId);
    console.log(`User ${userId} joined their notifications socket room.`);
  });

  socket.on('disconnect', () => {
    console.log(`Socket Client disconnected: ${socket.id}`);
  });
});

// Database Connection & Server Startup
const PORT = process.env.PORT || 5000;
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/edufin';

mongoose
  .connect(MONGODB_URI)
  .then(async () => {
    console.log('MongoDB successfully connected.');
    await seedUsers();
    server.listen(PORT, () => {
      console.log(`EduFin backend server running on http://localhost:${PORT}`);
    });
  })
  .catch((err) => {
    console.warn('MongoDB connection failed. Starting server in Mock-DB Mode for preview...');
    console.warn(err);
    
    // Start Express server even if DB connection fails, so user can check local routes
    server.listen(PORT, () => {
      console.log(`EduFin backend server (MOCK-DB MODE) running on http://localhost:${PORT}`);
    });
  });
