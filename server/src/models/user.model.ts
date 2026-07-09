import mongoose, { Schema, Document } from 'mongoose';

export type UserRole = 'SuperAdmin' | 'Admin' | 'Faculty' | 'Parent' | 'Student';
export type UserStatus = 'Active' | 'Inactive' | 'Pending';

export interface IUser extends Document {
  email: string;
  passwordHash: string;
  name: string;
  role: UserRole;
  status: UserStatus;
  refreshTokens: string[];
  avatar?: string;
  phoneNumber?: string;
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema: Schema = new Schema(
  {
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: true },
    name: { type: String, required: true },
    role: {
      type: String,
      required: true,
      enum: ['SuperAdmin', 'Admin', 'Faculty', 'Parent', 'Student'],
    },
    status: {
      type: String,
      required: true,
      enum: ['Active', 'Inactive', 'Pending'],
      default: 'Active',
    },
    refreshTokens: [{ type: String }],
    avatar: { type: String },
    phoneNumber: { type: String },
  },
  { timestamps: true }
);

export const User = mongoose.model<IUser>('User', UserSchema);
