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
  
  // Verification & Recovery
  isEmailVerified: boolean;
  emailVerificationToken?: string;
  emailVerificationExpiry?: Date;
  resetPasswordToken?: string;
  resetPasswordExpiry?: Date;
  
  // Security lockouts
  loginAttempts: number;
  lockUntil?: Date;

  createdAt: Date;
  updatedAt: Date;
  
  // Instance methods
  isLocked(): boolean;
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
    
    // Verification & Recovery
    isEmailVerified: { type: Boolean, default: false },
    emailVerificationToken: { type: String },
    emailVerificationExpiry: { type: Date },
    resetPasswordToken: { type: String },
    resetPasswordExpiry: { type: Date },
    
    // Security lockouts
    loginAttempts: { type: Number, required: true, default: 0 },
    lockUntil: { type: Date },
  },
  { timestamps: true }
);

// Lockout helper checks
UserSchema.methods.isLocked = function (this: IUser): boolean {
  if (!this.lockUntil) return false;
  return this.lockUntil.getTime() > Date.now();
};

export const User = mongoose.model<IUser>('User', UserSchema);
