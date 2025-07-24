import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';
import connectToDatabase from './lib/mongodb';
import { User, WaterReport, Role, IssueType, Severity, ReportStatus } from './models';

dotenv.config();

async function seedDatabase() {
  try {
    await connectToDatabase();
    console.log('Connected to MongoDB for seeding...');

    // Clear existing data
    await User.deleteMany({});
    await WaterReport.deleteMany({});
    console.log('Cleared existing data...');

    // Create admin user
    const adminPassword = await bcrypt.hash('admin123', 10);
    const adminUser = new User({
      email: 'admin@leakageapp.com',
      password: adminPassword,
      full_name: 'System Administrator',
      role: Role.ADMIN,
      is_banned: false
    });
    await adminUser.save();
    console.log('Created admin user...');

    // Create technician user
    const techPassword = await bcrypt.hash('tech123', 10);
    const techUser = new User({
      email: 'technician@leakageapp.com',
      password: techPassword,
      full_name: 'John Technician',
      role: Role.TECHNICIAN,
      is_banned: false
    });
    await techUser.save();
    console.log('Created technician user...');

    // Create regular users
    const users = [];
    for (let i = 1; i <= 5; i++) {
      const userPassword = await bcrypt.hash(`user${i}123`, 10);
      const user = new User({
        email: `user${i}@example.com`,
        password: userPassword,
        full_name: `User ${i}`,
        role: Role.USER,
        is_banned: false
      });
      await user.save();
      users.push(user);
    }
    console.log('Created regular users...');

    // Create sample water reports
    const sampleReports = [
      {
        user_id: users[0]._id,
        issue_type: IssueType.LEAKAGE,
        severity: Severity.HIGH,
        description: 'Major pipe leak on Main Street causing road flooding',
        location_address: '123 Main Street, Downtown',
        latitude: 40.7128,
        longitude: -74.0060,
        status: ReportStatus.PENDING,
        assigned_to: 'John Technician'
      },
      {
        user_id: users[1]._id,
        issue_type: IssueType.WATER_QUALITY_PROBLEM,
        severity: Severity.CRITICAL,
        description: 'Brown water coming from tap, possible contamination',
        location_address: '456 Oak Avenue, Residential Area',
        latitude: 40.7589,
        longitude: -73.9851,
        status: ReportStatus.IN_PROGRESS,
        assigned_to: 'John Technician'
      },
      {
        user_id: users[2]._id,
        issue_type: IssueType.LEAKAGE,
        severity: Severity.MEDIUM,
        description: 'Small leak under kitchen sink',
        location_address: '789 Pine Street, Suburb',
        latitude: 40.6892,
        longitude: -74.0445,
        status: ReportStatus.RESOLVED
      },
      {
        user_id: users[3]._id,
        issue_type: IssueType.OTHER,
        severity: Severity.LOW,
        description: 'Water pressure is very low in the bathroom',
        location_address: '321 Elm Street, Uptown',
        latitude: 40.7831,
        longitude: -73.9712,
        status: ReportStatus.PENDING
      },
      {
        user_id: users[4]._id,
        issue_type: IssueType.LEAKAGE,
        severity: Severity.CRITICAL,
        description: 'Burst water main flooding the street',
        location_address: '654 Maple Drive, Industrial District',
        latitude: 40.7282,
        longitude: -74.0776,
        status: ReportStatus.IN_PROGRESS,
        assigned_to: 'John Technician'
      },
    ];

    for (const reportData of sampleReports) {
      const report = new WaterReport(reportData);
      await report.save();
    }
    console.log('Created sample water reports...');

    console.log('Database seeded successfully!');
    console.log('\\nLogin credentials:');
    console.log('Admin: admin@leakageapp.com / admin123');
    console.log('Technician: technician@leakageapp.com / tech123');
    console.log('Users: user1@example.com to user5@example.com / user1123 to user5123');

    process.exit(0);
  } catch (error) {
    console.error('Error seeding database:', error);
    process.exit(1);
  }
}

seedDatabase();
