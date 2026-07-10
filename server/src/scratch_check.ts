import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { User } from './models/user.model';
import { Student, Department, Semester, Course, Parent } from './models/academic.models';

dotenv.config();

const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/edufin';

async function check() {
  await mongoose.connect(mongoUri);
  console.log('Connected to MongoDB');

  const depts = await Department.find();
  const sems = await Semester.find();
  const courses = await Course.find();
  
  console.log('Departments count:', depts.length);
  console.log('Semesters count:', sems.length);
  console.log('Courses count:', courses.length);

  if (depts.length > 0) {
    console.log('First Department:', depts[0]);
  }
  if (sems.length > 0) {
    console.log('First Semester:', sems[0]);
  }
  if (courses.length > 0) {
    console.log('First Course:', courses[0]);
  }

  await mongoose.disconnect();
}

check().catch(console.error);
