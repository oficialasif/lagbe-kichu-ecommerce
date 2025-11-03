import dotenv from 'dotenv';
import path from 'path';
import { sendEmail } from '../utils/email';

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../../.env') });

/**
 * Test email configuration
 * Run: npm run test-email or npx ts-node src/scripts/testEmail.ts
 */
async function testEmail() {
  console.log('🧪 Testing Email Configuration...\n');

  // Check environment variables
  const emailHost = process.env.EMAIL_HOST;
  const emailPort = process.env.EMAIL_PORT;
  const emailUser = process.env.EMAIL_USER;
  const emailPass = process.env.EMAIL_PASS;

  console.log('📋 Configuration Check:');
  console.log(`   EMAIL_HOST: ${emailHost || '❌ Not set'}`);
  console.log(`   EMAIL_PORT: ${emailPort || '❌ Not set'}`);
  console.log(`   EMAIL_USER: ${emailUser ? `${emailUser.substring(0, 3)}...` : '❌ Not set'}`);
  console.log(`   EMAIL_PASS: ${emailPass ? '✅ Set' : '❌ Not set'}\n`);

  if (!emailHost || !emailUser || !emailPass) {
    console.error('❌ Email configuration is incomplete!');
    console.error('   Please check your .env file and ensure all email variables are set.');
    process.exit(1);
  }

  // Test email sending
  const testEmail = emailUser; // Send to yourself
  console.log(`📧 Sending test email to: ${testEmail}\n`);

  try {
    const result = await sendEmail({
      to: testEmail,
      subject: '🧪 Test Email - Lagbe Kichu',
      html: `
        <div style="font-family: Arial, sans-serif; padding: 20px; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #ff6b35;">✅ Email Test Successful!</h1>
          <p>Congratulations! Your email configuration is working correctly.</p>
          <p>This is a test email from your Lagbe Kichu backend application.</p>
          <hr style="margin: 20px 0; border: 1px solid #eee;">
          <p style="color: #666; font-size: 12px;">
            <strong>Configuration Details:</strong><br>
            Host: ${emailHost}<br>
            Port: ${emailPort}<br>
            User: ${emailUser}
          </p>
        </div>
      `,
    });

    if (result) {
      console.log('✅ Test email sent successfully!');
      console.log(`   Check your inbox: ${testEmail}`);
      console.log('\n🎉 Email configuration is working correctly!');
    } else {
      console.error('❌ Failed to send test email');
      console.error('   Please check:');
      console.error('   1. App Password is correct');
      console.error('   2. 2-Step Verification is enabled');
      console.error('   3. Gmail account settings allow SMTP');
      process.exit(1);
    }
  } catch (error: any) {
    console.error('❌ Error sending test email:');
    console.error(`   ${error.message}`);
    console.error('\n💡 Troubleshooting:');
    console.error('   1. Verify your App Password in .env');
    console.error('   2. Check that 2-Step Verification is enabled');
    console.error('   3. Ensure EMAIL_USER matches your Gmail address');
    process.exit(1);
  }
}

// Run test
testEmail();

