import mongoose from 'mongoose';
import dotenv from 'dotenv';
import readline from 'readline';
import User from '../models/User.model';

dotenv.config();

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

const question = (query: string): Promise<string> => {
  return new Promise((resolve) => {
    rl.question(query, resolve);
  });
};

const createAdmin = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/lagbe-kichu');
    console.log('✅ Connected to MongoDB\n');

    // Delete existing admin users
    const deletedAdmins = await User.deleteMany({ role: 'admin' });
    if (deletedAdmins.deletedCount > 0) {
      console.log(`🗑️  Removed ${deletedAdmins.deletedCount} existing admin user(s)\n`);
    } else {
      console.log('ℹ️  No existing admin users found\n');
    }

    // Get admin details from user
    console.log('Create New Admin User:');
    console.log('(Press Enter to use default values)\n');

    const name = await question('Admin Name [Admin]: ') || 'Admin';
    const email = await question('Admin Email [admin@lagbekichu.com]: ') || 'admin@lagbekichu.com';
    const password = await question('Admin Password [admin123]: ') || 'admin123';

    // Validate email format
    const emailRegex = /^\S+@\S+\.\S+$/;
    if (!emailRegex.test(email)) {
      throw new Error('Invalid email format');
    }

    // Validate password length
    if (password.length < 6) {
      throw new Error('Password must be at least 6 characters');
    }

    // Create new admin user
    const admin = await User.create({
      name,
      email,
      password,
      role: 'admin',
    });

    console.log('\n✅ Admin user created successfully!');
    console.log('📋 Admin Details:');
    console.log(`   Name: ${admin.name}`);
    console.log(`   Email: ${admin.email}`);
    console.log(`   Role: ${admin.role}`);
    console.log(`\n⚠️  Please change the password after first login!`);

    rl.close();
    await mongoose.connection.close();
    process.exit(0);
  } catch (error: any) {
    console.error('\n❌ Error creating admin:', error.message || error);
    rl.close();
    await mongoose.connection.close();
    process.exit(1);
  }
};

createAdmin();

