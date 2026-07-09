import { Request, Response } from 'express';
import { Department, Course, Semester, Student } from '../models/academic.models';
import { Section } from '../models/section.model';
import { Enrollment, AcademicRecord } from '../models/student-extended.models';

// Departments
export const createDepartment = async (req: Request, res: Response) => {
  const { name, code, description, headOfDepartment } = req.body;
  try {
    const department = new Department({ name, code, description, headOfDepartment });
    await department.save();
    return res.status(201).json({ message: 'Department created successfully', department });
  } catch (error) {
    return res.status(500).json({ message: 'Error creating department', error });
  }
};

export const getDepartments = async (req: Request, res: Response) => {
  try {
    const departments = await Department.find().populate('headOfDepartment');
    return res.json({ departments });
  } catch (error) {
    return res.status(500).json({ message: 'Failed to fetch departments', error });
  }
};

// Courses
export const createCourse = async (req: Request, res: Response) => {
  const { name, code, credits, department } = req.body;
  try {
    const course = new Course({ name, code, credits, department });
    await course.save();
    return res.status(201).json({ message: 'Course created successfully', course });
  } catch (error) {
    return res.status(500).json({ message: 'Error creating course', error });
  }
};

export const getCourses = async (req: Request, res: Response) => {
  const { department } = req.query;
  try {
    const query = department ? { department } : {};
    const courses = await Course.find(query).populate('department', 'name code');
    return res.json({ courses });
  } catch (error) {
    return res.status(500).json({ message: 'Failed to fetch courses', error });
  }
};

// Semesters
export const createSemester = async (req: Request, res: Response) => {
  const { name, startDate, endDate, isActive } = req.body;
  try {
    const semester = new Semester({ name, startDate, endDate, isActive });
    await semester.save();
    return res.status(201).json({ message: 'Semester created successfully', semester });
  } catch (error) {
    return res.status(500).json({ message: 'Error creating semester', error });
  }
};

export const getSemesters = async (req: Request, res: Response) => {
  try {
    const semesters = await Semester.find().sort({ startDate: -1 });
    return res.json({ semesters });
  } catch (error) {
    return res.status(500).json({ message: 'Failed to fetch semesters', error });
  }
};

// Sections
export const createSection = async (req: Request, res: Response) => {
  const { name, course, semester, mentor } = req.body;
  try {
    const section = new Section({ name, course, semester, mentor });
    await section.save();
    return res.status(201).json({ message: 'Section created successfully', section });
  } catch (error) {
    return res.status(500).json({ message: 'Error creating section', error });
  }
};

export const getSections = async (req: Request, res: Response) => {
  const { course, semester } = req.query;
  try {
    const query: any = {};
    if (course) query.course = course;
    if (semester) query.semester = semester;

    const sections = await Section.find(query)
      .populate('course', 'name code')
      .populate('semester', 'name')
      .populate('mentor', 'name');
    return res.json({ sections });
  } catch (error) {
    return res.status(500).json({ message: 'Failed to fetch sections', error });
  }
};

// Enroll student in Course
export const enrollStudentInCourse = async (req: Request, res: Response) => {
  const { studentId, courseId, semesterId, sectionId, credits } = req.body;
  try {
    const enrollment = new Enrollment({
      student: studentId,
      course: courseId,
      semester: semesterId,
      section: sectionId,
      credits: credits || 4,
      status: 'Enrolled'
    });
    await enrollment.save();
    return res.status(201).json({ message: 'Student enrolled successfully', enrollment });
  } catch (error) {
    return res.status(500).json({ message: 'Enrollment transaction failed', error });
  }
};

// Academic progress summary
export const getAcademicSummary = async (req: Request, res: Response) => {
  const { studentId } = req.params;
  try {
    const student = await Student.findOne({ $or: [{ _id: studentId }, { user: studentId }] });
    if (!student) {
      return res.status(404).json({ message: 'Student profile not found' });
    }

    const record = await AcademicRecord.findOne({ student: student._id }).populate({
      path: 'gpaHistory.semester',
      select: 'name'
    });

    const enrollments = await Enrollment.find({ student: student._id, status: 'Enrolled' })
      .populate('course', 'name code credits')
      .populate('semester', 'name');

    return res.json({
      cgpa: record?.cgpa || 0.0,
      creditsEarned: record?.creditsEarned || 0,
      backlogCount: record?.backlogCount || 0,
      gpaHistory: record?.gpaHistory || [],
      currentEnrollments: enrollments
    });
  } catch (error) {
    return res.status(500).json({ message: 'Error retrieving academic summary', error });
  }
};
