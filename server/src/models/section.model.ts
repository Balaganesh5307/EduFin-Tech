import mongoose, { Schema, Document } from 'mongoose';

export interface ISection extends Document {
  name: string; // e.g., "Section A", "Section B"
  course: mongoose.Types.ObjectId; // Course ref
  semester: mongoose.Types.ObjectId; // Semester ref
  classRepresentative?: mongoose.Types.ObjectId; // Student ref
  mentor?: mongoose.Types.ObjectId; // Faculty ref
}

const SectionSchema: Schema = new Schema(
  {
    name: { type: String, required: true },
    course: { type: Schema.Types.ObjectId, ref: 'Course', required: true },
    semester: { type: Schema.Types.ObjectId, ref: 'Semester', required: true },
    classRepresentative: { type: Schema.Types.ObjectId, ref: 'Student' },
    mentor: { type: Schema.Types.ObjectId, ref: 'Faculty' },
  },
  { timestamps: true }
);

// Ensure unique sections per Course and Semester
SectionSchema.index({ name: 1, course: 1, semester: 1 }, { unique: true });

export const Section = mongoose.model<ISection>('Section', SectionSchema);
