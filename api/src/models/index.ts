import mongoose, { Document, Schema } from 'mongoose';

// Enums
export enum Role {
  USER = 'USER',
  ADMIN = 'ADMIN',
  TECHNICIAN = 'TECHNICIAN'
}

export enum IssueType {
  LEAKAGE = 'LEAKAGE',
  WATER_QUALITY_PROBLEM = 'WATER_QUALITY_PROBLEM',
  OTHER = 'OTHER'
}

export enum Severity {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  CRITICAL = 'CRITICAL'
}

export enum ReportStatus {
  PENDING = 'PENDING',
  IN_PROGRESS = 'IN_PROGRESS',
  RESOLVED = 'RESOLVED'
}

// Interfaces
export interface IUser extends Document {
  email: string;
  password: string;
  full_name?: string;
  role: Role;
  is_banned: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface IWaterReport extends Document {
  user_id: mongoose.Types.ObjectId;
  issue_type: IssueType;
  severity: Severity;
  description: string;
  location_address?: string;
  latitude?: number;
  longitude?: number;
  image_base64_data: string[];
  status: ReportStatus;
  assigned_to?: string;
  createdAt: Date;
  updatedAt: Date;
}

// Schemas
const UserSchema = new Schema<IUser>({
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  password: {
    type: String,
    required: true
  },
  full_name: {
    type: String,
    trim: true
  },
  role: {
    type: String,
    enum: Object.values(Role),
    default: Role.USER
  },
  is_banned: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: { createdAt: 'createdAt', updatedAt: 'updatedAt' }
});

const WaterReportSchema = new Schema<IWaterReport>({
  user_id: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  issue_type: {
    type: String,
    enum: Object.values(IssueType),
    required: true
  },
  severity: {
    type: String,
    enum: Object.values(Severity),
    required: true
  },
  description: {
    type: String,
    required: true
  },
  location_address: {
    type: String
  },
  latitude: {
    type: Number
  },
  longitude: {
    type: Number
  },
  image_base64_data: {
    type: [String],
    default: []
  },
  status: {
    type: String,
    enum: Object.values(ReportStatus),
    default: ReportStatus.PENDING
  },
  assigned_to: {
    type: String
  }
}, {
  timestamps: { createdAt: 'createdAt', updatedAt: 'updatedAt' }
});

// Create indexes
UserSchema.index({ email: 1 });
WaterReportSchema.index({ user_id: 1 });
WaterReportSchema.index({ status: 1 });
WaterReportSchema.index({ createdAt: -1 });

// Export models
export const User = mongoose.model<IUser>('User', UserSchema);
export const WaterReport = mongoose.model<IWaterReport>('WaterReport', WaterReportSchema);
